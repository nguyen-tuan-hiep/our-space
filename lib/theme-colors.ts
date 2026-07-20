import type { ExpenseCategory, MemoryType } from "@/lib/types";


export const accentColorPresets = {
  red: {
    label: "Red",
    value: "#E2726B",
  },
  scarlet: {
    label: "Scarlet",
    value: "#E07655",
  },
  coral: {
    label: "Coral",
    value: "#DB7C3F",
  },
  orange: {
    label: "Orange",
    value: "#D38328",
  },
  amber: {
    label: "Amber",
    value: "#C88B0D",
  },
  yellow: {
    label: "Yellow",
    value: "#BB9300",
  },
  lime: {
    label: "Lime",
    value: "#AA9A0D",
  },
  chartreuse: {
    label: "Chartreuse",
    value: "#96A228",
  },
  green: {
    label: "Green",
    value: "#7FA840",
  },
  forest: {
    label: "Forest",
    value: "#65AD58",
  },
  emerald: {
    label: "Emerald",
    value: "#44B16F",
  },
  mint: {
    label: "Mint",
    value: "#02B385",
  },
  teal: {
    label: "Teal",
    value: "#00B39A",
  },
  cyan: {
    label: "Cyan",
    value: "#00B2AF",
  },
  sky: {
    label: "Sky",
    value: "#00B0C1",
  },
  azure: {
    label: "Azure",
    value: "#00ACD1",
  },
  blue: {
    label: "Blue",
    value: "#00A6DE",
  },
  cobalt: {
    label: "Cobalt",
    value: "#3BA0E7",
  },
  indigo: {
    label: "Indigo",
    value: "#5C99ED",
  },
  violet: {
    label: "Violet",
    value: "#7692EE",
  },
  purple: {
    label: "Purple",
    value: "#8C8CEC",
  },
  fuchsia: {
    label: "Fuchsia",
    value: "#9F85E5",
  },
  magenta: {
    label: "Magenta",
    value: "#B07FDA",
  },
  pink: {
    label: "Pink",
    value: "#BF79CD",
  },
  rose: {
    label: "Rose",
    value: "#CB75BC",
  },
  ruby: {
    label: "Ruby",
    value: "#D572AA",
  },
  crimson: {
    label: "Crimson",
    value: "#DC7096",
  },
  berry: {
    label: "Berry",
    value: "#E07081",
  },
  stone: {
    label: "Stone",
    value: "#7A756D",
  },
  gray: {
    label: "Gray",
    value: "#737982",
  },
  slate: {
    label: "Slate",
    value: "#677284",
  },
  graphite: {
    label: "Graphite",
    value: "#55565B",
  },
} as const;

export type AccentColorPresetKey = keyof typeof accentColorPresets;

export const defaultAccentColorPresetKey = "blue" satisfies AccentColorPresetKey;

export function isAccentColorPresetKey(
  value: string | null | undefined,
): value is AccentColorPresetKey {
  return Boolean(
    value &&
      Object.prototype.hasOwnProperty.call(accentColorPresets, value),
  );
}

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
 *
 * Ví dụ:
 * mixColors("#2563EB", "#000000", 0.2)
 * nghĩa là pha thêm 20% màu đen.
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

function mixWithBlack(hex: string, amount: number): string {
  return mixColors(hex, "#000000", amount);
}

function mixWithWhite(hex: string, amount: number): string {
  return mixColors(hex, "#FFFFFF", amount);
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

function ensureWhiteTextContrast(hex: string): string {
  if (contrastRatio(hex, "#FFFFFF") >= 4.5) return hex;

  for (let amount = 0.14; amount <= 0.36; amount += 0.02) {
    const candidate = mixWithBlack(hex, amount);
    if (contrastRatio(candidate, "#FFFFFF") >= 4.5) {
      return candidate;
    }
  }

  return mixWithBlack(hex, 0.38);
}

export function createAccentPalette(baseColor: string) {
  /*
   * Accent chính
   */
  const primaryLight = ensureWhiteTextContrast(mixWithBlack(baseColor, 0.1));
  const primaryHoverLight = mixWithBlack(baseColor, 0.18);
  const primaryPressedLight = mixWithBlack(baseColor, 0.26);

  const primaryDark = ensureWhiteTextContrast(baseColor);
  // Darkening preserves white-text contrast and still gives hover/pressed
  // states a visible difference for bright user-selected accent colors.
  const primaryHoverDark = mixWithBlack(primaryDark, 0.08);
  const primaryPressedDark = mixWithBlack(primaryDark, 0.16);

  /*
   * Surface thực tế của sidebar/card.
   * Selected nên được pha từ surface này thay vì pha trực tiếp
   * màu base với trắng hoặc đen.
   */
  const surfaceLight = mixColors(
    "#FFFFFF",
    baseColor,
    0.022,
  );

  const surfaceDark = mixColors(
    "#1A1D20",
    baseColor,
    0.065,
  );

  /*
   * Hover trung tính.
   */
  const surfaceHoverLight = mixColors(
    surfaceLight,
    baseColor,
    0.065,
  );

  const surfaceHoverDark = mixColors(
    surfaceDark,
    baseColor,
    0.11,
  );

  /*
   * Selected rõ hơn sidebar:
   *
   * Light mode: pha 16% accent vào surface.
   * Dark mode: pha 24% accent vào surface.
   */
  const primaryContainerLight = mixColors(
    surfaceLight,
    baseColor,
    0.16,
  );

  const primaryContainerHoverLight = mixColors(
    surfaceLight,
    baseColor,
    0.21,
  );

  const primaryContainerDark = mixColors(
    surfaceDark,
    baseColor,
    0.24,
  );

  const primaryContainerHoverDark = mixColors(
    surfaceDark,
    baseColor,
    0.3,
  );

  return {
    /*
     * LIGHT MODE — background và surface
     */

    backgroundLight: mixColors(
      "#F7F8FA",
      baseColor,
      0.045,
    ),

    surfaceLight,

    surfaceHoverLight,

    surfaceElevatedLight: "#FFFFFF",

    surfaceSelectedLight: primaryContainerLight,

    /*
     * LIGHT MODE — accent
     */

    primaryLight,

    onPrimaryLight: "#FFFFFF",

    primaryHoverLight,
    primaryPressedLight,

    primaryContainerLight,

    onPrimaryContainerLight: mixWithBlack(
      baseColor,
      0.62,
    ),

    primaryContainerHoverLight,

    primaryBorderLight: mixColors(
      surfaceLight,
      baseColor,
      0.24,
    ),

    primarySubtleLight: mixColors(
      surfaceLight,
      baseColor,
      0.06,
    ),

    /*
     * DARK MODE — background và surface
     */

    backgroundDark: mixColors(
      "#101214",
      baseColor,
      0.055,
    ),

    surfaceDark,

    surfaceHoverDark,

    surfaceElevatedDark: mixColors(
      "#202429",
      baseColor,
      0.1,
    ),

    surfaceSelectedDark: primaryContainerDark,

    /*
     * DARK MODE — accent
     */

    primaryDark,

    onPrimaryDark: "#FFFFFF",

    primaryHoverDark,
    primaryPressedDark,

    primaryContainerDark,

    onPrimaryContainerDark: mixWithWhite(
      baseColor,
      0.82,
    ),

    primaryContainerHoverDark,

    primaryBorderDark: mixColors(
      surfaceDark,
      baseColor,
      0.34,
    ),

    primarySubtleDark: mixColors(
      surfaceDark,
      baseColor,
      0.1,
    ),

    /*
     * TEXT VÀ BORDER TRUNG TÍNH
     */

    textPrimaryLight: "#17191C",
    textSecondaryLight: "#5F6670",
    textMutedLight: "#8A919B",

    borderLight: mixColors(
      "#E3E6EA",
      baseColor,
      0.025,
    ),

    textPrimaryDark: "#F4F6F8",
    textSecondaryDark: "#D2D7DE",
    textMutedDark: "#A6ADB8",

    borderDark: mixColors(
      "#343A41",
      baseColor,
      0.04,
    ),

  };
}

const semanticColors = {
  dangerLight: "#e64747",
  // dangerLight: "#DC2626",
  onDangerLight: "#FFFFFF",
  dangerBackgroundLight: "#FEE2E2",

  dangerDark: "#F87171",
  onDangerDark: "#111111",
  dangerBackgroundDark: "#450A0A",
} as const;

/*
 * Màu mặc định.
 * Khi user chọn màu khác, truyền màu đó vào
 * createAccentPalette(userSelectedColor).
 */
const baseColor = accentColorPresets[defaultAccentColorPresetKey].value;

export function createThemeColorTokens(baseColor: string) {
  const palette = createAccentPalette(baseColor);
  const mutedLight = mixColors(palette.surfaceLight, baseColor, 0.045);
  const mutedDark = mixColors(palette.surfaceDark, "#FFFFFF", 0.045);

  return {
    baseColor,
    ...palette,

    /*
     * Aliases used by the existing Tailwind class names.
     * primary/secondary here mean app background/surface, while accent*
     * carries the user-selected color.
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
    input: palette.primaryBorderLight,
    ring: palette.primaryLight,
    chart1: palette.primaryLight,
    chart2: mixColors("#14B8A6", baseColor, 0.08),
    chart3: mixColors("#F59E0B", baseColor, 0.05),
    chart4: mixColors("#EF4444", baseColor, 0.04),
    chart5: mixColors("#8B5CF6", baseColor, 0.06),
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
    inputDark: palette.primaryBorderDark,
    ringDark: palette.primaryDark,
    chart1Dark: palette.primaryDark,
    chart2Dark: mixColors("#2DD4BF", baseColor, 0.1),
    chart3Dark: mixColors("#FBBF24", baseColor, 0.06),
    chart4Dark: mixColors("#F87171", baseColor, 0.05),
    chart5Dark: mixColors("#A78BFA", baseColor, 0.07),
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

  ledgerSeries: ["#5DC1FF", "#FF7474"],
} as const;
