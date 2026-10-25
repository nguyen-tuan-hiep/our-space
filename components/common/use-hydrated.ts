"use client";

import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/** False during SSR and hydration, true once the client has taken over. */
export function useHydrated() {
	return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

/** Live `matchMedia` result; reports `false` on the server and during hydration. */
export function useMediaQuery(query: string) {
	return useSyncExternalStore(
		(onChange) => {
			const mediaQuery = window.matchMedia(query);
			mediaQuery.addEventListener("change", onChange);
			return () => mediaQuery.removeEventListener("change", onChange);
		},
		() => window.matchMedia(query).matches,
		() => false,
	);
}
