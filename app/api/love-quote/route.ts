import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth";
import { getOnlineDailyLoveQuote } from "@/lib/love-quotes";

export const dynamic = "force-dynamic";

export async function GET() {
  const appSession = await getAppSession();

  if (!appSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dailyLoveQuote = await getOnlineDailyLoveQuote(
    appSession.profile.time_zone,
  );

  return NextResponse.json(
    { dailyLoveQuote },
    {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    },
  );
}
