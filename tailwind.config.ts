import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#11110f",
        paper: "#f5f3ee",
        stone: "#d9d5cc",
        sage: "#71816d",
        rose: "#b76e79",
        lagoon: "#3f6f78",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Iowan Old Style", "Baskerville", "Times New Roman", "serif"],
      },
      boxShadow: {
        soft: "0 22px 70px rgba(17, 17, 15, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
