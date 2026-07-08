"use client";

import { useEffect, useState } from "react";

export function useDelayedRender(open: boolean, delayMs = 300) {
	const [shouldRender, setShouldRender] = useState(open);
	const closing = shouldRender && !open;

	useEffect(() => {
		if (open) {
			setShouldRender(true);
			return;
		}

		if (!shouldRender) return;

		const timeoutId = window.setTimeout(() => {
			setShouldRender(false);
		}, delayMs);

		return () => window.clearTimeout(timeoutId);
	}, [delayMs, open, shouldRender]);

	return { closing, shouldRender };
}
