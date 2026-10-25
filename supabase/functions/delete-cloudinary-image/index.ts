import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

type DeleteKind = "hero" | "memory" | "movie";

type DeleteRequest = {
  public_id?: unknown;
  kind?: unknown;
  record_id?: unknown;
};

type ProfileRow = {
  id: string;
  partner_id: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-delete-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

function isSecretAuthorized(req: Request) {
  const deleteSecret = Deno.env.get("DELETE_CLOUDINARY_IMAGE_SECRET");
  if (!deleteSecret) return false;

  const headerSecret =
    req.headers.get("x-delete-secret") ??
    getBearerToken(req);

  return headerSecret === deleteSecret;
}

function isAllowedPublicId(publicId: string) {
  return (
    /^our-space\/(hero|memories|movies)\/[A-Za-z0-9/_-]+$/.test(publicId) &&
    !publicId.includes("..")
  );
}

function inferKind(publicId: string): DeleteKind | null {
  if (publicId.startsWith("our-space/hero/")) return "hero";
  if (publicId.startsWith("our-space/memories/")) return "memory";
  if (publicId.startsWith("our-space/movies/")) return "movie";
  return null;
}

function getCoupleId(firstProfileId: string, secondProfileId: string) {
  return [firstProfileId, secondProfileId].sort().join(":");
}

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getAuthorizedUserId(req: Request) {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase secrets");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user.id;
}

async function userCanDeleteImage({
  userId,
  publicId,
  kind,
  recordId,
}: {
  userId: string;
  publicId: string;
  kind: DeleteKind;
  recordId: string | null;
}) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase secrets");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, partner_id")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (profileError) throw new Error(profileError.message);
  if (!profile?.partner_id) return false;

  const coupleId = getCoupleId(profile.id, profile.partner_id);

  if (kind === "hero") {
    const { data, error } = await supabase
      .from("couple")
      .select("id")
      .eq("id", coupleId)
      .eq("hero_image_public_id", publicId)
      .maybeSingle<{ id: string }>();

    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  if (kind === "memory") {
    let query = supabase
      .from("memory_map_entries")
      .select("id")
      .eq("couple_id", coupleId)
      .eq("photo_public_id", publicId);

    if (recordId) query = query.eq("id", recordId);

    const { data, error } = await query.maybeSingle<{ id: string }>();

    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  let query = supabase
    .from("movies")
    .select("id")
    .eq("couple_id", coupleId)
    .eq("poster_public_id", publicId);

  if (recordId) query = query.eq("id", recordId);

  const { data, error } = await query.maybeSingle<{ id: string }>();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function sha1Hex(value: string) {
  const signatureBuffer = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const payload = await req.json().catch(() => ({})) as DeleteRequest;
  const public_id = getStringValue(payload.public_id);

  if (!public_id) {
    return jsonResponse({ error: "Missing public_id" }, 400);
  }

  if (!isAllowedPublicId(public_id)) {
    return jsonResponse({ error: "Invalid public_id" }, 400);
  }

  const kind = getStringValue(payload.kind) ?? inferKind(public_id);
  const recordId = getStringValue(payload.record_id);

  if (kind !== "hero" && kind !== "memory" && kind !== "movie") {
    return jsonResponse({ error: "Invalid kind" }, 400);
  }

  if (!isSecretAuthorized(req)) {
    try {
      const userId = await getAuthorizedUserId(req);
      if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

      const allowed = await userCanDeleteImage({
        userId,
        publicId: public_id,
        kind,
        recordId,
      });

      if (!allowed) return jsonResponse({ error: "Forbidden" }, 403);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authorization failed";
      return jsonResponse(
        { error: message },
        message.toLowerCase().includes("permission denied") ? 403 : 500,
      );
    }
  }

  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

  if (!cloudName || !apiKey || !apiSecret) {
    return jsonResponse({ error: "Missing Cloudinary secrets" }, 500);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const invalidate = "true";
  const signatureBase = `invalidate=${invalidate}&public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1Hex(signatureBase);

  const formData = new FormData();
  formData.set("public_id", public_id);
  formData.set("api_key", apiKey);
  formData.set("timestamp", String(timestamp));
  formData.set("invalidate", invalidate);
  formData.set("signature", signature);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        body: formData,
      },
    );

    const result = await response.json().catch(() => ({
      error: "Invalid Cloudinary response",
    }));

    if (!response.ok) {
      return jsonResponse(result, response.status);
    }

    return jsonResponse(result);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Cloudinary delete failed" },
      502,
    );
  }
});
