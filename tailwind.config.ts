import type { Config } from "tailwindcss";

const cssColor = (variable: string) =>
  `rgb(var(${variable}-rgb) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: cssColor("--theme-background"),
        foreground: cssColor("--theme-foreground"),
        surface: cssColor("--theme-surface"),
        "surface-hover": cssColor("--theme-surface-hover"),
        "surface-elevated": cssColor("--theme-surface-elevated"),
        "surface-selected": cssColor("--theme-surface-selected"),
        card: {
          DEFAULT: cssColor("--theme-card"),
          foreground: cssColor("--theme-card-foreground"),
        },
        popover: {
          DEFAULT: cssColor("--theme-popover"),
          foreground: cssColor("--theme-popover-foreground"),
        },
        primary: {
          DEFAULT: cssColor("--theme-primary"),
          foreground: cssColor("--theme-primary-foreground"),
          hover: cssColor("--theme-primary-hover"),
          pressed: cssColor("--theme-primary-pressed"),
          border: cssColor("--theme-primary-border"),
          subtle: cssColor("--theme-primary-subtle"),
          "container-hover": cssColor("--theme-primary-container-hover"),
        },
        secondary: {
          DEFAULT: cssColor("--theme-secondary"),
          foreground: cssColor("--theme-secondary-foreground"),
        },
        muted: {
          DEFAULT: cssColor("--theme-muted"),
          foreground: cssColor("--theme-muted-foreground"),
        },
        subtle: {
          foreground: cssColor("--theme-text-muted"),
        },
        accent: {
          DEFAULT: cssColor("--theme-accent"),
          foreground: cssColor("--theme-accent-foreground"),
        },
        destructive: {
          DEFAULT: cssColor("--theme-destructive"),
          foreground: cssColor("--theme-destructive-foreground"),
        },
        danger: cssColor("--theme-danger"),
        "danger-bg": cssColor("--theme-danger-bg"),
        chart: {
          1: cssColor("--theme-chart-1"),
          2: cssColor("--theme-chart-2"),
          3: cssColor("--theme-chart-3"),
          4: cssColor("--theme-chart-4"),
          5: cssColor("--theme-chart-5"),
        },
        sidebar: {
          DEFAULT: cssColor("--theme-sidebar"),
          foreground: cssColor("--theme-sidebar-foreground"),
          primary: cssColor("--theme-sidebar-primary"),
          "primary-foreground": cssColor("--theme-sidebar-primary-foreground"),
          accent: cssColor("--theme-sidebar-accent"),
          "accent-foreground": cssColor("--theme-sidebar-accent-foreground"),
          border: cssColor("--theme-sidebar-border"),
          ring: cssColor("--theme-sidebar-ring"),
        },
        border: cssColor("--theme-border"),
        input: cssColor("--theme-input"),
        ring: cssColor("--theme-ring"),
        neutral: {
          50: "rgb(var(--neutral-50) / <alpha-value>)",
          100: "rgb(var(--neutral-100) / <alpha-value>)",
          200: "rgb(var(--neutral-200) / <alpha-value>)",
          300: "rgb(var(--neutral-300) / <alpha-value>)",
          400: "rgb(var(--neutral-400) / <alpha-value>)",
          500: "rgb(var(--neutral-500) / <alpha-value>)",
          600: "rgb(var(--neutral-600) / <alpha-value>)",
          700: "rgb(var(--neutral-700) / <alpha-value>)",
          800: "rgb(var(--neutral-800) / <alpha-value>)",
          900: "rgb(var(--neutral-900) / <alpha-value>)",
          950: "rgb(var(--neutral-950) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Iowan Old Style", "Baskerville", "Times New Roman", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
