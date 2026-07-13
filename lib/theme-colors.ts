import type { ExpenseCategory, MemoryType } from "@/lib/types";

export const themeColors = {
  bg: "#fafafa",
  paper: "#ffffff",
  mui: "#09090b",

  danger: "#dc2626",
  dangerBg: "#fee2e2",

  chartGrid: "#e5e5e5",
  darkBg: "#09090b",

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
    "📍 Others": "#ECEFF1",
  } satisfies Record<ExpenseCategory, string>,

  memoryTypes: {
    "💞 Date": "#ffd6e7",
    "🍜 Food": "#ffe4bf",
    "✈️ Travel": "#cfe8ff",
    "💍 Anniversary": "#e7d7ff",
    "📸 Photo": "#d8f3dc",
    "🏕️ Outdoor & Nature": "#fff2b8",
    "🎸 Concert & Show": "#ffd7d7",
    "🎬 Movies": "#dbeafe",
    "📍 Others": "#e5e7eb",
  } satisfies Record<MemoryType, string>,

  ledgerSeries: ["#5dc1ff", "#ff7474"],
} as const;
