"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Eases a displayed number from its previous value to `value` (ease-out cubic).
 * By default the first render shows the value as-is, so server and client
 * markup agree, and only later changes count. `fromZero` also counts up on
 * mount — use it only in client-rendered panels. Reduced motion jumps straight
 * to the value.
 */
export function useCountUp(value: number, { duration = 520, fromZero = false, delay = 0 }: { duration?: number; fromZero?: boolean; delay?: number } = {}) {
	const [display, setDisplay] = useState(fromZero ? 0 : value);
	// The number currently on screen; each count starts from here, so an effect
	// that is cancelled and re-run (React StrictMode) still animates.
	const shown = useRef(fromZero ? 0 : value);

	useEffect(() => {
		const start = shown.current;
		if (start === value) return;
		const show = (next: number) => {
			shown.current = next;
			setDisplay(next);
		};
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let frame = 0;
		const begin = performance.now() + delay;
		const tick = (now: number) => {
			if (now < begin) {
				frame = window.requestAnimationFrame(tick);
				return;
			}
			const progress = reduce ? 1 : Math.min(1, (now - begin) / duration);
			const eased = 1 - Math.pow(1 - progress, 3);
			show(start + (value - start) * eased);
			if (progress < 1) frame = window.requestAnimationFrame(tick);
		};
		frame = window.requestAnimationFrame(tick);
		// Throttled frames (background tabs, low-power mode) must not strand the
		// number mid-count: land on the final value once the duration has passed.
		const settle = window.setTimeout(() => {
			window.cancelAnimationFrame(frame);
			show(value);
		}, delay + duration + 80);
		return () => {
			window.cancelAnimationFrame(frame);
			window.clearTimeout(settle);
		};
	}, [value, duration, delay]);

	return display;
}
