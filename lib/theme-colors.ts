import type { ExpenseCategory } from "@/lib/types";

export const themeColors = {
  bg: "#fafafa",
  paper: "#ffffff",
  mui: "#09090b",

  danger: "#dc2626",
  dangerBg: "#fee2e2",

  chartGrid: "#e5e5e5",
  darkBg: "#09090b",

  expenseCategories: {
    "Food & Drinks": "#F09EA7",
    Shopping: "#F6CA94",
    "Travel/Transport": "#FAFABE",
    Entertainment: "#C1EBC0",
    Groceries: "#C7CAFF",
    Utilities: "#CDABEB",
    Others: "#F6C2F3",
  } satisfies Record<ExpenseCategory, string>,

  ledgerSeries: ["#5dc1ff", "#ff7474"],
} as const;
