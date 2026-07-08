import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAppSession } from "@/lib/auth";
import { getOptimizedImageUrl } from "@/lib/image-utils";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  await requireAppSession();

  const requestUrl = new URL(request.url);
  const uploadKind =
    requestUrl.searchParams.get("kind") === "memory" ? "memory" : "hero";
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());

  try {
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: uploadKind === "memory" ? "our-space/memories" : "our-space/hero",
          format: "jpg",
          quality: "auto:good",
          resource_type: "image",
          transformation: [
            {
              crop: "limit",
              height: 1290,
              width: 1920,
            },
          ],
        },
        (error, uploadResult) => {
          if (error || !uploadResult)
            reject(error ?? new Error("Upload failed"));
          else resolve(uploadResult);
        },
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      ...result,
      secure_url: getOptimizedImageUrl(result.secure_url),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 },
    );
  }
}
