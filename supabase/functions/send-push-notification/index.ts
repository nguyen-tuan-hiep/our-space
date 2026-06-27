import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "notes" | "individual_expenses" | string;
  schema: string;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown>;
};

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  partner_id: string | null;
  onesignal_subscription_id: string | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
const oneSignalRestApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
const webhookSecret = Deno.env.get("NOTIFICATION_WEBHOOK_SECRET");
const appUrl = Deno.env.get("APP_URL") ?? "https://dailymoments.vercel.app";

const requiredEnv = {
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  ONESIGNAL_APP_ID: oneSignalAppId,
  ONESIGNAL_REST_API_KEY: oneSignalRestApiKey,
};

const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function isAuthorized(request: Request) {
  if (!webhookSecret) return true;

  const urlSecret = new URL(request.url).searchParams.get("x-webhook-secret");
  const headerSecret =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return headerSecret === webhookSecret || urlSecret === webhookSecret;
}

async function getProfile(id: string) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, partner_id, onesignal_subscription_id")
    .eq("id", id)
    .maybeSingle<Profile>();

  if (error) throw new Error(error.message);
  return data;
}

function getProfileLabel(profile: Profile) {
  return [profile.display_name, profile.avatar_url].filter(Boolean).join(" ");
}

async function buildNotification(payload: WebhookPayload) {
  const record = payload.record;
  if (!record || payload.type !== "INSERT") return null;

  if (payload.table === "notes") {
    const authorId = getString(record, "author_id");
    const recipientId = getString(record, "recipient_id");
    const noteId = getString(record, "id");
    if (!authorId || !recipientId) return null;

    const [author, recipient] = await Promise.all([
      getProfile(authorId),
      getProfile(recipientId),
    ]);

    if (!author || !recipient?.onesignal_subscription_id) return null;

    return {
      subscriptionId: recipient.onesignal_subscription_id,
      title: "New note",
      body: `${getProfileLabel(author)} just wrote a new note for you!`,
      url: `${appUrl}/?note=${noteId ?? ""}`,
      data: {
        type: "note",
        note_id: noteId,
        author_id: authorId,
        recipient_id: recipientId,
      },
    };
  }

  if (payload.table === "individual_expenses") {
    const ownerId = getString(record, "owner_id");
    const expenseId = getString(record, "id");
    const expenseTitle = getString(record, "title") ?? "a new transaction";
    if (!ownerId) return null;

    const owner = await getProfile(ownerId);
    if (!owner?.partner_id) return null;

    const partner = await getProfile(owner.partner_id);
    if (!partner?.onesignal_subscription_id) return null;

    return {
      subscriptionId: partner.onesignal_subscription_id,
      title: "New transaction",
      body: `${getProfileLabel(owner)} created a new transaction "${expenseTitle}"!`,
      url: `${appUrl}/?expense=${expenseId ?? ""}`,
      data: {
        type: "expense",
        expense_id: expenseId,
        owner_id: ownerId,
        recipient_id: partner.id,
      },
    };
  }

  return null;
}

async function sendOneSignalNotification(notification: {
  subscriptionId: string;
  title: string;
  body: string;
  url: string;
  data: Record<string, unknown>;
}) {
  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${oneSignalRestApiKey}`,
    },
    body: JSON.stringify({
      app_id: oneSignalAppId,
      include_subscription_ids: [notification.subscriptionId],
      headings: { en: notification.title },
      contents: { en: notification.body },
      url: notification.url,
      data: notification.data,
    }),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `OneSignal request failed with ${response.status}: ${JSON.stringify(
        responseBody,
      )}`,
    );
  }

  return responseBody;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  if (!isAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  if (missingEnv.length) {
    return jsonResponse(
      { error: "Missing environment variables.", missingEnv },
      500,
    );
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload." }, 400);
  }

  try {
    const notification = await buildNotification(payload);
    if (!notification) {
      return jsonResponse({ ok: true, skipped: true });
    }

    const oneSignalResponse = await sendOneSignalNotification(notification);
    return jsonResponse({ ok: true, oneSignalResponse });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);
    console.error(message);
    return jsonResponse({ error: message }, 500);
  }
});
