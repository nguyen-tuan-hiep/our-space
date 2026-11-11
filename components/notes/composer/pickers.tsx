"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSlidingIndicator } from "@/components/common/use-sliding-indicator";

/*
 * Option pickers for the decorate step: a round swatch row and a tile grid.
 * Each option is a toggle button with `aria-pressed`; the selected one is
 * marked with a ring and the group's gliding indicator.
 */

export function OptionGroup({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
	return (
		<div role="group" aria-label={label} className="grid gap-2.5">
			<div className="flex items-baseline justify-between gap-3">
				<span className="text-sm font-semibold text-foreground">{label}</span>
				{hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
			</div>
			{children}
		</div>
	);
}

export interface SwatchOption<T extends string> {
	id: T;
	label: string;
	/** Background of the swatch (a color or any CSS background). */
	swatch: string;
	/** Optional small center dot, e.g. the accent of an ink. */
	dot?: string;
}

export function SwatchGrid<T extends string>({ label, hint, options, value, onChange }: {
	label: string;
	hint?: string;
	options: ReadonlyArray<SwatchOption<T>>;
	value: T;
	onChange: (value: T) => void;
}) {
	return (
		<OptionGroup label={label} hint={hint}>
			<div className="flex flex-wrap gap-2.5">
				{options.map((option) => {
					const selected = option.id === value;
					return (
						<button
							key={option.id}
							type="button"
							aria-pressed={selected}
							title={option.label}
							onClick={() => onChange(option.id)}
							className={[
								"relative grid size-10 place-items-center rounded-full border border-black/10 shadow-[inset_0_1px_1px_rgb(255_255_255/0.6),0_1px_2px_rgb(0_0_0/0.08)] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
								selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-105",
							].join(" ")}
							style={{ background: option.swatch }}
						>
							{option.dot ? <span aria-hidden="true" className="size-3 rounded-full" style={{ background: option.dot }} /> : null}
							<span className="sr-only">{option.label}</span>
						</button>
					);
				})}
			</div>
		</OptionGroup>
	);
}

export interface TileOption<T extends string> {
	id: T;
	label: string;
	preview: ReactNode;
	/** Style applied to the preview box, e.g. a pattern background. */
	previewStyle?: CSSProperties;
	disabled?: boolean;
	/** Small badge in the tile's corner (the sticker's slot). */
	badge?: string;
}

export function TileGrid<T extends string>({ label, hint, options, value, onChange, columns = "grid-cols-3 sm:grid-cols-4", previewClassName = "" }: {
	label: string;
	hint?: string;
	options: ReadonlyArray<TileOption<T>>;
	/** Selected id, or a set of ids for multi-select grids. */
	value: T | ReadonlySet<T>;
	onChange: (value: T) => void;
	columns?: string;
	previewClassName?: string;
}) {
	const isSelected = (id: T) => (typeof value === "string" ? value === id : value.has(id));
	const selectionKey = typeof value === "string" ? value : [...value].join(",");
	const [gridRef, indicatorRef] = useSlidingIndicator<HTMLDivElement, HTMLSpanElement>(selectionKey);
	const single = typeof value === "string";

	return (
		<OptionGroup label={label} hint={hint}>
			<div ref={gridRef} className={`relative grid gap-2 ${columns}`}>
				{single ? <span ref={indicatorRef} aria-hidden="true" className="sliding-indicator rounded-2xl border-2 border-foreground" /> : null}
				{options.map((option) => {
					const selected = isSelected(option.id);
					return (
						<button
							key={option.id}
							type="button"
							aria-pressed={selected}
							disabled={option.disabled}
							data-indicator-target={single && selected ? "" : undefined}
							onClick={() => onChange(option.id)}
							className={[
								"group grid min-w-0 gap-1.5 rounded-2xl border p-1.5 pb-2 text-center transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40",
								selected && !single ? "border-foreground" : "border-primary-border bg-primary-subtle hover:border-foreground/40",
								selected && single ? "border-transparent" : "",
							].join(" ")}
						>
							<span
								aria-hidden="true"
								className={`relative grid h-14 place-items-center overflow-hidden rounded-xl border border-black/8 ${previewClassName}`}
								style={option.previewStyle}
							>
								{option.preview}
								{option.badge ? (
									<span className="absolute right-1 top-1 rounded-full bg-foreground px-1.5 text-[10px] font-semibold leading-4 text-background">{option.badge}</span>
								) : null}
							</span>
							<span className={`truncate text-[11px] font-semibold ${selected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{option.label}</span>
						</button>
					);
				})}
			</div>
		</OptionGroup>
	);
}
