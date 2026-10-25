"use client";

import { useState } from "react";

/**
 * True for the render in which `open` turns on, or any of `deps` changes while
 * open. Callers reset form state right then, during render, instead of in an
 * effect (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
 */
export function useOpenSync(open: boolean, deps: readonly unknown[]) {
	const [synced, setSynced] = useState<readonly unknown[] | null>(null);
	const next = open ? deps : null;
	const changed = next === null
		? synced !== null
		: synced === null
			|| synced.length !== next.length
			|| next.some((value, index) => !Object.is(value, synced[index]));
	if (changed) setSynced(next);
	return changed && open;
}
