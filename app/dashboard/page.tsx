import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { SetupRequired } from "@/components/setup-required";
import { getAppSession, getAuthenticatedSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import type { Profile } from "@/lib/types";

export default async function DashboardPage() {
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

    return (
      <SetupRequired
        user={auth.user}
        profile={profile ?? null}
        details={details.length ? details : ["No profile row was found for the logged-in user id."]}
      />
    );
  }

  if (!appSession.partner) {
    const details = appSession.profile.partner_id
      ? [`Partner row could not be read for id ${appSession.profile.partner_id}. Check that this UUID exists in public.profiles and authenticated has SELECT permission on public.profiles.`]
      : ["Current profile exists but partner_id is empty."];
    return (
      <SetupRequired
        user={appSession.user}
        profile={appSession.profile}
        details={details}
      />
    );
  }

  const data = await getDashboardData(appSession.profile, appSession.partner);

  return (
    <DashboardClient
      profile={appSession.profile}
      partner={appSession.partner}
      initialNotes={data.notes}
      initialExpenses={data.expenses}
      aggregates={data.aggregates}
      heroImageUrl={
        data.settings?.hero_image_url ??
        process.env.NEXT_PUBLIC_CLOUDINARY_HERO_IMAGE_URL ??
        "https://res.cloudinary.com/demo/image/upload/sample.jpg"
      }
      currentTimeIso={new Date().toISOString()}
    />
  );
}
