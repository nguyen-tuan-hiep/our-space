import type { CurrencyCode, ExpenseCategory, LocationCode } from "@/lib/types";
import { themeColors } from "@/lib/theme-colors";

export const expenseCategories: ExpenseCategory[] = [
  "Food & Drinks",
  "Shopping",
  "Travel/Transport",
  "Entertainment",
  "Groceries",
  "Utilities",
  "Others",
];

export const expenseCategoryColors: Record<ExpenseCategory, string> =
  themeColors.expenseCategories;

export const ledgerSeriesColors = themeColors.ledgerSeries;

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
function hasEmojiPresentation(value: string) {
  return /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(value);
}

function getGraphemes(value: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });

    return Array.from(segmenter.segment(value), (part) => part.segment);
  }

  return Array.from(value);
}

export function isCustomAvatarEmoji(value: string) {
  const compact = value.trim();

  if (!compact) return false;

  const graphemes = getGraphemes(compact);

  return (
    graphemes.length === 1 &&
    hasEmojiPresentation(compact) &&
    !/[A-Za-z0-9]/.test(compact)
  );
}

export function extractEmojiOnly(value: string) {
  const compact = value.trim();

  if (!compact) return "";

  const graphemes = getGraphemes(compact);
  const firstEmoji = graphemes.find((item) => hasEmojiPresentation(item));

  return firstEmoji && isCustomAvatarEmoji(firstEmoji) ? firstEmoji : "";
}

export function normalizeGroupedNumberInput(value: string, maxDecimals = 2) {
  const raw = value.trim();

  if (!raw) return "";

  const isNegative = raw.startsWith("-");
  const unsignedRaw = raw.replace(/^-/, "");

  let integerDigits = "";
  let decimalDigits = "";

  if (unsignedRaw.includes(",")) {
    const [integerPart = "", decimalPart = ""] = unsignedRaw.split(",", 2);

    integerDigits = integerPart.replace(/\D/g, "");
    decimalDigits = decimalPart.replace(/\D/g, "").slice(0, maxDecimals);
  } else {
    const dotParts = unsignedRaw.split(".");
    const looksLikeGroupedNumber = /^\d{1,3}(\.\d{3})+$/.test(unsignedRaw);
    const looksLikeDecimalNumber =
      maxDecimals > 0 &&
      dotParts.length === 2 &&
      !looksLikeGroupedNumber &&
      /^\d+$/.test(dotParts[0]) &&
      /^\d+$/.test(dotParts[1]);

    if (looksLikeDecimalNumber) {
      integerDigits = dotParts[0].replace(/\D/g, "");
      decimalDigits = dotParts[1].replace(/\D/g, "").slice(0, maxDecimals);
    } else {
      integerDigits = unsignedRaw.replace(/\D/g, "");
    }
  }

  integerDigits = integerDigits.replace(/^0+(?=\d)/, "");

  if (!integerDigits) {
    integerDigits = "0";
  }

  const sign = isNegative ? "-" : "";

  if (maxDecimals > 0 && decimalDigits) {
    return `${sign}${integerDigits}.${decimalDigits}`;
  }

  return `${sign}${integerDigits}`;
}

function groupIntegerDigits(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

  return (digits || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatGroupedNumber(
  value: number | string,
  maxDecimals = 0,
  fixedDecimals = false,
) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";

    const sign = value < 0 ? "-" : "";
    const absoluteValue = Math.abs(value);

    if (maxDecimals > 0) {
      const normalized = absoluteValue.toFixed(maxDecimals);
      const [integerPart = "", decimalPart = ""] = normalized.split(".");

      const grouped = groupIntegerDigits(integerPart);
      const decimals = fixedDecimals
        ? decimalPart.padEnd(maxDecimals, "0").slice(0, maxDecimals)
        : decimalPart.replace(/0+$/, "");

      return decimals ? `${sign}${grouped},${decimals}` : `${sign}${grouped}`;
    }

    return `${sign}${groupIntegerDigits(String(Math.round(absoluteValue)))}`;
  }

  const raw = value.trim();

  if (!raw) return "";

  const isNegative = raw.startsWith("-");
  const sign = isNegative ? "-" : "";
  const unsignedRaw = raw.replace(/^-/, "");

  let integerDigits = "";
  let decimalDigits = "";
  let hasDecimalSeparator = false;

  if (unsignedRaw.includes(",")) {
    const [integerPart = "", decimalPart = ""] = unsignedRaw.split(",", 2);

    integerDigits = integerPart.replace(/\D/g, "");
    decimalDigits = decimalPart.replace(/\D/g, "").slice(0, maxDecimals);
    hasDecimalSeparator = true;
  } else {
    const dotParts = unsignedRaw.split(".");
    const looksLikeGroupedNumber = /^\d{1,3}(\.\d{3})+$/.test(unsignedRaw);
    const looksLikeDecimalNumber =
      maxDecimals > 0 &&
      dotParts.length === 2 &&
      !looksLikeGroupedNumber &&
      /^\d+$/.test(dotParts[0]) &&
      /^\d+$/.test(dotParts[1]);

    if (looksLikeDecimalNumber) {
      integerDigits = dotParts[0].replace(/\D/g, "");
      decimalDigits = dotParts[1].replace(/\D/g, "").slice(0, maxDecimals);
      hasDecimalSeparator = true;
    } else {
      integerDigits = unsignedRaw.replace(/\D/g, "");
    }
  }

  const grouped = groupIntegerDigits(integerDigits);

  if (maxDecimals > 0) {
    const decimals = fixedDecimals
      ? decimalDigits.padEnd(maxDecimals, "0").slice(0, maxDecimals)
      : decimalDigits;

    if (fixedDecimals || hasDecimalSeparator) {
      return `${sign}${grouped},${decimals}`;
    }
  }

  return `${sign}${grouped}`;
}

export function formatCurrencyInputValue(
  value: string,
  currency: CurrencyCode,
) {
  if (currency === "VND") {
    return formatGroupedNumber(value, 0);
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  const normalizedDigits = digits.replace(/^0+/, "") || "0";
  const paddedDigits = normalizedDigits.padStart(3, "0");

  const integerDigits = paddedDigits.slice(0, -2);
  const decimalDigits = paddedDigits.slice(-2);

  return `${groupIntegerDigits(integerDigits)},${decimalDigits}`;
}

export function formatStoredAmountForInput(
  value: number | string,
  currency: CurrencyCode,
) {
  if (currency === "VND") {
    const numericValue =
      typeof value === "number"
        ? value
        : Number(normalizeGroupedNumberInput(String(value), 2));

    return Number.isFinite(numericValue)
      ? formatGroupedNumber(numericValue, 0)
      : formatGroupedNumber(String(value), 0);
  }

  return formatGroupedNumber(value, 2, true);
}

export function formatCurrency(
  amount: number | string,
  currency: CurrencyCode,
) {
  const formattedAmount =
    currency === "VND"
      ? formatGroupedNumber(amount, 0)
      : formatGroupedNumber(amount, 2, true);

  if (!formattedAmount) return "";

  if (currency === "VND") {
    return `${formattedAmount} VND`;
  }

  return `${currencySymbols[currency] ?? currency}${formattedAmount}`;
}
