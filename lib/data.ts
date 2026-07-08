import type {
  AppSettings,
  DailyMood,
  IndividualExpense,
  MemoryMapEntry,
  Profile,
  SharedNote,
} from "@/lib/types";
import { getExchangeRate } from "@/lib/exchange-rates";
import { createClient } from "@/lib/supabase/server";
import { getCoupleSettingsId } from "@/lib/couple-settings";

type DashboardSettings = Pick<AppSettings, "hero_image_url" | "anniversary_date">;
type FinanceSettings = Pick<
  AppSettings,
  | "exchange_rates"
  | "exchange_rates_base"
  | "exchange_rate_updated_at"
  | "exchange_rate_source"
>;

export async function getDashboardData(
  profile: Profile,
  partner: Profile | null,
) {
  const supabase = await createClient();
  const settingsId = partner ? getCoupleSettingsId(profile, partner) : null;

  const participantIds = partner ? [profile.id, partner.id] : [profile.id];

  const [
    { data: notes },
    { data: moods },
    { data: memories },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("notes")
      .select(
        "*, author:profiles!notes_author_id_fkey(id, display_name, avatar_url, currency), recipient:profiles!notes_recipient_id_fkey(id, display_name, avatar_url, currency)",
      )
      .or(`author_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .returns<SharedNote[]>(),
    supabase
      .from("daily_moods")
      .select(
        "*, owner:profiles!daily_moods_owner_id_fkey(id, display_name, avatar_url, currency)",
      )
      .in("owner_id", participantIds)
      .order("mood_date", { ascending: false })
      .returns<DailyMood[]>(),
    supabase
      .from("memory_map_entries")
      .select(
        "*, creator:profiles!memory_map_entries_created_by_fkey(id, display_name, avatar_url, currency)",
      )
      .eq("couple_id", settingsId ?? "main")
      .order("visited_at", { ascending: false })
      .returns<MemoryMapEntry[]>(),
    supabase
      .from("app_settings")
      .select("hero_image_url, anniversary_date")
      .eq("id", settingsId ?? "main")
      .maybeSingle<DashboardSettings>(),
  ]);

  return {
    notes: notes ?? [],
    moods: moods ?? [],
    memories: memories ?? [],
    settings: settings ?? null,
  };
}

export async function getDashboardSettings(
  profile: Profile,
  partner: Profile | null,
) {
  const supabase = await createClient();
  const settingsId = partner ? getCoupleSettingsId(profile, partner) : null;
  const { data: settings } = await supabase
    .from("app_settings")
    .select("hero_image_url, anniversary_date")
    .eq("id", settingsId ?? "main")
    .maybeSingle<DashboardSettings>();

  return settings ?? null;
}

export async function getFinanceData(profile: Profile, partner: Profile) {
  const supabase = await createClient();
  const settingsId = getCoupleSettingsId(profile, partner);
  const participantIds = [profile.id, partner.id];

  const [{ data: expenses }, { data: settings }] = await Promise.all([
    supabase
      .from("individual_expenses")
      .select("*")
      .in("owner_id", participantIds)
      .order("transaction_date", { ascending: false })
      .returns<IndividualExpense[]>(),
    supabase
      .from("app_settings")
      .select(
        "exchange_rates, exchange_rates_base, exchange_rate_updated_at, exchange_rate_source",
      )
      .eq("id", settingsId)
      .maybeSingle<FinanceSettings>(),
  ]);

  return {
    expenses: expenses ?? [],
    exchangeRate: getExchangeRate(settings ?? null),
  };
}
