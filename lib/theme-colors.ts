import type { ExpenseCategory } from "@/lib/types";

export const themeColors = {
  // colors for the app's main theme
  bg: "#e8e5df",
  paper: "#f5f3ee",
  mui: "#000000",

  // colors for danger states, used in the delete button
  danger: "#c24d5e",
  dangerBg: "#fdecef",


  chartGrid: "#e8e3d8",
  darkBg: "#10100f",
  darkText: "#f1f0ec",
  heroButtonBorder: "rgba(255, 250, 240, 0.95)",
  heroButtonBorderHover: "rgba(255, 250, 240, 1)",
  heroButtonBg: "rgba(17, 17, 15, 0.2)",

  // colors for expense categories, used in the chart and other places
  expenseCategories: {
    "Food & Drinks": "#F09EA7",
    Shopping: "#F6CA94",
    "Travel/Transport": "#FAFABE",
    Entertainment: "#C1EBC0",
    Groceries: "#C7CAFF",
    Utilities: "#CDABEB",
    Others: "#F6C2F3",
  } satisfies Record<ExpenseCategory, string>,

  // colors for each user in the ledger, used in the chart
  ledgerSeries: ["#99d2e7", "#ff6666"],
} as const;
