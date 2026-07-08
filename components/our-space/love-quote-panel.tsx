import { Quote } from "lucide-react";
import type { LoveQuote } from "@/lib/types";

interface LoveQuotePanelProps {
	quote: LoveQuote;
}

export function LoveQuotePanel({ quote }: LoveQuotePanelProps) {
	return (
		<div className="flex flex-row items-center gap-3 rounded-2xl bg-paper p-4 shadow-md sm:gap-4">
			<div className="grid size-10 shrink-0 place-items-center rounded-full bg-mui/10 text-mui">
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
					<p className="mt-1 font-serif text-lg leading-snug text-neutral-900 sm:mt-2 sm:text-2xl">
						"{quote.text}"
					</p>
				) : (
					<p className="mt-1 font-serif text-lg leading-snug text-neutral-500 sm:mt-2 sm:text-2xl">
						Quote is unavailable right now.
					</p>
				)}
				{quote.author ? (
					<p className="mt-1 text-sm text-neutral-500 sm:mt-2">{quote.author}</p>
				) : null}
			</div>
		</div>
	);
}
