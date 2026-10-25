"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const FAB_SIZE = 56;
const EDGE_MARGIN = 16;
const TOP_MARGIN = 16;
const BOTTOM_NAV_HEIGHT = 80;
const BOTTOM_NAV_GAP = 20;
const DRAG_THRESHOLD = 6;
const CLICK_SUPPRESS_MS = 250;

interface DraggableFabProps {
  ariaLabel: string;
  children: ReactNode;
  onClick: () => void;
}

/**
 * The FAB is anchored to the bottom edge and one side, never to a `top` in
 * pixels. On iOS the visual viewport resizes and reports transient offsets
 * while the toolbars collapse or the page rubber-bands; a top-based position
 * recomputed from those values could strand the button mid-screen. A bottom
 * anchor stays put no matter how the viewport height changes.
 */
type FabAnchor = {
  side: "left" | "right";
  /** Distance from the layout viewport's bottom edge, in px. */
  bottom: number;
};

function readSafeArea(side: "top" | "bottom") {
  if (typeof window === "undefined") return 0;

  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.paddingBottom = `env(safe-area-inset-${side})`;
  document.body.appendChild(probe);
  const value = Number.parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();

  return value;
}

function getBottomClearance() {
  const safeBottom = Math.min(Math.max(readSafeArea("bottom"), 8), 48);
  return BOTTOM_NAV_HEIGHT + BOTTOM_NAV_GAP + safeBottom;
}

/** Height of the layout viewport that `position: fixed` is measured against. */
function getLayoutHeight() {
  return document.documentElement.clientHeight || window.innerHeight;
}

function clampBottom(bottom: number) {
  const min = getBottomClearance();
  const max = Math.max(min, getLayoutHeight() - FAB_SIZE - TOP_MARGIN - readSafeArea("top"));
  return Math.min(Math.max(min, bottom), max);
}

export function DraggableFab({
  ariaLabel,
  children,
  onClick,
}: DraggableFabProps) {
  // null = resting at the default CSS spot (no measuring needed for SSR/hydration).
  const [anchor, setAnchor] = useState<FabAnchor | null>(null);
  // Free horizontal position while dragging; snapped to a side on release.
  const [dragX, setDragX] = useState<number | null>(null);

  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    dragged: boolean;
  } | null>(null);

  const latest = useRef<{ x: number; bottom: number } | null>(null);
  const suppressClickUntil = useRef(0);

  // Only a real layout change (rotation, window resize) can push the button
  // out of range; re-clamp then. Toolbar collapse no longer matters.
  useEffect(() => {
    const handleResize = () => {
      setAnchor((current) => (current ? { ...current, bottom: clampBottom(current.bottom) } : current));
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
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
      currentDrag.dragged = true;

      const maxX = window.innerWidth - FAB_SIZE - EDGE_MARGIN;
      const x = Math.min(Math.max(EDGE_MARGIN, event.clientX - currentDrag.offsetX), maxX);
      const top = event.clientY - currentDrag.offsetY;
      const bottom = clampBottom(getLayoutHeight() - top - FAB_SIZE);

      latest.current = { x, bottom };
      setDragX(x);
      setAnchor((current) => ({ side: current?.side ?? "right", bottom }));
    },
    [],
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (dragState.current?.dragged && latest.current) {
        const { x, bottom } = latest.current;
        const side = x + FAB_SIZE / 2 < window.innerWidth / 2 ? "left" : "right";
        setAnchor({ side, bottom });
        suppressClickUntil.current = window.performance.now() + CLICK_SUPPRESS_MS;
      }

      dragState.current = null;
      latest.current = null;
      setDragX(null);
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

  const dragging = dragX !== null;
  const style: React.CSSProperties = anchor
    ? {
        bottom: anchor.bottom,
        ...(dragging
          ? { left: dragX }
          : anchor.side === "left"
            ? { left: EDGE_MARGIN }
            : { right: EDGE_MARGIN }),
      }
    : {
        right: EDGE_MARGIN,
        bottom: `calc(${BOTTOM_NAV_HEIGHT + BOTTOM_NAV_GAP}px + clamp(8px, env(safe-area-inset-bottom), 48px))`,
      };

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
        "mobile-fab-in primary-action fixed z-40 grid size-14 touch-none select-none place-items-center rounded-full bg-primary text-primary-foreground transition hover:scale-[1.03] active:scale-[0.92] sm:hidden",
        dragging
          ? "transition-none"
          : "transition-[bottom,transform,box-shadow] duration-300 ease-out",
      ].join(" ")}
      style={style}
    >
      {children}
    </button>
  );
}
