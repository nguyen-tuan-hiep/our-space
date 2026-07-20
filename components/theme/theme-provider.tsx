"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	accentColorPresets,
	createThemeCssVariables,
	defaultAccentColorPresetKey,
	isAccentColorPresetKey,
	type AccentColorPresetKey,
} from "@/lib/theme-colors";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
	theme: ThemePreference;
	accentColor: AccentColorPresetKey;
	setTheme: (theme: ThemePreference) => void;
	setAccentColor: (accentColor: AccentColorPresetKey) => void;
}

const THEME_STORAGE_KEY = "our-space-theme";
const ACCENT_COLOR_STORAGE_KEY = "our-space-accent-color";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemePreference {
	if (typeof window === "undefined") return "system";

	try {
		const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
		return stored === "light" || stored === "dark" || stored === "system"
			? stored
			: "system";
	} catch {
		return "system";
	}
}

function getStoredAccentColor(): AccentColorPresetKey {
	if (typeof window === "undefined") return defaultAccentColorPresetKey;

	try {
		const stored = window.localStorage.getItem(ACCENT_COLOR_STORAGE_KEY);
		return isAccentColorPresetKey(stored)
			? stored
			: defaultAccentColorPresetKey;
	} catch {
		return defaultAccentColorPresetKey;
	}
}

function getSystemTheme() {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme: ThemePreference) {
	const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
	document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
	document.documentElement.dataset.theme = theme;
}

function applyAccentColor(accentColor: AccentColorPresetKey) {
	const preset = accentColorPresets[accentColor];
	const variables = createThemeCssVariables(preset.value);

	Object.entries(variables).forEach(([name, value]) => {
		document.documentElement.style.setProperty(name, value);
	});

	document.documentElement.dataset.accentColor = accentColor;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<ThemePreference>("system");
	const [accentColor, setAccentColorState] = useState<AccentColorPresetKey>(
		defaultAccentColorPresetKey,
	);

	useEffect(() => {
		const storedTheme = getStoredTheme();
		const storedAccentColor = getStoredAccentColor();
		setThemeState(storedTheme);
		setAccentColorState(storedAccentColor);
		applyTheme(storedTheme);
		applyAccentColor(storedAccentColor);

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleSystemThemeChange = () => {
			if (getStoredTheme() === "system") applyTheme("system");
		};

		mediaQuery.addEventListener("change", handleSystemThemeChange);
		return () =>
			mediaQuery.removeEventListener("change", handleSystemThemeChange);
	}, []);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			accentColor,
			setTheme: (nextTheme) => {
				try {
					window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
				} catch {
					// Theme changes should still apply when storage is unavailable.
				}

				setThemeState(nextTheme);
				applyTheme(nextTheme);
			},
			setAccentColor: (nextAccentColor) => {
				try {
					window.localStorage.setItem(
						ACCENT_COLOR_STORAGE_KEY,
						nextAccentColor,
					);
				} catch {
					// Accent changes should still apply when storage is unavailable.
				}

				setAccentColorState(nextAccentColor);
				applyAccentColor(nextAccentColor);
			},
		}),
		[accentColor, theme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}
	return context;
}
