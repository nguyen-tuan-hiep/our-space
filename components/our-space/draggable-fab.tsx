"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const FAB_SIZE = 56;
const EDGE_MARGIN = 16;
const TOP_MARGIN = 16;
const BOTTOM_NAV_CLEARANCE = 112;
const DRAG_THRESHOLD = 6;

interface DraggableFabProps {
  ariaLabel: string;
  children: ReactNode;
  onClick: () => void;
}

type FabPosition = {
  x: number;
  y: number;
};

function clampPosition(position: FabPosition) {
  if (typeof window === "undefined") return position;

  const maxY = Math.max(
    TOP_MARGIN,
    window.innerHeight - FAB_SIZE - BOTTOM_NAV_CLEARANCE,
  );

  return {
    x: Math.min(
      Math.max(EDGE_MARGIN, position.x),
      window.innerWidth - FAB_SIZE - EDGE_MARGIN,
    ),
    y: Math.min(Math.max(TOP_MARGIN, position.y), maxY),
  };
}

function snapToHorizontalEdge(position: FabPosition) {
  if (typeof window === "undefined") return position;

  const clamped = clampPosition(position);
  const viewportCenter = window.innerWidth / 2;
  const fabCenter = clamped.x + FAB_SIZE / 2;

  return {
    x:
      fabCenter < viewportCenter
        ? EDGE_MARGIN
        : window.innerWidth - FAB_SIZE - EDGE_MARGIN,
    y: clamped.y,
  };
}

export function DraggableFab({ ariaLabel, children, onClick }: DraggableFabProps) {
  const [position, setPosition] = useState<FabPosition | null>(null);

  // 1. Thêm state để nhận biết đang kéo hay đã thả
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    dragged: boolean;
  } | null>(null);
  const latestPosition = useRef<FabPosition | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    if (!position) return;

    const handleResize = () => {
      setPosition((current) => {
        if (!current) return current;
        const next = snapToHorizontalEdge(current);
        latestPosition.current = next;
        return next;
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [position]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const rect = event.currentTarget.getBoundingClientRect();
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        dragged: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const currentDrag = dragState.current;
      if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

      const movedDistance = Math.hypot(
        event.clientX - currentDrag.startX,
        event.clientY - currentDrag.startY,
      );

      if (!currentDrag.dragged && movedDistance < DRAG_THRESHOLD) return;

      // 2. Kích hoạt trạng thái dragging khi vượt qua DRAG_THRESHOLD
      if (!currentDrag.dragged) {
        currentDrag.dragged = true;
        setIsDragging(true);
      }

      suppressClick.current = true;
      const nextPosition = clampPosition({
        x: event.clientX - currentDrag.offsetX,
        y: event.clientY - currentDrag.offsetY,
      });
      latestPosition.current = nextPosition;
      setPosition(nextPosition);
    },
    [],
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (dragState.current?.dragged && latestPosition.current) {
        const snappedPosition = snapToHorizontalEdge(latestPosition.current);
        latestPosition.current = snappedPosition;
        setPosition(snappedPosition);
      }

      dragState.current = null;
      // 3. Tắt trạng thái dragging ngay khi thả tay ra để bắt đầu hiệu ứng snap
      setIsDragging(false);
    },
    [],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (suppressClick.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
        return;
      }

      onClick();
    },
    [onClick],
  );

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      // 4. Bỏ class `transition` cũ đi và thay bằng logic toggle class ở cuối
      className={`fixed z-50 grid size-14 touch-none select-none place-items-center rounded-full bg-neutral-950 text-white shadow-[0_18px_40px_rgba(30,25,20,0.35)] active:scale-95 sm:hidden ${
        isDragging
          ? "transition-none"
          : "transition-all duration-300 ease-out"
      }`}
      style={
        position
          ? { left: position.x, top: position.y }
          : {
              right: "1.25rem",
              bottom: "calc(env(safe-area-inset-bottom) + 4.5rem)",
            }
      }
    >
      {children}
    </button>
  );
}