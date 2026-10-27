"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Press-and-drag across a row of equal-width options (Apple's Liquid Glass tab
 * bars): the selection lens follows the finger and the option under it is
 * chosen on release. A plain tap still goes through each option's click; a
 * drag only starts after a small horizontal move, so vertical swipes keep
 * scrolling the page (give the track `touch-pan-y`).
 *
 * Spread `trackProps` on the track that holds the options. While dragging,
 * `lensX` is the lens's left edge in px from the track start (null otherwise)
 * and `hoverIndex` the option under it.
 */
export function useDragSelect(count: number, onSelect: (index: number) => void, disabled = false) {
	const drag = useRef<{ id: number; startX: number; left: number; width: number; active: boolean } | null>(null);
	// Lens position and the track width it was measured on.
	const [lens, setLens] = useState<{ x: number; width: number } | null>(null);
	const columnWidth = (width: number) => width / count;
	const lensLeft = (clientX: number, track: { left: number; width: number }) => {
		const column = columnWidth(track.width);
		return Math.min(Math.max(clientX - track.left - column / 2, 0), track.width - column);
	};
	const dragIndex = (x: number, width: number) => Math.round(x / columnWidth(width));

	const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
		const rect = event.currentTarget.getBoundingClientRect();
		drag.current = { id: event.pointerId, startX: event.clientX, left: rect.left, width: rect.width, active: false };
	};
	const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		const current = drag.current;
		if (!current || current.id !== event.pointerId) return;
		if (!current.active) {
			if (Math.abs(event.clientX - current.startX) < 6) return;
			current.active = true;
			// Capturing makes the release land on the track, so no option click fires.
			try {
				event.currentTarget.setPointerCapture(event.pointerId);
			} catch {
				// The pointer may already be gone; the drag still works without capture.
			}
		}
		setLens({ x: lensLeft(event.clientX, current), width: current.width });
	};
	const endDrag = (event: ReactPointerEvent<HTMLElement>, commit: boolean) => {
		const current = drag.current;
		if (!current || current.id !== event.pointerId) return;
		drag.current = null;
		if (!current.active) return;
		const index = dragIndex(lensLeft(event.clientX, current), current.width);
		setLens(null);
		if (commit) onSelect(index);
	};

	return {
		lensX: lens?.x ?? null,
		hoverIndex: lens ? dragIndex(lens.x, lens.width) : null,
		trackProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp: (event: ReactPointerEvent<HTMLElement>) => endDrag(event, true),
			onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => endDrag(event, false),
		},
	};
}
