import type { AppSettings } from "@/lib/types";

const rateMaxAgeMs = 6 * 60 * 60 * 1000;
const defaultRateBase = "USD";

function isFresh(value: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time < rateMaxAgeMs;
}

export function getExchangeRate(
  settings: AppSettings | null,
) {
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
