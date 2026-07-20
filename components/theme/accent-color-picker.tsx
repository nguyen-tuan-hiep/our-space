"use client";

import { Check } from "lucide-react";
import {
	accentColorPresets,
	type AccentColorPresetKey,
} from "@/lib/theme-colors";
import { useTheme } from "./theme-provider";

const accentColorEntries = Object.entries(accentColorPresets);

function getCheckColor(hexColor: string) {
	const hex = hexColor.replace("#", "");
	const red = Number.parseInt(hex.slice(0, 2), 16);
	const green = Number.parseInt(hex.slice(2, 4), 16);
	const blue = Number.parseInt(hex.slice(4, 6), 16);
	const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

	return luminance > 0.55 ? "#111111" : "#FFFFFF";
}

export function AccentColorPicker() {
	const { accentColor, setAccentColor } = useTheme();

	return (
		<div className="grid gap-3">
			<div className="grid grid-cols-8 gap-1.5 sm:gap-2">
				{accentColorEntries.map(([key, preset]) => {
					const selected = accentColor === key;

					return (
						<button
							key={key}
							type="button"
							aria-label={`Use ${preset.label} accent color`}
							aria-pressed={selected}
							title={preset.label}
							className={[
								"relative grid aspect-square min-h-9 place-items-center rounded-xl border p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.94] sm:min-h-10 sm:rounded-2xl",
								selected
									? "border-primary bg-surface-selected shadow-[0_10px_24px_rgba(23,23,23,0.12)]"
									: "border-primary-border bg-primary-subtle hover:border-primary hover:bg-primary-container-hover",
							].join(" ")}
							onClick={() => setAccentColor(key as AccentColorPresetKey)}
						>
							<span
								className="grid size-6 place-items-center rounded-full shadow-inner sm:size-7"
								style={{ backgroundColor: preset.value }}
							>
								{selected ? (
									<Check
										size={15}
										className="drop-shadow"
										style={{ color: getCheckColor(preset.value) }}
									/>
								) : null}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
