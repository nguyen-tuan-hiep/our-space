"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
	theme: ThemePreference;
	setTheme: (theme: ThemePreference) => void;
}

const THEME_STORAGE_KEY = "our-space-theme";
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

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<ThemePreference>("system");

	useEffect(() => {
		const storedTheme = getStoredTheme();
		setThemeState(storedTheme);
		applyTheme(storedTheme);

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
			setTheme: (nextTheme) => {
				try {
					window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
				} catch {
					// Theme changes should still apply when storage is unavailable.
				}

				setThemeState(nextTheme);
				applyTheme(nextTheme);
			},
		}),
		[theme],
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
