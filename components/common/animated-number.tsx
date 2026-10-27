"use client";

import { useCountUp } from "@/components/common/use-count-up";

/** A number that counts to its new value; `format` renders each frame. */
export function AnimatedNumber({ value, format = (n) => String(Math.round(n)), fromZero = false, delay = 0 }: {
	value: number;
	format?: (value: number) => string;
	/** Count up from 0 on mount (client-rendered panels only). */
	fromZero?: boolean;
	/** Wait this many ms before counting, e.g. until the line is revealed. */
	delay?: number;
}) {
	const display = useCountUp(value, { fromZero, delay });
	return <span className="tabular-nums">{format(display)}</span>;
}
