import type { CurrencyCode, ExpenseCategory } from "@/lib/types";

export const expenseCategories: ExpenseCategory[] = [
  "Food & Drinks",
  "Shopping",
  "Travel/Transport",
  "Entertainment",
  "Groceries",
  "Utilities",
  "Others",
];

export const currencyByCountry = {
  VN: "VND",
  SG: "SGD",
} as const;

export const currencySymbols: Record<CurrencyCode, string> = {
  VND: "₫",
  SGD: "S$",
};

export const avatarOptions = [
  "heart",
  "sparkles",
  "camera",
  "coffee",
  "plane",
  "flower",
  "moon",
  "sun",
  "music",
  "crown",
  "gem",
  "star",
  "smile",
  "gamepad",
  "movie",
  "pizza",
] as const;

export const avatarStyles: Record<AvatarKey, { label: string; className: string }> = {
  heart: { label: "Heart", className: "bg-[#ffe4ec] text-[#b42355]" },
  sparkles: { label: "Sparkles", className: "bg-[#efe7ff] text-[#6d3ec1]" },
  camera: { label: "Camera", className: "bg-[#dff6ff] text-[#1d6f86]" },
  coffee: { label: "Coffee", className: "bg-[#f6eadc] text-[#82512f]" },
  plane: { label: "Plane", className: "bg-[#e3f1ff] text-[#2563a9]" },
  flower: { label: "Flower", className: "bg-[#e5f8e8] text-[#3d8b52]" },
  moon: { label: "Moon", className: "bg-[#e9ecf6] text-[#3c4971]" },
  sun: { label: "Sun", className: "bg-[#fff1ca] text-[#9a6500]" },
  music: { label: "Music", className: "bg-[#ffe9f7] text-[#a41e73]" },
  crown: { label: "Crown", className: "bg-[#fff0d5] text-[#9c5d08]" },
  gem: { label: "Gem", className: "bg-[#dffcf5] text-[#137a6b]" },
  star: { label: "Star", className: "bg-[#fff7cc] text-[#8b6d00]" },
  smile: { label: "Smile", className: "bg-[#e8f8ff] text-[#14718b]" },
  gamepad: { label: "Gamepad", className: "bg-[#e9f1dd] text-[#54772a]" },
  movie: { label: "Movie", className: "bg-[#ece7ff] text-[#4d3b9a]" },
  pizza: { label: "Pizza", className: "bg-[#ffe6d3] text-[#b5481c]" },
};

export type AvatarKey = (typeof avatarOptions)[number];

export function isAvatarKey(value: string): value is AvatarKey {
  return avatarOptions.includes(value as AvatarKey);
}

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-SG", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(amount);
}
