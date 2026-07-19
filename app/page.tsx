import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { OurSpaceClient } from "@/components/our-space/client";
import { SetupRequired } from "@/components/setup/setup-required";
import { getAppSession, getAuthenticatedSession } from "@/lib/auth";
import { getDashboardSettings } from "@/lib/data";
import { getOptimizedImageUrl } from "@/lib/image-utils";
import { getDailyLoveQuote } from "@/lib/love-quotes";
import type { PairingRequest, Profile } from "@/lib/types";
import Loading from "./loading";

export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const auth = await getAuthenticatedSession();
  if (!auth) redirect("/login");

  const appSession = await getAppSession(auth);
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

  const settings = await getDashboardSettings(
    appSession.profile,
    appSession.partner,
  );
  const heroImageUrl =
    settings?.hero_image_url ??
    process.env.NEXT_PUBLIC_CLOUDINARY_HERO_IMAGE_URL ??
    "https://res.cloudinary.com/demo/image/upload/sample.jpg";

  return (
    <OurSpaceClient
      profile={appSession.profile}
      partner={appSession.partner}
      heroImageUrl={getOptimizedImageUrl(heroImageUrl)}
      anniversaryDate={
        settings?.anniversary_date ??
        appSession.profile.created_at?.slice(0, 10) ??
        new Date().toISOString().slice(0, 10)
      }
      currentTimeIso={new Date().toISOString()}
      dailyLoveQuote={getDailyLoveQuote(appSession.profile.time_zone)}
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
