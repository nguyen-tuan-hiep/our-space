import { redirect } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { AppSession, Profile } from "@/lib/types";

type AuthenticatedSession = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  session: Session;
};

export async function getAuthenticatedSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (userError || !user || !session) return null;
  return { supabase, user, session };
}

export async function getAppSession(
  existingAuth?: AuthenticatedSession,
): Promise<AppSession | null> {
  const auth = existingAuth ?? (await getAuthenticatedSession());
  if (!auth) return null;

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single<Profile>();

  if (error || !profile) return null;

  const { data: partner, error: partnerError } = profile.partner_id
    ? await auth.supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.partner_id)
        .single<Profile>()
    : { data: null, error: null };

  return {
    session: auth.session,
    user: auth.user,
    profile,
    partner: partnerError ? null : partner,
  };
}

export async function requireAppSession() {
  const appSession = await getAppSession();
  if (!appSession) redirect("/login");
  return appSession;
}
