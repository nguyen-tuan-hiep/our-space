import type { Couple } from "@/lib/types";

const rateMaxAgeMs = 6 * 60 * 60 * 1000;
const defaultRateBase = "USD";
type ExchangeRateSettings = Pick<
  Couple,
  | "exchange_rates"
  | "exchange_rates_base"
  | "exchange_rate_updated_at"
  | "exchange_rate_source"
>;

export type ExchangeRateData = {
  ratesBase: string;
  rates: Record<string, number> | null;
  updatedAt: string | null;
  source: string | null;
};

function isFresh(value: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time < rateMaxAgeMs;
}

export function getExchangeRate(
  settings: ExchangeRateSettings | null,
): ExchangeRateData {
  if (
    settings?.exchange_rates &&
    isFresh(settings.exchange_rate_updated_at)
  ) {
    return {
      ratesBase: settings.exchange_rates_base ?? defaultRateBase,
      rates: settings.exchange_rates,
      updatedAt: settings.exchange_rate_updated_at,
      source: settings.exchange_rate_source,
    };
  }

  return {
    ratesBase: settings?.exchange_rates_base ?? defaultRateBase,
    rates: settings?.exchange_rates ?? null,
    updatedAt: null,
    source: null,
  };
}

function parseRates(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const entries = Object.entries(value).filter(
    (entry): entry is [string, number] =>
      /^[A-Z]{3}$/.test(entry[0]) &&
      typeof entry[1] === "number" &&
      Number.isFinite(entry[1]) &&
      entry[1] > 0,
  );

  return entries.length ? Object.fromEntries(entries) : null;
}

export async function fetchLatestExchangeRate(): Promise<ExchangeRateData | null> {
  const endpoint =
    process.env.EXCHANGE_RATES_URL ?? "https://open.er-api.com/v6/latest/USD";

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) return null;

    const payload = (await response.json()) as Record<string, unknown>;
    if (payload.result && payload.result !== "success") return null;

    const rates = parseRates(payload.rates);
    if (!rates) return null;

    const updatedAt =
      typeof payload.time_last_update_unix === "number"
        ? new Date(payload.time_last_update_unix * 1000).toISOString()
        : new Date().toISOString();

    return {
      ratesBase:
        typeof payload.base_code === "string" ? payload.base_code : defaultRateBase,
      rates,
      updatedAt,
      source: process.env.EXCHANGE_RATES_SOURCE ?? new URL(endpoint).hostname,
    };
  } catch (error) {
    console.warn("Exchange rate refresh failed", error);
    return null;
  }
}
