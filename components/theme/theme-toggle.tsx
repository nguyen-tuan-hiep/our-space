"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "./theme-provider";
import { useSlidingIndicator } from "@/components/common/use-sliding-indicator";
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
 * Segmented control: one frosted track with a lifted pill that glides to the
 * chosen option; switching appearance cross-fades the whole page.
 */
export function ThemeToggle({ onSelect, className }: { onSelect?: () => void; className?: string }) {
	const { theme, setTheme } = useTheme();
	const [trackRef, pillRef] = useSlidingIndicator<HTMLDivElement, HTMLSpanElement>(theme);

	return (
		<div
			ref={trackRef}
			role="group"
			aria-label="Appearance"
			className={["glass-chip relative grid grid-cols-3 gap-1 rounded-full p-1", className].filter(Boolean).join(" ")}
		>
			<span ref={pillRef} aria-hidden="true" className="glass-selected sliding-indicator rounded-full border" />
			{themeOptions.map((option) => {
				const Icon = option.icon;
				const selected = theme === option.value;

				return (
					<button
						key={option.value}
						type="button"
						className={[
							"inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
							selected
								? "border-transparent text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						].join(" ")}
						aria-label={`${option.label} mode`}
						title={`${option.label} mode`}
						aria-pressed={selected}
						data-indicator-target={selected ? "" : undefined}
						onClick={() => {
							if (option.value !== theme) runPageTransition(() => setTheme(option.value));
							onSelect?.();
						}}
					>
						<Icon size={14} aria-hidden="true" />
						<span>{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}
