import type { Config } from "tailwindcss";
import { themeColors } from "./lib/theme-colors";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: themeColors.bg,
        paper: themeColors.paper,
        mui: themeColors.mui,
        danger: themeColors.danger,
        "danger-bg": themeColors.dangerBg,
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Iowan Old Style", "Baskerville", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
