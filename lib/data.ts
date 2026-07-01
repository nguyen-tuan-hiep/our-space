import type {
  AppSettings,
  IndividualExpense,
  Profile,
  SharedNote,
} from "@/lib/types";
import { getExchangeRate } from "@/lib/exchange-rates";
import { createClient } from "@/lib/supabase/server";
import { getCoupleSettingsId } from "@/lib/couple-settings";

export async function getDashboardData(
  profile: Profile,
  partner: Profile | null,
) {
  const supabase = await createClient();
  const participantIds = [profile.id, partner?.id].filter(Boolean) as string[];
  const settingsId = partner ? getCoupleSettingsId(profile, partner) : null;

  const [{ data: notes }, { data: expenses }, { data: settings }] =
    await Promise.all([
      supabase
        .from("notes")
        .select(
          "*, author:profiles!notes_author_id_fkey(id, display_name, avatar_url, currency), recipient:profiles!notes_recipient_id_fkey(id, display_name, avatar_url, currency)",
        )
        .or(`author_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order("created_at", { ascending: false })
        .returns<SharedNote[]>(),
      supabase
        .from("individual_expenses")
        .select("*")
        .in("owner_id", participantIds)
        .order("transaction_date", { ascending: false })
        .returns<IndividualExpense[]>(),
      supabase
        .from("app_settings")
        .select("*")
        .eq("id", settingsId ?? "main")
        .maybeSingle<AppSettings>(),
    ]);

  return {
    notes: notes ?? [],
    expenses: expenses ?? [],
    settings: settings ?? null,
    exchangeRate: getExchangeRate(settings ?? null),
  };
}
