import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DashboardClient } from "@/components/dashboard-client";
import { SetupRequired } from "@/components/setup-required";
import { getAppSession, getAuthenticatedSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { getOptimizedHeroImageUrl } from "@/lib/image-utils";
import { getDailyLoveQuote } from "@/lib/love-quotes";
import type { PairingRequest, Profile } from "@/lib/types";

export default async function HomePage() {
  const auth = await getAuthenticatedSession();
  if (!auth) redirect("/login");

  const appSession = await getAppSession();
  if (!appSession) {
    const details: string[] = [];
    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle<Profile>();

    if (profileError) {
      details.push(`Profile read failed: ${profileError.message}`);
    }

    const pairingRequests = profile
      ? await getPendingPairingRequests(auth.supabase, profile.id)
      : [];

    return (
      <SetupRequired
        user={auth.user}
        profile={profile ?? null}
        pairingRequests={pairingRequests}
        details={
          details.length
            ? details
            : ["No profile row was found for the logged-in user id."]
        }
      />
    );
  }

  if (!appSession.partner) {
    const details = appSession.profile.partner_id
      ? [
          `Partner row could not be read for id ${appSession.profile.partner_id}. Check that this UUID exists in public.profiles and authenticated has SELECT permission on public.profiles.`,
        ]
      : ["Current profile exists but partner_id is empty."];

    const pairingRequests = await getPendingPairingRequests(
      auth.supabase,
      appSession.profile.id,
    );

    return (
      <SetupRequired
        user={appSession.user}
        profile={appSession.profile}
        pairingRequests={pairingRequests}
        details={details}
      />
    );
  }

  const [data, dailyLoveQuote] = await Promise.all([
    getDashboardData(appSession.profile, appSession.partner),
    getDailyLoveQuote(appSession.profile.time_zone),
  ]);
  const heroImageUrl =
    data.settings?.hero_image_url ??
    process.env.NEXT_PUBLIC_CLOUDINARY_HERO_IMAGE_URL ??
    "https://res.cloudinary.com/demo/image/upload/sample.jpg";

  return (
    <DashboardClient
      profile={appSession.profile}
      partner={appSession.partner}
      initialNotes={data.notes}
      initialExpenses={data.expenses}
      heroImageUrl={getOptimizedHeroImageUrl(heroImageUrl)}
      anniversaryDate={
        data.settings?.anniversary_date ?? new Date().toISOString().slice(0, 10)
      }
      currentTimeIso={new Date().toISOString()}
      exchangeRatesBase={data.exchangeRate.ratesBase}
      exchangeRates={data.exchangeRate.rates}
      exchangeRateUpdatedAt={data.exchangeRate.updatedAt}
      exchangeRateSource={data.exchangeRate.source}
      dailyLoveQuote={dailyLoveQuote}
    />
  );
}

async function getPendingPairingRequests(
  supabase: SupabaseClient,
  profileId: string,
) {
  const { data } = await supabase
    .from("pairing_requests")
    .select(
      "*, requester:profiles!pairing_requests_requester_id_fkey(id, display_name, avatar_url, pair_code), recipient:profiles!pairing_requests_recipient_id_fkey(id, display_name, avatar_url, pair_code)",
    )
    .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<PairingRequest[]>();

  return data ?? [];
}
