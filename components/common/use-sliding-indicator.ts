"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Positions one highlight element over the selected child of a container and
 * lets CSS transition it between choices, so a selection glides instead of
 * jumping. The selected child is found with `[data-indicator-target]`; the
 * first placement (and resizes) skip the transition. Returns
 * `[containerRef, indicatorRef]`.
 */
export function useSlidingIndicator<C extends HTMLElement, I extends HTMLElement>(selectionKey: unknown) {
	const containerRef = useRef<C>(null);
	const indicatorRef = useRef<I>(null);

	useLayoutEffect(() => {
		const container = containerRef.current;
		const indicator = indicatorRef.current;
		if (!container || !indicator) return;

		const place = (animate: boolean) => {
			const target = container.querySelector<HTMLElement>("[data-indicator-target]");
			if (!target) {
				indicator.style.opacity = "0";
				return;
			}
			if (!animate) indicator.style.transition = "none";
			indicator.style.opacity = "1";
			indicator.style.width = `${target.offsetWidth}px`;
			indicator.style.height = `${target.offsetHeight}px`;
			indicator.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
			if (!animate) {
				void indicator.offsetWidth; // commit the jump before restoring transitions
				indicator.style.transition = "";
			}
		};

		const firstPlacement = !indicator.dataset.placed;
		place(!firstPlacement);
		indicator.dataset.placed = "";

		const observer = new ResizeObserver(() => place(false));
		observer.observe(container);
		return () => observer.disconnect();
	}, [selectionKey]);

	return [containerRef, indicatorRef] as const;
}
