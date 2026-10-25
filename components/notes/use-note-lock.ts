"use client";

import { useCallback, useSyncExternalStore } from "react";

// Shared client clock. The cached value refreshes at most once per second so
// consecutive getSnapshot calls agree, as useSyncExternalStore requires.
let clockNow = 0;
function readClock() {
	const current = Date.now();
	if (current - clockNow >= 1000) clockNow = current;
	return clockNow;
}

/** Use the server clock for hydration, then tick only while a note is locked. */
export function useNoteLock(unlockAt: string | null, initialNowMs: number) {
	const unlockMs = unlockAt ? new Date(unlockAt).getTime() : 0;

	const subscribe = useCallback((onTick: () => void) => {
		if (!unlockMs || unlockMs <= Date.now()) return () => {};
		const timer = window.setInterval(() => {
			clockNow = Date.now();
			onTick();
			if (clockNow >= unlockMs) window.clearInterval(timer);
		}, 1000);
		return () => window.clearInterval(timer);
	}, [unlockMs]);
	const now = useSyncExternalStore(subscribe, readClock, () => initialNowMs);

	const totalSeconds = Math.max(0, Math.ceil((unlockMs - now) / 1000));
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const countdown = days > 0
		? `${days}d ${hours}h ${minutes}m`
		: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;

	return { locked: unlockMs > now, countdown };
}
