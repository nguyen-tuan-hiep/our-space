import type { AppSettings } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const rateMaxAgeMs = 6 * 60 * 60 * 1000;
const defaultRateBase = "USD";

type ExchangeRatePayload = {
  result?: string;
  provider?: string;
  time_last_update_utc?: string;
  base_code?: string;
  rates?: Record<string, number>;
};

function isFresh(value: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time < rateMaxAgeMs;
}

async function fetchExchangeRates() {
  const baseCurrency = process.env.EXCHANGE_RATE_BASE ?? defaultRateBase;
  const rateUrl =
    process.env.EXCHANGE_RATE_API_URL ??
    `https://open.er-api.com/v6/latest/${baseCurrency}`;
  const response = await fetch(
    rateUrl,
    {
      cache: "no-store",
    },
  );
  if (!response.ok) return null;

  const payload = (await response.json()) as ExchangeRatePayload;
  if (!payload.rates || !Object.keys(payload.rates).length) return null;

  return {
    base: payload.base_code ?? baseCurrency,
    rates: payload.rates,
    source: payload.provider ?? "open.er-api.com",
  };
}

export async function getExchangeRate(
  settings: AppSettings | null,
  settingsId = settings?.id ?? "main",
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

  try {
    const fresh = await fetchExchangeRates();
    if (fresh) {
      const updatedAt = new Date().toISOString();
      const supabase = await createClient();
      await supabase.from("app_settings").upsert({
        id: settingsId,
        exchange_rates_base: fresh.base,
        exchange_rates: fresh.rates,
        exchange_rate_updated_at: updatedAt,
        exchange_rate_source: fresh.source,
        hero_image_url: settings?.hero_image_url ?? null,
        hero_image_public_id: settings?.hero_image_public_id ?? null,
        updated_by: settings?.updated_by ?? null,
      });

      return {
        ratesBase: fresh.base,
        rates: fresh.rates,
        updatedAt,
        source: fresh.source,
      };
    }
  } catch {
    // Keep the dashboard usable with the last cached rate below.
  }

  return {
    ratesBase: settings?.exchange_rates_base ?? defaultRateBase,
    rates: settings?.exchange_rates ?? null,
    updatedAt: null,
    source: null,
  };
}
