import { Quote } from "lucide-react";
import type { LoveQuote } from "@/lib/types";

interface LoveQuotePanelProps {
	quote: LoveQuote;
}

export function LoveQuotePanel({ quote }: LoveQuotePanelProps) {
	return (
		<div className="flex flex-row items-center gap-3 sm:gap-4">
			<div className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-neutral-700">
				<Quote
					size={18}
					className="block"
				/>
			</div>
			<div className="min-w-0">
				<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
					Quote of the day
				</p>
				{quote.text ? (
					<p className="mt-2 font-serif text-xl leading-snug text-neutral-900 sm:text-2xl">
						"{quote.text}"
					</p>
				) : (
					<p className="mt-2 font-serif text-xl leading-snug text-neutral-500 sm:text-2xl">
						Quote is unavailable right now.
					</p>
				)}
				{quote.author ? (
					<p className="mt-2 text-sm text-neutral-500">{quote.author}</p>
				) : null}
			</div>
		</div>
	);
}
