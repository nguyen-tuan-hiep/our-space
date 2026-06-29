import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

type AppSettingsRow = {
  id: string;
  anniversary_date: string | null;
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

const reminderDays = [7, 3, 1, 0] as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(request: Request) {
  if (!webhookSecret) return true;

  const urlSecret = new URL(request.url).searchParams.get("x-webhook-secret");
  const headerSecret =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return headerSecret === webhookSecret || urlSecret === webhookSecret;
}

function parseCoupleProfileIds(settingsId: string) {
  const match = settingsId.match(/^couple:([^:]+):([^:]+)$/);
  if (!match) return null;

  const [, firstProfileId, secondProfileId] = match;
  return [firstProfileId, secondProfileId] as const;
}

function getUtcMidnight(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function getNextAnniversaryDate(anniversaryDate: string, now: Date) {
  const [year = 0, month = 1, day = 1] = anniversaryDate.split("-").map(Number);
  const currentYear = now.getUTCFullYear();
  const candidateThisYear = Date.UTC(currentYear, month - 1, day);
  const todayUtc = getUtcMidnight(now);

  return candidateThisYear >= todayUtc
    ? candidateThisYear
    : Date.UTC(currentYear + 1, month - 1, day);
}

function getDaysUntil(targetUtcMs: number, now: Date) {
  return Math.round((targetUtcMs - getUtcMidnight(now)) / 86400000);
}

function getReminderMessage(daysUntil: number) {
  switch (daysUntil) {
    case 7:
      return "Your anniversary is in 1 week.";
    case 3:
      return "Your anniversary is in 3 days.";
    case 1:
      return "Your anniversary is tomorrow.";
    case 0:
      return "Happy anniversary! Today is your day.";
    default:
      return null;
  }
}

async function listReminderTargets(now: Date) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const { data, error } = await supabase
    .from("app_settings")
    .select("id, anniversary_date")
    .like("id", "couple:%")
    .not("anniversary_date", "is", null)
    .returns<AppSettingsRow[]>();

  if (error) throw new Error(error.message);

  const targets: Array<{
    settingsId: string;
    anniversaryDate: string;
    daysUntil: number;
    message: string;
    recipientExternalIds: string[];
  }> = [];

  for (const row of data ?? []) {
    if (!row.anniversary_date) continue;

    const coupleProfileIds = parseCoupleProfileIds(row.id);
    if (!coupleProfileIds) continue;

    const nextAnniversaryUtcMs = getNextAnniversaryDate(row.anniversary_date, now);
    const daysUntil = getDaysUntil(nextAnniversaryUtcMs, now);
    if (!reminderDays.includes(daysUntil as (typeof reminderDays)[number])) continue;

    const message = getReminderMessage(daysUntil);
    if (!message) continue;

    targets.push({
      settingsId: row.id,
      anniversaryDate: row.anniversary_date,
      daysUntil,
      message,
      recipientExternalIds: [...coupleProfileIds],
    });
  }

  return targets;
}

async function sendOneSignalNotification(notification: {
  recipientExternalIds: string[];
  title: string;
  body: string;
  url: string;
  data: Record<string, unknown>;
}) {
  if (!oneSignalAppId || !oneSignalRestApiKey) {
    throw new Error("OneSignal is not configured.");
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${oneSignalRestApiKey}`,
    },
    body: JSON.stringify({
      app_id: oneSignalAppId,
      include_aliases: {
        external_id: notification.recipientExternalIds,
      },
      target_channel: "push",
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

  let now = new Date();
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body === "object" && "date" in body) {
      const parsedDate = new Date(String((body as { date?: string }).date));
      if (!Number.isNaN(parsedDate.getTime())) {
        now = parsedDate;
      }
    }
  } catch {
    // Ignore invalid JSON and continue with the current date.
  }

  try {
    const targets = await listReminderTargets(now);

    if (!targets.length) {
      return jsonResponse({ ok: true, skipped: true });
    }

    const results = [];

    for (const target of targets) {
      const oneSignalResponse = await sendOneSignalNotification({
        recipientExternalIds: target.recipientExternalIds,
        title: "Anniversary reminder",
        body: target.message,
        url: appUrl,
        data: {
          type: "anniversary-reminder",
          settings_id: target.settingsId,
          anniversary_date: target.anniversaryDate,
          reminder_days: target.daysUntil,
        },
      });

      results.push({
        settingsId: target.settingsId,
        daysUntil: target.daysUntil,
        oneSignalResponse,
      });
    }

    return jsonResponse({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error(message);
    return jsonResponse({ error: message }, 500);
  }
});
