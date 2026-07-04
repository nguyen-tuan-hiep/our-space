import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { getOptimizedHeroImageUrl } from "@/lib/image-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const appSession = await getAppSession();

  if (!appSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!appSession.partner) {
    return NextResponse.json({ error: "Setup required" }, { status: 409 });
  }

  const data = await getDashboardData(appSession.profile, appSession.partner);
  const heroImageUrl =
    data.settings?.hero_image_url ??
    process.env.NEXT_PUBLIC_CLOUDINARY_HERO_IMAGE_URL ??
    "https://res.cloudinary.com/demo/image/upload/sample.jpg";

  return NextResponse.json(
    {
      notes: data.notes,
      heroImageUrl: getOptimizedHeroImageUrl(heroImageUrl),
      anniversaryDate:
        data.settings?.anniversary_date ??
        appSession.profile.created_at?.slice(0, 10) ??
        new Date().toISOString().slice(0, 10),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
