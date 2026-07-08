"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const FAB_SIZE = 56;
const EDGE_MARGIN = 16;
const TOP_MARGIN = 16;
const BOTTOM_NAV_HEIGHT = 64;
const BOTTOM_NAV_GAP = 16;
const DRAG_THRESHOLD = 6;
const CLICK_SUPPRESS_MS = 250;

interface DraggableFabProps {
  ariaLabel: string;
  children: ReactNode;
  onClick: () => void;
}

type FabPosition = {
  x: number;
  y: number;
};

function getViewportSize() {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
      offsetTop: 0,
      offsetLeft: 0,
    };
  }

  const visualViewport = window.visualViewport;

  // Đảm bảo offsetTop không bị âm khi overscroll/pull-to-refresh
  const offsetTop = Math.max(0, visualViewport?.offsetTop ?? 0);

  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
    offsetTop,
    offsetLeft: visualViewport?.offsetLeft ?? 0,
  };
}

function readSafeAreaBottom() {
  if (typeof window === "undefined") return 0;

  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.left = "0";
  probe.style.bottom = "0";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.paddingBottom = "env(safe-area-inset-bottom)";

  document.body.appendChild(probe);

  const value = Number.parseFloat(getComputedStyle(probe).paddingBottom) || 0;

  probe.remove();

  return value;
}

function getNormalizedSafeBottom() {
  const rawSafeBottom = readSafeAreaBottom();

  return Math.min(Math.max(rawSafeBottom, 8), 16);
}

function getBottomClearance() {
  return BOTTOM_NAV_HEIGHT + BOTTOM_NAV_GAP + getNormalizedSafeBottom();
}

function getInitialPosition() {
  const viewport = getViewportSize();

  return clampPosition({
    x: viewport.offsetLeft + viewport.width - FAB_SIZE - EDGE_MARGIN,
    y: viewport.offsetTop + viewport.height - FAB_SIZE - getBottomClearance(),
  });
}

function clampPosition(position: FabPosition) {
  if (typeof window === "undefined") return position;

  const viewport = getViewportSize();

  const minX = viewport.offsetLeft + EDGE_MARGIN;
  const maxX = viewport.offsetLeft + viewport.width - FAB_SIZE - EDGE_MARGIN;
  const minY = viewport.offsetTop + TOP_MARGIN;
  const maxY = Math.max(
    minY,
    viewport.offsetTop + viewport.height - FAB_SIZE - getBottomClearance(),
  );

  return {
    x: Math.min(Math.max(minX, position.x), maxX),
    y: Math.min(Math.max(minY, position.y), maxY),
  };
}

function snapToHorizontalEdge(position: FabPosition) {
  if (typeof window === "undefined") return position;

  const clamped = clampPosition(position);
  const viewport = getViewportSize();
  const viewportCenter = viewport.offsetLeft + viewport.width / 2;
  const fabCenter = clamped.x + FAB_SIZE / 2;

  return {
    x:
      fabCenter < viewportCenter
        ? viewport.offsetLeft + EDGE_MARGIN
        : viewport.offsetLeft + viewport.width - FAB_SIZE - EDGE_MARGIN,
    y: clamped.y,
  };
}

export function DraggableFab({
  ariaLabel,
  children,
  onClick,
}: DraggableFabProps) {
  const [position, setPosition] = useState<FabPosition | null>(null);
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
  const suppressClickUntil = useRef(0);

  useEffect(() => {
    const initialPosition = getInitialPosition();

    latestPosition.current = initialPosition;
    setPosition(initialPosition);
  }, []);

  useEffect(() => {
    const handleViewportChange = () => {
      // Bỏ qua nếu người dùng đang kéo quá đà (overscroll)
      const isOverscrollingTop = window.scrollY < 0;
      const isOverscrollingBottom =
        window.scrollY >
        document.documentElement.scrollHeight - window.innerHeight;

      if (isOverscrollingTop || isOverscrollingBottom) {
        return;
      }

      setPosition((current) => {
        const next = snapToHorizontalEdge(current ?? getInitialPosition());

        latestPosition.current = next;

        return next;
      });
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      window.visualViewport?.removeEventListener(
        "resize",
        handleViewportChange,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        handleViewportChange,
      );
    };
  }, []);

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

      setIsDragging(false);
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

      if (!currentDrag.dragged) {
        currentDrag.dragged = true;
        setIsDragging(true);
      }

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

      const wasDragged = dragState.current?.dragged;

      if (wasDragged && latestPosition.current) {
        const snappedPosition = snapToHorizontalEdge(latestPosition.current);

        latestPosition.current = snappedPosition;
        setPosition(snappedPosition);

        suppressClickUntil.current =
          window.performance.now() + CLICK_SUPPRESS_MS;
      }

      dragState.current = null;
      setIsDragging(false);
    },
    [],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (window.performance.now() < suppressClickUntil.current) {
        event.preventDefault();
        event.stopPropagation();
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
      className={[
        "primary-action fixed z-40 grid size-14 touch-none select-none place-items-center rounded-full bg-neutral-950 text-neutral-50 transition hover:scale-[1.03] active:scale-[0.92] sm:hidden",
        isDragging
          ? "transition-none"
          : "transition-[left,top,transform,box-shadow] duration-300 ease-out",
      ].join(" ")}
      style={
        position
          ? {
              left: position.x,
              top: position.y,
            }
          : {
              right: EDGE_MARGIN,
              bottom: BOTTOM_NAV_HEIGHT + BOTTOM_NAV_GAP + 8,
            }
      }
    >
      {children}
    </button>
  );
}
