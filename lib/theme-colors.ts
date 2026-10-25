import type { ExpenseCategory, MemoryType } from "@/lib/types";


/**
 * Monochrome palette: the "accent" is ink — near-black in light mode and
 * near-white in dark mode — so glass surfaces carry the hierarchy, not hue.
 */
export const brandAccentColor = "#1D1D1F";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

function normalizeHex(hex: string): string {
  const cleanHex = hex.trim().replace("#", "");

  if (/^[0-9a-fA-F]{3}$/.test(cleanHex)) {
    return cleanHex
      .split("")
      .map((character) => character + character)
      .join("");
  }

  if (/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return cleanHex;
  }

  throw new Error(`Invalid HEX color: ${hex}`);
}

function hexToRgb(hex: string): {
  r: number;
  g: number;
  b: number;
} {
  const normalizedHex = normalizeHex(hex);

  return {
    r: parseInt(normalizedHex.slice(0, 2), 16),
    g: parseInt(normalizedHex.slice(2, 4), 16),
    b: parseInt(normalizedHex.slice(4, 6), 16),
  };
}

function hexToRgbChannels(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

/**
 * Trộn sourceHex với targetHex.
 *
 * amount = 0: giữ nguyên sourceHex.
 * amount = 1: chuyển hoàn toàn thành targetHex.
 */
function mixColors(
  sourceHex: string,
  targetHex: string,
  amount: number,
): string {
  const source = hexToRgb(sourceHex);
  const target = hexToRgb(targetHex);
  const ratio = clamp(amount, 0, 1);

  const mixChannel = (
    sourceChannel: number,
    targetChannel: number,
  ): number =>
    Math.round(
      sourceChannel +
        (targetChannel - sourceChannel) * ratio,
    );

  const toHex = (value: number): string =>
    clamp(value, 0, 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(mixChannel(source.r, target.r))}${toHex(
    mixChannel(source.g, target.g),
  )}${toHex(
    mixChannel(source.b, target.b),
  )}`.toUpperCase();
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * toLinear(r) +
    0.7152 * toLinear(g) +
    0.0722 * toLinear(b)
  );
}

function contrastRatio(sourceHex: string, targetHex: string): number {
  const source = relativeLuminance(sourceHex);
  const target = relativeLuminance(targetHex);
  const lighter = Math.max(source, target);
  const darker = Math.min(source, target);

  return (lighter + 0.05) / (darker + 0.05);
}

/** Keep text and control outlines readable across every surface they appear on. */
function ensureForegroundContrast(color: string, backgrounds: string[], target: string, minimum = 4.5): string {
  if (backgrounds.every((background) => contrastRatio(color, background) >= minimum)) return color;
  for (let step = 1; step <= 100; step += 1) {
    const candidate = mixColors(color, target, step / 100);
    if (backgrounds.every((background) => contrastRatio(candidate, background) >= minimum)) return candidate;
  }
  return target;
}

/** Neutral canvases and frosted controls in the single light/dark design. */
export function getSurfaceContrastSamples(mode: "Light" | "Dark") {
  const dark = mode === "Dark";
  // Canvas includes the brightest/darkest point of the ambient gradient.
  const canvas = dark ? ["#000000", "#0B0B0C", "#1A1A1C"] : ["#EDEDF0", "#F4F4F6", "#FFFFFF"];
  // Cards are translucent (--glass-surface) over the canvas, not opaque —
  // sample the real composite so contrast checks see the worst-case backdrop.
  const cards = canvas.map((background) =>
    mixColors(background, dark ? "#2A2A2E" : "#FFFFFF", dark ? 0.5 : 0.55),
  );
  const fields = cards.map((background) => mixColors(background, dark ? "#141416" : "#FFFFFF", dark ? 0.5 : 0.7));
  return { canvas, cards, fields };
}

export function createAccentPalette(baseColor: string) {
  // Ink fills: dark ink on light canvas, light ink on dark canvas.
  const primaryLight = baseColor;
  const primaryHoverLight = mixColors(primaryLight, "#FFFFFF", 0.1);
  const primaryPressedLight = mixColors(primaryLight, "#FFFFFF", 0.18);

  const primaryDark = "#F5F5F7";
  const primaryHoverDark = "#E5E5EA";
  const primaryPressedDark = "#D1D1D6";

  const surfaceLight = "#FAFAFB";
  const surfaceDark = "#161618";

  const surfaceHoverLight = "#EEEEF0";
  const surfaceHoverDark = "#2A2A2D";

  // Selected/tonal states are neutral greys rather than tinted containers.
  const primaryContainerLight = "#E8E8EB";
  const primaryContainerHoverLight = "#DFDFE3";
  const primaryContainerDark = "#2C2C2F";
  const primaryContainerHoverDark = "#38383B";

  const glassLight = getSurfaceContrastSamples("Light");
  const lightSurfaces = [surfaceLight, "#FFFFFF", surfaceHoverLight, primaryContainerLight, primaryContainerHoverLight, ...glassLight.canvas, ...glassLight.cards, ...glassLight.fields];
  const glassDark = getSurfaceContrastSamples("Dark");
  const darkSurfaces = [surfaceDark, "#1C1C1E", surfaceHoverDark, primaryContainerDark, primaryContainerHoverDark, ...glassDark.canvas, ...glassDark.cards, ...glassDark.fields];

  return {
    backgroundLight: "#F2F2F4",
    surfaceLight,
    surfaceHoverLight,
    surfaceElevatedLight: "#FFFFFF",
    surfaceSelectedLight: primaryContainerLight,

    primaryLight,
    primaryInkLight: ensureForegroundContrast(baseColor, lightSurfaces, "#000000"),
    onPrimaryLight: "#FFFFFF",
    primaryHoverLight,
    primaryPressedLight,
    primaryContainerLight,
    onPrimaryContainerLight: "#1D1D1F",
    primaryContainerHoverLight,
    primaryBorderLight: "#C7C7CC",
    primarySubtleLight: "#F0F0F2",

    backgroundDark: "#000000",
    surfaceDark,
    surfaceHoverDark,
    surfaceElevatedDark: "#1C1C1E",
    surfaceSelectedDark: primaryContainerDark,

    primaryDark,
    primaryInkDark: ensureForegroundContrast(primaryDark, darkSurfaces, "#FFFFFF"),
    onPrimaryDark: "#1D1D1F",
    primaryHoverDark,
    primaryPressedDark,
    primaryContainerDark,
    onPrimaryContainerDark: "#F5F5F7",
    primaryContainerHoverDark,
    primaryBorderDark: "#4A4A4E",
    primarySubtleDark: "#1F1F22",

    textPrimaryLight: "#1D1D1F",
    textSecondaryLight: ensureForegroundContrast("#515154", lightSurfaces, "#000000"),
    textMutedLight: ensureForegroundContrast("#626266", lightSurfaces, "#000000"),
    borderLight: "#D2D2D7",

    textPrimaryDark: "#F5F5F7",
    textSecondaryDark: ensureForegroundContrast("#C7C7CC", darkSurfaces, "#FFFFFF"),
    textMutedDark: ensureForegroundContrast("#AEAEB2", darkSurfaces, "#FFFFFF"),
    borderDark: "#3A3A3D",
  };
}

const semanticColors = {
  dangerLight: "#BE3038",
  // dangerLight: "#DC2626",
  onDangerLight: "#FFFFFF",
  dangerBackgroundLight: "#FEE2E2",

  dangerDark: "#F87171",
  onDangerDark: "#111111",
  dangerBackgroundDark: "#450A0A",
} as const;

const baseColor = brandAccentColor;

export function createThemeColorTokens(baseColor: string) {
  const palette = createAccentPalette(baseColor);
  const mutedLight = mixColors(palette.surfaceLight, "#000000", 0.035);
  const mutedDark = mixColors(palette.surfaceDark, "#FFFFFF", 0.045);

  return {
    baseColor,
    ...palette,

    /*
     * Aliases used by the existing Tailwind class names.
     * primary/secondary here mean app background/surface, while accent*
     * carries the fixed brand color.
     */
    primaryLight: palette.backgroundLight,
    secondaryLight: palette.surfaceLight,
    primaryDark: palette.backgroundDark,
    secondaryDark: palette.surfaceDark,
    hoverLight: palette.surfaceHoverLight,
    hoverDark: palette.surfaceHoverDark,
    accentLight: palette.primaryLight,
    accentDark: palette.primaryDark,
    accentHoverLight: palette.primaryHoverLight,
    accentHoverDark: palette.primaryHoverDark,
    accentContainerLight: palette.primaryContainerLight,
    accentContainerDark: palette.primaryContainerDark,
    onAccentLight: palette.onPrimaryLight,
    onAccentDark: palette.onPrimaryDark,
    onAccentContainerLight: palette.onPrimaryContainerLight,
    onAccentContainerDark: palette.onPrimaryContainerDark,

    background: palette.backgroundLight,
    foreground: palette.textPrimaryLight,
    card: palette.surfaceLight,
    cardForeground: palette.textPrimaryLight,
    popover: palette.surfaceElevatedLight,
    popoverForeground: palette.textPrimaryLight,
    primary: palette.primaryLight,
    primaryForeground: palette.onPrimaryLight,
    secondary: palette.surfaceLight,
    secondaryForeground: palette.textPrimaryLight,
    muted: mutedLight,
    mutedForeground: palette.textSecondaryLight,
    accent: palette.primaryContainerLight,
    accentForeground: palette.onPrimaryContainerLight,
    destructive: semanticColors.dangerLight,
    destructiveForeground: semanticColors.onDangerLight,
    border: palette.borderLight,
    input: ensureForegroundContrast("#86868B", [palette.surfaceLight, palette.surfaceElevatedLight, ...getSurfaceContrastSamples( "Light").fields], "#000000", 3),
    ring: palette.primaryLight,
    chart1: palette.primaryLight,
    chart2: "#8E8E93",
    chart3: "#C2A878",
    chart4: "#D08A8A",
    chart5: "#A79EC2",
    sidebar: palette.surfaceLight,
    sidebarForeground: palette.textPrimaryLight,
    sidebarPrimary: palette.primaryLight,
    sidebarPrimaryForeground: palette.onPrimaryLight,
    sidebarAccent: palette.primaryContainerLight,
    sidebarAccentForeground: palette.onPrimaryContainerLight,
    sidebarBorder: palette.borderLight,
    sidebarRing: palette.primaryLight,

    backgroundDark: palette.backgroundDark,
    foregroundDark: palette.textPrimaryDark,
    cardDark: palette.surfaceDark,
    cardForegroundDark: palette.textPrimaryDark,
    popoverDark: palette.surfaceElevatedDark,
    popoverForegroundDark: palette.textPrimaryDark,
    primarySemanticDark: palette.primaryDark,
    primaryForegroundDark: palette.onPrimaryDark,
    secondarySemanticDark: palette.surfaceDark,
    secondaryForegroundDark: palette.textPrimaryDark,
    mutedDark,
    mutedForegroundDark: palette.textSecondaryDark,
    accentSemanticDark: palette.primaryContainerDark,
    accentForegroundDark: palette.onPrimaryContainerDark,
    destructiveDark: semanticColors.dangerDark,
    destructiveForegroundDark: semanticColors.onDangerDark,
    borderSemanticDark: palette.borderDark,
    inputDark: ensureForegroundContrast("#8E8E93", [palette.surfaceDark, palette.surfaceElevatedDark, ...getSurfaceContrastSamples( "Dark").fields], "#FFFFFF", 3),
    ringDark: palette.primaryDark,
    chart1Dark: palette.primaryDark,
    chart2Dark: "#8E8E93",
    chart3Dark: "#D4BC8E",
    chart4Dark: "#E0A0A0",
    chart5Dark: "#BDB5D6",
    sidebarDark: palette.surfaceDark,
    sidebarForegroundDark: palette.textPrimaryDark,
    sidebarPrimaryDark: palette.primaryDark,
    sidebarPrimaryForegroundDark: palette.onPrimaryDark,
    sidebarAccentDark: palette.primaryContainerDark,
    sidebarAccentForegroundDark: palette.onPrimaryContainerDark,
    sidebarBorderDark: palette.borderDark,
    sidebarRingDark: palette.primaryDark,
  };
}

export function createThemeCssVariables(baseColor: string) {
  const tokens = createThemeColorTokens(baseColor);

  const colorVariables = {
    /* Legacy aliases kept for existing CSS and gradual migration. */
    "--color-primary-light": tokens.primaryLight,
    "--color-secondary-light": tokens.secondaryLight,
    "--color-primary-dark": tokens.primaryDark,
    "--color-secondary-dark": tokens.secondaryDark,
    "--color-hover-light": tokens.hoverLight,
    "--color-hover-dark": tokens.hoverDark,
    "--color-accent-light": tokens.accentLight,
    "--color-accent-dark": tokens.accentDark,
    "--color-accent-hover-light": tokens.accentHoverLight,
    "--color-accent-hover-dark": tokens.accentHoverDark,
    "--color-accent-container-light": tokens.accentContainerLight,
    "--color-accent-container-dark": tokens.accentContainerDark,
    "--color-on-accent-light": tokens.onAccentLight,
    "--color-on-accent-dark": tokens.onAccentDark,
    "--color-on-accent-container-light": tokens.onAccentContainerLight,
    "--color-on-accent-container-dark": tokens.onAccentContainerDark,

    /* Semantic palette roles used by components. */
    "--theme-primary-ink-light": tokens.primaryInkLight,
    "--theme-primary-ink-dark": tokens.primaryInkDark,
    "--theme-surface-light": tokens.surfaceLight,
    "--theme-surface-dark": tokens.surfaceDark,
    "--theme-surface-hover-light": tokens.surfaceHoverLight,
    "--theme-surface-hover-dark": tokens.surfaceHoverDark,
    "--theme-surface-elevated-light": tokens.surfaceElevatedLight,
    "--theme-surface-elevated-dark": tokens.surfaceElevatedDark,
    "--theme-surface-selected-light": tokens.surfaceSelectedLight,
    "--theme-surface-selected-dark": tokens.surfaceSelectedDark,
    "--theme-primary-hover-light": tokens.primaryHoverLight,
    "--theme-primary-hover-dark": tokens.primaryHoverDark,
    "--theme-primary-pressed-light": tokens.primaryPressedLight,
    "--theme-primary-pressed-dark": tokens.primaryPressedDark,
    "--theme-primary-container-hover-light": tokens.primaryContainerHoverLight,
    "--theme-primary-container-hover-dark": tokens.primaryContainerHoverDark,
    "--theme-primary-border-light": tokens.primaryBorderLight,
    "--theme-primary-border-dark": tokens.primaryBorderDark,
    "--theme-primary-subtle-light": tokens.primarySubtleLight,
    "--theme-primary-subtle-dark": tokens.primarySubtleDark,
    "--theme-text-primary-light": tokens.textPrimaryLight,
    "--theme-text-primary-dark": tokens.textPrimaryDark,
    "--theme-text-secondary-light": tokens.textSecondaryLight,
    "--theme-text-secondary-dark": tokens.textSecondaryDark,
    "--theme-text-muted-light": tokens.textMutedLight,
    "--theme-text-muted-dark": tokens.textMutedDark,

    "--theme-danger-light": semanticColors.dangerLight,
    "--theme-danger-dark": semanticColors.dangerDark,
    "--theme-danger-bg-light": semanticColors.dangerBackgroundLight,
    "--theme-danger-bg-dark": semanticColors.dangerBackgroundDark,
    "--theme-background-light": tokens.background,
    "--theme-background-dark": tokens.backgroundDark,
    "--theme-foreground-light": tokens.foreground,
    "--theme-foreground-dark": tokens.foregroundDark,
    "--theme-card-light": tokens.card,
    "--theme-card-dark": tokens.cardDark,
    "--theme-card-foreground-light": tokens.cardForeground,
    "--theme-card-foreground-dark": tokens.cardForegroundDark,
    "--theme-popover-light": tokens.popover,
    "--theme-popover-dark": tokens.popoverDark,
    "--theme-popover-foreground-light": tokens.popoverForeground,
    "--theme-popover-foreground-dark": tokens.popoverForegroundDark,
    "--theme-primary-light": tokens.primary,
    "--theme-primary-dark": tokens.primarySemanticDark,
    "--theme-primary-foreground-light": tokens.primaryForeground,
    "--theme-primary-foreground-dark": tokens.primaryForegroundDark,
    "--theme-secondary-light": tokens.secondary,
    "--theme-secondary-dark": tokens.secondarySemanticDark,
    "--theme-secondary-foreground-light": tokens.secondaryForeground,
    "--theme-secondary-foreground-dark": tokens.secondaryForegroundDark,
    "--theme-muted-light": tokens.muted,
    "--theme-muted-dark": tokens.mutedDark,
    "--theme-muted-foreground-light": tokens.mutedForeground,
    "--theme-muted-foreground-dark": tokens.mutedForegroundDark,
    "--theme-accent-light": tokens.accent,
    "--theme-accent-dark": tokens.accentSemanticDark,
    "--theme-accent-foreground-light": tokens.accentForeground,
    "--theme-accent-foreground-dark": tokens.accentForegroundDark,
    "--theme-destructive-light": tokens.destructive,
    "--theme-destructive-dark": tokens.destructiveDark,
    "--theme-destructive-foreground-light": tokens.destructiveForeground,
    "--theme-destructive-foreground-dark": tokens.destructiveForegroundDark,
    "--theme-border-light": tokens.border,
    "--theme-border-dark": tokens.borderSemanticDark,
    "--theme-input-light": tokens.input,
    "--theme-input-dark": tokens.inputDark,
    "--theme-ring-light": tokens.ring,
    "--theme-ring-dark": tokens.ringDark,
    "--theme-chart-1-light": tokens.chart1,
    "--theme-chart-1-dark": tokens.chart1Dark,
    "--theme-chart-2-light": tokens.chart2,
    "--theme-chart-2-dark": tokens.chart2Dark,
    "--theme-chart-3-light": tokens.chart3,
    "--theme-chart-3-dark": tokens.chart3Dark,
    "--theme-chart-4-light": tokens.chart4,
    "--theme-chart-4-dark": tokens.chart4Dark,
    "--theme-chart-5-light": tokens.chart5,
    "--theme-chart-5-dark": tokens.chart5Dark,
    "--theme-sidebar-light": tokens.sidebar,
    "--theme-sidebar-dark": tokens.sidebarDark,
    "--theme-sidebar-foreground-light": tokens.sidebarForeground,
    "--theme-sidebar-foreground-dark": tokens.sidebarForegroundDark,
    "--theme-sidebar-primary-light": tokens.sidebarPrimary,
    "--theme-sidebar-primary-dark": tokens.sidebarPrimaryDark,
    "--theme-sidebar-primary-foreground-light": tokens.sidebarPrimaryForeground,
    "--theme-sidebar-primary-foreground-dark": tokens.sidebarPrimaryForegroundDark,
    "--theme-sidebar-accent-light": tokens.sidebarAccent,
    "--theme-sidebar-accent-dark": tokens.sidebarAccentDark,
    "--theme-sidebar-accent-foreground-light": tokens.sidebarAccentForeground,
    "--theme-sidebar-accent-foreground-dark": tokens.sidebarAccentForegroundDark,
    "--theme-sidebar-border-light": tokens.sidebarBorder,
    "--theme-sidebar-border-dark": tokens.sidebarBorderDark,
    "--theme-sidebar-ring-light": tokens.sidebarRing,
    "--theme-sidebar-ring-dark": tokens.sidebarRingDark,
  } as const;

  const rgbVariables = Object.fromEntries(
    Object.entries(colorVariables).map(([name, value]) => [
      `${name}-rgb`,
      hexToRgbChannels(value),
    ]),
  );

  return {
    ...colorVariables,
    ...rgbVariables,
    "--color-danger": "var(--theme-danger)",
    "--color-danger-rgb": "var(--theme-danger-rgb)",
    "--color-danger-bg": "var(--theme-danger-bg)",
    "--color-danger-bg-rgb": "var(--theme-danger-bg-rgb)",
    "--background": "var(--theme-background)",
    "--foreground": "var(--theme-foreground)",
    "--card": "var(--theme-card)",
    "--card-foreground": "var(--theme-card-foreground)",
    "--popover": "var(--theme-popover)",
    "--popover-foreground": "var(--theme-popover-foreground)",
    "--primary": "var(--theme-primary)",
    "--primary-foreground": "var(--theme-primary-foreground)",
    "--secondary": "var(--theme-secondary)",
    "--secondary-foreground": "var(--theme-secondary-foreground)",
    "--muted": "var(--theme-muted)",
    "--muted-foreground": "var(--theme-muted-foreground)",
    "--accent": "var(--theme-accent)",
    "--accent-foreground": "var(--theme-accent-foreground)",
    "--destructive": "var(--theme-destructive)",
    "--destructive-foreground": "var(--theme-destructive-foreground)",
    "--border": "var(--theme-border)",
    "--input": "var(--theme-input)",
    "--ring": "var(--theme-ring)",
    "--chart-1": "var(--theme-chart-1)",
    "--chart-2": "var(--theme-chart-2)",
    "--chart-3": "var(--theme-chart-3)",
    "--chart-4": "var(--theme-chart-4)",
    "--chart-5": "var(--theme-chart-5)",
    "--sidebar": "var(--theme-sidebar)",
    "--sidebar-foreground": "var(--theme-sidebar-foreground)",
    "--sidebar-primary": "var(--theme-sidebar-primary)",
    "--sidebar-primary-foreground": "var(--theme-sidebar-primary-foreground)",
    "--sidebar-accent": "var(--theme-sidebar-accent)",
    "--sidebar-accent-foreground": "var(--theme-sidebar-accent-foreground)",
    "--sidebar-border": "var(--theme-sidebar-border)",
    "--sidebar-ring": "var(--theme-sidebar-ring)",
  } as const;
}
export const themeColors = {
  ...createThemeColorTokens(baseColor),

  expenseCategories: {
    "🍔 Food & Drinks": "#FFECE0",
    "🛍️ Shopping": "#FFE5EC",
    "🚗 Transportation": "#E2EFFF",
    "🍿 Entertainment": "#E8E5FF",
    "🛒 Groceries": "#C7CAFF",
    "🏠 Housing & Utilities": "#FFF2CC",
    "🏥 Health": "#D1F2E5",
    "🎞️ Film": "#F5EBE6",
    "📱 Subscriptions": "#E0F7FA",
    "Others": "#ECEFF1",
  } satisfies Record<ExpenseCategory, string>,

  memoryTypes: {
    "💞 Date": "#FFD6E7",
    "🍜 Food": "#FFE4BF",
    "✈️ Travel": "#CFE8FF",
    "💍 Anniversary": "#E7D7FF",
    "📸 Photo": "#D8F3DC",
    "🏕️ Outdoor & Nature": "#FFF2B8",
    "🎸 Concert & Show": "#FFD7D7",
    "🎬 Movies": "#DBEAFE",
    "📍 Others": "#E5E7EB",
  } satisfies Record<MemoryType, string>,

  ledgerSeries: ["#8E8E93", "#D08A8A"],
} as const;
