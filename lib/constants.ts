import type { CurrencyCode, ExpenseCategory, MemoryType } from "@/lib/types";
import { themeColors } from "@/lib/theme-colors";

export const expenseCategories: ExpenseCategory[] = [
  "🍔 Food & Drinks",
  "🛍️ Shopping",
  "🚗 Transportation",
  "🍿 Entertainment",
  "🛒 Groceries",
  "🏠 Housing & Utilities",
  "🏥 Health",
  "🎞️ Film",
  "📱 Subscriptions",
  "📍 Others",
];

export const expenseCategoryColors: Record<ExpenseCategory, string> =
  themeColors.expenseCategories;

export const ledgerSeriesColors = themeColors.ledgerSeries;

export const memoryTypeOptions: Array<{
  value: MemoryType;
}> = [
    { value: "💞 Date" },
    { value: "🍜 Food" },
    { value: "✈️ Travel" },
    { value: "💍 Anniversary" },
    { value: "📸 Photo" },
    { value: "🏕️ Outdoor & Nature" },
    { value: "🎸 Concert & Show" },
    { value: "🎬 Movies" },
    { value: "📍 Others" },
  ];

export const memoryTypeValues = memoryTypeOptions.map((option) => option.value);

export const memoryTypeColors: Record<MemoryType, string> =
  themeColors.memoryTypes;

const legacyMemoryTypeMap: Record<string, MemoryType> = {
  date: "💞 Date",
  food: "🍜 Food",
  trip: "✈️ Travel",
  anniversary: "💍 Anniversary",
  photo: "📸 Photo",
  outdoor: "🏕️ Outdoor & Nature",
  other: "📍 Others",
};

export function getMemoryTypeEmoji(memoryType: string) {
  return memoryType.trim().split(/\s+/)[0] || "📍";
}

export function getMemoryTypeColor(memoryType: string) {
  return memoryTypeColors[memoryType as MemoryType] ?? memoryTypeColors["📍 Others"];
}

export const defaultCountryCode = "SG";
export const defaultCurrency = "SGD";
export const defaultTimeZone = "UTC";

export const commonCurrencies: CurrencyCode[] = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "KRW",
  "THB",
  "MYR",
  "IDR",
  "PHP",
  "AUD",
  "CAD",
  "SGD",
  "VND",
];

export const supportedCountryCodes = [
  "AF",
  "AX",
  "AL",
  "DZ",
  "AS",
  "AD",
  "AO",
  "AI",
  "AQ",
  "AG",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BH",
  "BD",
  "BB",
  "BY",
  "BE",
  "BZ",
  "BV",
  "BR",
  "IO",
  "BN",
  "BG",
  "BF",
  "BI",
  "KH",
  "CM",
  "CA",
  "KY",
  "CF",
  "TD",
  "CL",
  "CN",
  "CX",
  "CC",
  "CO",
  "KM",
  "CG",
  "CD",
  "CK",
  "CR",
  "CI",
  "HR",
  "CU",
  "CW",
  "CY",
  "CZ",
  "DJ",
  "DM",
  "DO",
  "EC",
  "EG",
  "SV",
  "GQ",
  "ER",
  "EE",
  "SZ",
  "ET",
  "FK",
  "FO",
  "FJ",
  "FI",
  "FR",
  "GF",
  "PF",
  "TF",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GI",
  "GR",
  "GL",
  "GD",
  "GP",
  "GU",
  "GT",
  "GG",
  "GN",
  "GW",
  "GY",
  "HT",
  "HM",
  "VA",
  "HN",
  "HK",
  "HU",
  "IS",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IE",
  "IM",
  "IL",
  "IT",
  "JM",
  "JP",
  "JE",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KP",
  "KR",
  "KW",
  "KG",
  "LA",
  "LV",
  "LB",
  "LS",
  "LR",
  "LY",
  "LI",
  "LT",
  "LU",
  "MO",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MQ",
  "MR",
  "MU",
  "YT",
  "MX",
  "FM",
  "MD",
  "MC",
  "MN",
  "ME",
  "MS",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NC",
  "NZ",
  "NI",
  "NE",
  "NG",
  "NU",
  "NF",
  "MK",
  "MP",
  "NO",
  "OM",
  "PK",
  "PW",
  "PS",
  "PA",
  "PG",
  "PY",
  "PE",
  "PH",
  "PN",
  "PL",
  "PT",
  "PR",
  "QA",
  "RE",
  "RO",
  "RU",
  "RW",
  "BL",
  "SH",
  "KN",
  "LC",
  "MF",
  "PM",
  "VC",
  "WS",
  "SM",
  "ST",
  "SA",
  "SN",
  "RS",
  "SC",
  "SL",
  "SG",
  "SX",
  "SK",
  "SI",
  "SB",
  "SO",
  "ZA",
  "GS",
  "SS",
  "ES",
  "LK",
  "SD",
  "SR",
  "SJ",
  "SE",
  "CH",
  "SY",
  "TW",
  "TJ",
  "TZ",
  "TH",
  "TL",
  "TG",
  "TK",
  "TO",
  "TT",
  "TN",
  "TR",
  "TM",
  "TC",
  "TV",
  "UG",
  "UA",
  "AE",
  "GB",
  "US",
  "UM",
  "UY",
  "UZ",
  "VU",
  "VE",
  "VN",
  "VG",
  "VI",
  "EH",
  "YE",
  "ZM",
  "ZW",
] as const;

// just a subset of supportedCountryCodes that are more commonly used, for better UX in country selection dropdowns
export const commonCountryCodes = [
  "AU", // Australia
  "BR", // Brazil
  "CA", // Canada
  "CN", // China
  "DE", // Germany
  "ES", // Spain
  "FR", // France
  "GB", // United Kingdom
  "HK", // Hong Kong
  "ID", // Indonesia
  "IN", // India
  "IT", // Italy
  "JP", // Japan
  "KR", // South Korea
  "MY", // Malaysia
  "NL", // Netherlands
  "NZ", // New Zealand
  "PH", // Philippines
  "RU", // Russia
  "SG", // Singapore
  "TH", // Thailand
  "TW", // Taiwan
  "US", // United States
  "VN", // Vietnam
]

export function getSupportedCurrencyCodes() {
  // if (typeof Intl.supportedValuesOf === "function") {
  //   return Intl.supportedValuesOf("currency");
  // }

  return commonCurrencies;
}

export function getSupportedTimeZones() {
  return getUtcTimeZoneOptions().map((option) => option.value);
}

export function getUtcTimeZoneOptions() {
  return Array.from({ length: 27 }, (_, index) => {
    const offset = index - 12;
    const sign = offset >= 0 ? "+" : "-";
    const absoluteOffset = Math.abs(offset);
    const label = `UTC${sign}${String(absoluteOffset).padStart(2, "0")}:00`;

    return {
      label,
      value: offset === 0 ? "UTC" : `Etc/GMT${offset > 0 ? "-" : "+"}${absoluteOffset}`,
    };
  });
}

export function normalizeTimeZoneValue(value: string) {
  const compact = value.trim();
  if (!compact) return defaultTimeZone;

  if (compact === "UTC" || compact.startsWith("Etc/GMT")) return compact;

  const offset = getTimeZoneOffsetHours(compact);
  const option = getUtcTimeZoneOptions().find((item) => {
    return getTimeZoneOffsetHours(item.value) === offset;
  });

  return option?.value ?? defaultTimeZone;
}

function getTimeZoneOffsetHours(timeZone: string) {
  try {
    const now = new Date();
    const utcParts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    }).formatToParts(now);
    const zonedParts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).formatToParts(now);
    const getPart = (
      parts: Intl.DateTimeFormatPart[],
      type: Intl.DateTimeFormatPartTypes,
    ) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const utcDate = Date.UTC(
      getPart(utcParts, "year"),
      getPart(utcParts, "month") - 1,
      getPart(utcParts, "day"),
      getPart(utcParts, "hour"),
    );
    const zonedDate = Date.UTC(
      getPart(zonedParts, "year"),
      getPart(zonedParts, "month") - 1,
      getPart(zonedParts, "day"),
      getPart(zonedParts, "hour"),
    );

    return Math.round((zonedDate - utcDate) / 3600000);
  } catch {
    return 8;
  }
}

export function normalizeCurrencyCode(value: string) {
  return value.trim().toUpperCase();
}

export function getCurrencyFractionDigits(currency: CurrencyCode) {
  try {
    const fractionDigits = new Intl.NumberFormat("en", {
      style: "currency",
      currency: normalizeCurrencyCode(currency),
    }).resolvedOptions().maximumFractionDigits;
    return typeof fractionDigits === "number" ? fractionDigits : 2;
  } catch {
    return 2;
  }
}

export function normalizeCountryCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidCurrencyCode(value: string) {
  return /^[A-Z]{3}$/.test(normalizeCurrencyCode(value));
}

export function isValidCountryCode(value: string) {
  return /^[A-Z]{2}$/.test(normalizeCountryCode(value));
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  exchangeRates: Record<string, number> | null,
  exchangeRatesBase = "USD",
) {
  const fromCurrency = normalizeCurrencyCode(from);
  const toCurrency = normalizeCurrencyCode(to);
  const baseCurrency = normalizeCurrencyCode(exchangeRatesBase);

  if (fromCurrency === toCurrency) return amount;
  if (!exchangeRates) return null;

  const fromRate = fromCurrency === baseCurrency ? 1 : exchangeRates[fromCurrency];
  const toRate = toCurrency === baseCurrency ? 1 : exchangeRates[toCurrency];

  if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) return null;

  return (amount / fromRate) * toRate;
}

export const avatarOptions = [
  "💖",
  "✨",
  "📸",
  "☕",
  "✈️",
  "🌸",
  "🌙",
  "☀️",
  "🎧",
  "👑",
  "💎",
  "⭐",
  "🥰",
  "🎮",
  "🎬",
  "🍕",
  "🐱",
  "🐶",
  "🐻",
  "🐼",
  "🦊",
  "🐧",
  "🦋",
  "🌹",
  "🍒",
  "🍓",
  "🍰",
  "🧋",
  "🍜",
  "🍣",
  "🏝️",
  "🌈",
  "🔥",
  "🚀",
  "📚",
  "🎨",
  "🎁",
  "💍",
  "🏠",
  "☁️",
] as const;
function hasEmojiPresentation(value: string) {
  return /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(value);
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
  const lastEmoji = graphemes
    .filter((item) => hasEmojiPresentation(item))
    .at(-1);

  return lastEmoji && isCustomAvatarEmoji(lastEmoji) ? lastEmoji : "";
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
  const fractionDigits = getCurrencyFractionDigits(currency);

  if (fractionDigits === 0) return formatGroupedNumber(value, 0);

  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  const normalizedDigits = digits.replace(/^0+/, "") || "0";
  const paddedDigits = normalizedDigits.padStart(fractionDigits + 1, "0");

  const integerDigits = paddedDigits.slice(0, -fractionDigits);
  const decimalDigits = paddedDigits.slice(-fractionDigits);

  return `${groupIntegerDigits(integerDigits)},${decimalDigits}`;
}

export function formatStoredAmountForInput(
  value: number | string,
  currency: CurrencyCode,
) {
  const fractionDigits = getCurrencyFractionDigits(currency);

  if (fractionDigits === 0) {
    const numericValue =
      typeof value === "number"
        ? value
        : Number(normalizeGroupedNumberInput(String(value), fractionDigits));

    return Number.isFinite(numericValue)
      ? formatGroupedNumber(numericValue, 0)
      : formatGroupedNumber(String(value), 0);
  }

  return formatGroupedNumber(value, fractionDigits, true);
}

export function formatCurrency(
  amount: number | string,
  currency: CurrencyCode,
) {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const fractionDigits = getCurrencyFractionDigits(normalizedCurrency);
  const numericAmount =
    typeof amount === "number"
      ? amount
      : Number(normalizeGroupedNumberInput(String(amount), fractionDigits));
  const formattedAmount = formatGroupedNumber(
    amount,
    fractionDigits,
    fractionDigits > 0,
  );

  if (!formattedAmount) return "";

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay: "narrowSymbol",
    }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
  } catch {
    return `${formattedAmount} ${normalizedCurrency}`;
  }
}
