import { Quote } from "lucide-react";
import type { LoveQuote } from "@/lib/types";

interface LoveQuotePanelProps {
	quote: LoveQuote;
}

export function LoveQuotePanel({ quote }: LoveQuotePanelProps) {
	return (
		<div className="glass-surface love-quote flex items-start gap-3 rounded-2xl px-4 py-4 sm:items-center sm:gap-4 sm:px-5">
			<div className="grid size-8 shrink-0 place-items-center text-muted-foreground">
				<Quote
					size={18}
					className="block"
				/>
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-xs font-semibold text-muted-foreground">
					A thought for us
				</p>
				{quote.text ? (
					<p className="mt-1 font-serif text-base leading-relaxed text-foreground sm:text-lg">
						&ldquo;{quote.text}&rdquo;
					</p>
				) : (
					<p className="mt-1 font-serif text-lg leading-snug text-muted-foreground sm:mt-2 sm:text-xl">
						Quote is unavailable right now.
					</p>
				)}
				{quote.author ? (
					<p className="mt-1 text-xs leading-5 text-muted-foreground">{quote.author}</p>
				) : null}
			</div>
		</div>
	);
}
