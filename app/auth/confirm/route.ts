import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const supportedOtpTypes = new Set<EmailOtpType>(["recovery"]);

function internalPath(value: string | null) {
  return value?.startsWith("/") ? value : "/";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = internalPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || !type || !supportedOtpTypes.has(type)) {
    return NextResponse.redirect(new URL("/login?reset=invalid", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?reset=expired", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
