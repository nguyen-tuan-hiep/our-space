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
								? "border-accentLight bg-accentLight text-onAccentLight dark:border-accentDark dark:bg-accentDark dark:text-onAccentDark"
								: "border-accentLight/15 text-neutral-600 hover:border-accentLight hover:bg-accentContainerLight hover:text-onAccentContainerLight dark:border-accentDark/15 dark:hover:border-accentDark dark:hover:bg-accentContainerDark dark:hover:text-onAccentContainerDark",
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
