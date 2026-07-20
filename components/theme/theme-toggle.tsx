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
		<div className="grid grid-cols-3 gap-1 rounded-2xl">
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
							"h-9 rounded-xl border px-2 text-xs font-bold transition",
							selected
								? "border-primary bg-primary text-primary-foreground"
								: "border-primary-border bg-surface text-muted-foreground hover:border-primary hover:bg-primary-container-hover hover:text-accent-foreground",
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
