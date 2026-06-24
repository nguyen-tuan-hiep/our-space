import type { CurrencyCode, ExpenseCategory, LocationCode } from "@/lib/types";

export const expenseCategories: ExpenseCategory[] = [
  "Food & Drinks",
  "Shopping",
  "Travel/Transport",
  "Entertainment",
  "Groceries",
  "Utilities",
  "Others",
];

export const currencySymbols: Record<CurrencyCode, string> = {
  VND: "VND",
  SGD: "S$",
};

export const supportedCurrencies: CurrencyCode[] = ["VND", "SGD"];

export const supportedLocations: LocationCode[] = ["VN", "SG"];

export const locationSettings: Record<
  LocationCode,
  { label: string; flag: string; timeZone: string; currency: CurrencyCode }
> = {
  VN: {
    label: "Vietnam",
    flag: "🇻🇳",
    timeZone: "Asia/Ho_Chi_Minh",
    currency: "VND",
  },
  SG: {
    label: "Singapore",
    flag: "🇸🇬",
    timeZone: "Asia/Singapore",
    currency: "SGD",
  },
};

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  exchangeRateSgdToVnd: number | null,
) {
  if (from === to) return amount;
  if (!exchangeRateSgdToVnd || exchangeRateSgdToVnd <= 0) return null;
  if (from === "SGD" && to === "VND") return amount * exchangeRateSgdToVnd;
  if (from === "VND" && to === "SGD") return amount / exchangeRateSgdToVnd;
  return null;
}

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
  "cat",
  "dog",
  "bear",
  "panda",
  "fox",
  "penguin",
  "butterfly",
  "rose",
  "cherry",
  "strawberry",
  "cake",
  "boba",
  "ramen",
  "sushi",
  "beach",
  "rainbow",
  "fire",
  "rocket",
  "book",
  "paint",
  "gift",
  "ring",
  "home",
  "cloud",
] as const;

export const avatarEmojis: Record<AvatarKey, { label: string; emoji: string }> = {
  heart: { label: "Heart", emoji: "💖" },
  sparkles: { label: "Sparkles", emoji: "✨" },
  camera: { label: "Camera", emoji: "📸" },
  coffee: { label: "Coffee", emoji: "☕" },
  plane: { label: "Travel", emoji: "✈️" },
  flower: { label: "Flower", emoji: "🌸" },
  moon: { label: "Moon", emoji: "🌙" },
  sun: { label: "Sun", emoji: "☀️" },
  music: { label: "Music", emoji: "🎧" },
  crown: { label: "Crown", emoji: "👑" },
  gem: { label: "Gem", emoji: "💎" },
  star: { label: "Star", emoji: "⭐" },
  smile: { label: "Smile", emoji: "🥰" },
  gamepad: { label: "Game", emoji: "🎮" },
  movie: { label: "Movie", emoji: "🎬" },
  pizza: { label: "Pizza", emoji: "🍕" },
  cat: { label: "Cat", emoji: "🐱" },
  dog: { label: "Dog", emoji: "🐶" },
  bear: { label: "Bear", emoji: "🐻" },
  panda: { label: "Panda", emoji: "🐼" },
  fox: { label: "Fox", emoji: "🦊" },
  penguin: { label: "Penguin", emoji: "🐧" },
  butterfly: { label: "Butterfly", emoji: "🦋" },
  rose: { label: "Rose", emoji: "🌹" },
  cherry: { label: "Cherry", emoji: "🍒" },
  strawberry: { label: "Strawberry", emoji: "🍓" },
  cake: { label: "Cake", emoji: "🍰" },
  boba: { label: "Boba", emoji: "🧋" },
  ramen: { label: "Ramen", emoji: "🍜" },
  sushi: { label: "Sushi", emoji: "🍣" },
  beach: { label: "Beach", emoji: "🏝️" },
  rainbow: { label: "Rainbow", emoji: "🌈" },
  fire: { label: "Fire", emoji: "🔥" },
  rocket: { label: "Rocket", emoji: "🚀" },
  book: { label: "Book", emoji: "📚" },
  paint: { label: "Paint", emoji: "🎨" },
  gift: { label: "Gift", emoji: "🎁" },
  ring: { label: "Ring", emoji: "💍" },
  home: { label: "Home", emoji: "🏠" },
  cloud: { label: "Cloud", emoji: "☁️" },
};

export type AvatarKey = (typeof avatarOptions)[number];

export function isAvatarKey(value: string): value is AvatarKey {
  return avatarOptions.includes(value as AvatarKey);
}

export function isCustomAvatarEmoji(value: string) {
  const compact = value.trim();
  const emojiMatches = compact.match(/\p{Extended_Pictographic}/gu) ?? [];
  const withoutEmojiSyntax = compact
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0F\u200D]/gu, "")
    .trim();

  return (
    compact.length > 0 &&
    compact.length <= 12 &&
    /\p{Extended_Pictographic}/u.test(compact) &&
    emojiMatches.length === 1 &&
    withoutEmojiSyntax.length === 0
  );
}

export function extractEmojiOnly(value: string) {
  return (
    value.match(/\p{Extended_Pictographic}(?:\uFE0F|\u200D|\p{Extended_Pictographic})*/u)?.[0] ??
    ""
  );
}

export function normalizeGroupedNumberInput(value: string) {
  const [integerPart = "", decimalPart = ""] = value.trim().split(",");
  const integerDigits = integerPart.replace(/\D/g, "");
  const decimalDigits = decimalPart.replace(/\D/g, "");

  return decimalPart.length
    ? `${integerDigits}.${decimalDigits}`
    : integerDigits;
}

export function formatGroupedNumber(value: number | string, maxDecimals = 0) {
  const normalized =
    typeof value === "number"
      ? maxDecimals > 0
        ? value.toFixed(maxDecimals).replace(/\.?0+$/, "").replace(".", ",")
        : String(Math.round(value))
      : normalizeGroupedNumberInput(value).replace(".", ",");
  const [integerPart = "", decimalPart = ""] = normalized.split(",");
  const digits = integerPart.replace(/\D/g, "");
  const decimals = decimalPart.replace(/\D/g, "").slice(0, maxDecimals);
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (maxDecimals > 0 && normalized.includes(",")) {
    return `${grouped}${decimals ? `,${decimals}` : ","}`;
  }

  return grouped;
}

export function formatCurrency(amount: number, currency: CurrencyCode) {
  const formattedAmount =
    currency === "VND"
      ? formatGroupedNumber(amount)
      : formatGroupedNumber(amount, 2);

  if (currency === "VND") {
    return `${formattedAmount} VND`;
  }

  return `${currencySymbols[currency]}${formattedAmount}`;
}
