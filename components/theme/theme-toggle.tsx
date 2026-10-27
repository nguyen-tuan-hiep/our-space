"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "./theme-provider";
import { useDragSelect } from "@/components/common/use-drag-select";
import { runPageTransition } from "@/components/common/view-transition";

const themeOptions: Array<{
	value: ThemePreference;
	label: string;
	icon: typeof Sun;
}> = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];

/**
 * Segmented control: one frosted track with a glass lens that slides to the
 * chosen option (tap, or drag across like the bottom tabs); switching
 * appearance cross-fades the whole page.
 */
export function ThemeToggle({ onSelect, className }: { onSelect?: () => void; className?: string }) {
	const { theme, setTheme } = useTheme();
	const selectedIndex = Math.max(0, themeOptions.findIndex((option) => option.value === theme));
	const choose = (value: ThemePreference) => {
		if (value !== theme) runPageTransition(() => setTheme(value));
		onSelect?.();
	};
	const { lensX, hoverIndex, trackProps } = useDragSelect(themeOptions.length, (index) =>
		choose(themeOptions[index].value),
	);

	return (
		<div
			role="group"
			aria-label="Appearance"
			className={["glass-chip rounded-full p-1", className].filter(Boolean).join(" ")}
		>
			<div className="relative grid touch-pan-y grid-cols-3" {...trackProps}>
				<span
					aria-hidden="true"
					data-dragging={lensX === null ? undefined : ""}
					className="glass-selected tab-lens absolute inset-y-0 left-0 rounded-full border"
					style={{
						width: `calc(100% / ${themeOptions.length})`,
						transform: lensX === null ? `translateX(${selectedIndex * 100}%)` : `translateX(${lensX}px)`,
					}}
				/>
				{themeOptions.map((option, index) => {
					const Icon = option.icon;
					const selected = theme === option.value;
					const highlighted = hoverIndex === null ? selected : hoverIndex === index;

					return (
						<button
							key={option.value}
							type="button"
							className={[
								"relative z-10 inline-flex h-9 min-w-0 select-none items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition [-webkit-touch-callout:none]",
								highlighted ? "text-foreground" : "text-muted-foreground hover:text-foreground",
							].join(" ")}
							aria-label={`${option.label} mode`}
							title={`${option.label} mode`}
							aria-pressed={selected}
							onClick={() => choose(option.value)}
						>
							<Icon size={14} aria-hidden="true" />
							<span>{option.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
