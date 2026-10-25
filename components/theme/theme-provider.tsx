"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useSyncExternalStore,
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

// In-tab choice, kept even when storage is unavailable; setTheme notifies
// subscribers directly.
let chosenTheme: ThemePreference | null = null;
const themeListeners = new Set<() => void>();

function getCurrentTheme() {
	return chosenTheme ?? getStoredTheme();
}

function subscribeToTheme(onChange: () => void) {
	themeListeners.add(onChange);
	return () => {
		themeListeners.delete(onChange);
	};
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
	// The server snapshot matches the hydration default; the bootstrap script in
	// the root layout has already applied the stored theme before first paint.
	const theme = useSyncExternalStore<ThemePreference>(
		subscribeToTheme,
		getCurrentTheme,
		() => "system",
	);

	useEffect(() => {
		applyTheme(getCurrentTheme());

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleSystemThemeChange = () => {
			if (getCurrentTheme() === "system") applyTheme("system");
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

				chosenTheme = nextTheme;
				applyTheme(nextTheme);
				themeListeners.forEach((listener) => listener());
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
