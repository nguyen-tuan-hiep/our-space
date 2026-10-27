import type { ReactNode } from "react";

/** A card's title, set above the card instead of inside it. */
export function CardTitle({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
	return (
		<div className="min-w-0 px-1">
			<p className="eyebrow">{eyebrow}</p>
			<h3 className="mt-1 font-serif text-2xl leading-tight sm:text-3xl">{children}</h3>
		</div>
	);
}
