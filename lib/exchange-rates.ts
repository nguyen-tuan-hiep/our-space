import type { AppSettings } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const rateMaxAgeMs = 6 * 60 * 60 * 1000;
const defaultRateUrl = "https://open.er-api.com/v6/latest/SGD";

type ExchangeRatePayload = {
  result?: string;
  provider?: string;
  time_last_update_utc?: string;
  rates?: {
    VND?: number;
  };
};

function isFresh(value: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time < rateMaxAgeMs;
}

async function fetchSgdToVndRate() {
  const response = await fetch(process.env.EXCHANGE_RATE_API_URL ?? defaultRateUrl, {
    cache: "no-store",
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as ExchangeRatePayload;
  const rate = payload.rates?.VND;
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;

  return {
    rate,
    source: payload.provider ?? "open.er-api.com",
  };
}

export async function getExchangeRate(settings: AppSettings | null) {
  if (settings?.exchange_rate_sgd_vnd && isFresh(settings.exchange_rate_updated_at)) {
    return {
      sgdToVnd: Number(settings.exchange_rate_sgd_vnd),
      updatedAt: settings.exchange_rate_updated_at,
      source: settings.exchange_rate_source,
    };
  }

  try {
    const fresh = await fetchSgdToVndRate();
    if (fresh) {
      const updatedAt = new Date().toISOString();
      const supabase = await createClient();
      await supabase.from("app_settings").upsert({
        id: "main",
        exchange_rate_sgd_vnd: fresh.rate,
        exchange_rate_updated_at: updatedAt,
        exchange_rate_source: fresh.source,
        hero_image_url: settings?.hero_image_url ?? null,
        hero_image_public_id: settings?.hero_image_public_id ?? null,
        updated_by: settings?.updated_by ?? null,
      });

      return {
        sgdToVnd: fresh.rate,
        updatedAt,
        source: fresh.source,
      };
    }
  } catch {
    // Keep the dashboard usable with the last cached rate below.
  }

  if (settings?.exchange_rate_sgd_vnd) {
    return {
      sgdToVnd: Number(settings.exchange_rate_sgd_vnd),
      updatedAt: settings.exchange_rate_updated_at,
      source: settings.exchange_rate_source,
    };
  }

  return {
    sgdToVnd: null,
    updatedAt: null,
    source: null,
  };
}
