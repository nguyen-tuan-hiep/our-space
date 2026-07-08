"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemePreference } from "./theme-provider";

const themeOptions: Array<{
	value: ThemePreference;
	label: string;
	icon: typeof Sun;
}> = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ onSelect }: { onSelect?: () => void }) {
	const { theme, setTheme } = useTheme();

	return (
		<div className="grid grid-cols-3 gap-1 rounded-2xl border border-neutral-900/10 bg-bg p-1">
			{themeOptions.map((option) => {
				const Icon = option.icon;
				const selected = theme === option.value;

				return (
					<Button
						key={option.value}
						type="button"
						variant={selected ? "default" : "ghost"}
						size="sm"
						className={[
							"h-9 rounded-xl px-2 text-xs font-bold transition",
							selected
								? "bg-neutral-950 text-neutral-50 hover:bg-neutral-900"
								: "text-neutral-600 hover:bg-paper hover:text-neutral-950",
						].join(" ")}
						aria-pressed={selected}
						onClick={() => {
							setTheme(option.value);
							onSelect?.();
						}}
					>
						<Icon size={14} />
						<span className="hidden xl:inline">{option.label}</span>
					</Button>
				);
			})}
		</div>
	);
}
