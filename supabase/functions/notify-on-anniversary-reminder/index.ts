import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

type CoupleRow = {
  id: string;
  anniversary_date: string | null;
};

type ProfileRow = {
  id: string;
  partner_id: string | null;
  created_at: string | null;
};

type ReminderTarget = {
  coupleId: string;
  anniversaryDate: string;
  targetDate: string;
  milestoneMonths: number;
  daysUntil: number;
  message: string;
  recipientExternalIds: string[];
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

function normalizeCoupleId(coupleId: string) {
  return coupleId.replace(/^couple:/, "");
}

function parseCoupleProfileIds(coupleId: string) {
  const match = normalizeCoupleId(coupleId).match(/^([^:]+):([^:]+)$/);
  if (!match) return null;

  const [, firstProfileId, secondProfileId] = match;
  return [firstProfileId, secondProfileId] as const;
}

function getCoupleId(firstProfileId: string, secondProfileId: string) {
  return [firstProfileId, secondProfileId].sort().join(":");
}

function getDatePart(value: string) {
  return value.slice(0, 10);
}

function getUtcMidnight(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function getDaysInMonth(year: number, zeroBasedMonth: number) {
  return new Date(Date.UTC(year, zeroBasedMonth + 1, 0)).getUTCDate();
}

function getMonthlyMilestoneDate(startDate: string, monthsAfterStart: number) {
  const [startYear = 0, startMonth = 1, startDay = 1] = startDate
    .split("-")
    .map(Number);
  const zeroBasedStartMonth = startMonth - 1;
  const absoluteMonth = zeroBasedStartMonth + monthsAfterStart;
  const targetYear = startYear + Math.floor(absoluteMonth / 12);
  const targetMonth = ((absoluteMonth % 12) + 12) % 12;
  const targetDay = Math.min(startDay, getDaysInMonth(targetYear, targetMonth));

  return Date.UTC(targetYear, targetMonth, targetDay);
}

function getNextMonthlyMilestone(startDate: string, now: Date) {
  const [startYear = 0, startMonth = 1] = startDate.split("-").map(Number);
  const todayUtc = getUtcMidnight(now);
  const currentMonthOffset =
    (now.getUTCFullYear() - startYear) * 12 + (now.getUTCMonth() - (startMonth - 1));
  let milestoneMonths = Math.max(0, currentMonthOffset);
  let targetUtcMs = getMonthlyMilestoneDate(startDate, milestoneMonths);

  while (targetUtcMs < todayUtc) {
    milestoneMonths += 1;
    targetUtcMs = getMonthlyMilestoneDate(startDate, milestoneMonths);
  }

  return { targetUtcMs, milestoneMonths };
}

function getDaysUntil(targetUtcMs: number, now: Date) {
  return Math.round((targetUtcMs - getUtcMidnight(now)) / 86400000);
}

function formatMilestone(milestoneMonths: number) {
  if (milestoneMonths > 0 && milestoneMonths % 12 === 0) {
    const years = milestoneMonths / 12;
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  return `${milestoneMonths} month${milestoneMonths === 1 ? "" : "s"}`;
}

function getReminderMessage(daysUntil: number, milestoneMonths: number) {
  const milestone = formatMilestone(milestoneMonths);

  switch (daysUntil) {
    case 7:
      return `Your ${milestone} anniversary is in 1 week.`;
    case 3:
      return `Your ${milestone} anniversary is in 3 days.`;
    case 1:
      return `Your ${milestone} anniversary is tomorrow.`;
    case 0:
      return `Happy ${milestone} anniversary! Today is your day.`;
    default:
      return null;
  }
}

async function listReminderTargets(now: Date) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const [
    { data: settingsRows, error: settingsError },
    { data: profileRows, error: profileError },
  ] = await Promise.all([
      supabase
        .from("couple")
        .select("id, anniversary_date")
        .not("anniversary_date", "is", null)
        .returns<CoupleRow[]>(),
      supabase
        .from("profiles")
        .select("id, partner_id, created_at")
        .not("partner_id", "is", null)
        .returns<ProfileRow[]>(),
    ]);

  if (settingsError) throw new Error(settingsError.message);
  if (profileError) throw new Error(profileError.message);

  const anniversaryBySettingsId = new Map<string, string>();
  for (const row of settingsRows ?? []) {
    const coupleId = normalizeCoupleId(row.id);
    if (row.anniversary_date && coupleId !== "main") {
      anniversaryBySettingsId.set(coupleId, getDatePart(row.anniversary_date));
    }
  }

  const profilesById = new Map(
    (profileRows ?? []).map((profile) => [profile.id, profile]),
  );
  const targets: ReminderTarget[] = [];
  const seenSettingsIds = new Set<string>();

  for (const profile of profileRows ?? []) {
    if (!profile.partner_id) continue;

    const partner = profilesById.get(profile.partner_id);
    if (!partner) continue;

    const coupleId = getCoupleId(profile.id, profile.partner_id);
    if (seenSettingsIds.has(coupleId)) continue;
    seenSettingsIds.add(coupleId);

    const anniversaryDate =
      anniversaryBySettingsId.get(coupleId) ??
      getDatePart(profile.created_at ?? partner.created_at ?? now.toISOString());
    const { targetUtcMs, milestoneMonths } = getNextMonthlyMilestone(
      anniversaryDate,
      now,
    );
    const daysUntil = getDaysUntil(targetUtcMs, now);
    if (milestoneMonths === 0) continue;
    if (!reminderDays.includes(daysUntil as (typeof reminderDays)[number])) continue;

    const message = getReminderMessage(daysUntil, milestoneMonths);
    if (!message) continue;

    targets.push({
      coupleId,
      anniversaryDate,
      targetDate: new Date(targetUtcMs).toISOString().slice(0, 10),
      milestoneMonths,
      daysUntil,
      message,
      recipientExternalIds: [profile.id, profile.partner_id],
    });
  }

  for (const [coupleId, anniversaryDate] of anniversaryBySettingsId) {
    if (seenSettingsIds.has(coupleId)) continue;

    const coupleProfileIds = parseCoupleProfileIds(coupleId);
    if (!coupleProfileIds) continue;

    const { targetUtcMs, milestoneMonths } = getNextMonthlyMilestone(
      anniversaryDate,
      now,
    );
    const daysUntil = getDaysUntil(targetUtcMs, now);
    if (milestoneMonths === 0) continue;
    if (!reminderDays.includes(daysUntil as (typeof reminderDays)[number])) continue;

    const message = getReminderMessage(daysUntil, milestoneMonths);
    if (!message) continue;

    targets.push({
      coupleId,
      anniversaryDate,
      targetDate: new Date(targetUtcMs).toISOString().slice(0, 10),
      milestoneMonths,
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
  let dryRun = false;
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body === "object" && "date" in body) {
      const parsedDate = new Date(String((body as { date?: string }).date));
      if (!Number.isNaN(parsedDate.getTime())) {
        now = parsedDate;
      }
    }
    if (body && typeof body === "object" && "dryRun" in body) {
      dryRun = Boolean((body as { dryRun?: boolean }).dryRun);
    }
  } catch {
    // Ignore invalid JSON and continue with the current date.
  }

  try {
    const targets = await listReminderTargets(now);

    if (!targets.length) {
      return jsonResponse({
        ok: true,
        skipped: true,
        checkedDate: now.toISOString().slice(0, 10),
      });
    }

    if (dryRun) {
      return jsonResponse({
        ok: true,
        dryRun: true,
        checkedDate: now.toISOString().slice(0, 10),
        targets,
      });
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
          couple_id: target.coupleId,
          anniversary_date: target.anniversaryDate,
          target_date: target.targetDate,
          milestone_months: target.milestoneMonths,
          reminder_days: target.daysUntil,
        },
      });

      results.push({
        coupleId: target.coupleId,
        targetDate: target.targetDate,
        milestoneMonths: target.milestoneMonths,
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
