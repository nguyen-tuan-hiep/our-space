"use client";

import { useState } from "react";
import { useHydrated } from "@/components/common/use-hydrated";

/** Retain detail content while Base UI plays its exit transition. */
export function useDialogPresence<T>(value: T | null) {
	const [snapshot, setSnapshot] = useState<T | null>(value);
	const hydrated = useHydrated();
	// Adjust during render (not in an effect) so the snapshot never lags a frame.
	if (value !== null && value !== snapshot) setSnapshot(value);
	return { content: value ?? snapshot, open: hydrated && value !== null };
}
