# Our Space

Our Space is a private Next.js application for a couple. It combines shared time-locked notes with two separate personal expense ledgers, dual-currency display, realtime Supabase sync, Cloudinary media uploads, MUI forms, Tailwind layouts, and Recharts visualization.

## Stack

- Next.js App Router with TypeScript strict mode
- Tailwind CSS for layout, responsive grids, spacing, and project-level utility classes
- Material UI for Card, Button, TextField, Select, Dialog, DateTimePicker, ThemeProvider, and CssBaseline
- Supabase Auth, PostgreSQL, Row Level Security, and Realtime
- Cloudinary for hero images, profile pictures, and note attachments
- Recharts for finance trend and category charts
- Local `components/toast.tsx` provider for toast notifications

## Project Structure

```txt
app/
  actions.ts                         # Server actions for auth, notes, expenses
  api/cloudinary/upload/route.ts      # Auth-protected Cloudinary upload endpoint
  auth/callback/route.ts              # Supabase OAuth/email callback
  dashboard/page.tsx                  # Protected dashboard server page
  login/page.tsx                      # Supabase password login
  layout.tsx                          # Root layout with MUI cache/provider
  page.tsx                            # Redirects to dashboard
  globals.css                         # Tailwind globals and portfolio-inspired tokens
components/
  dashboard-client.tsx                # Realtime dashboard shell
  expenses/
    expense-dialog.tsx                # MUI expense form with fixed local currency
    expense-feed.tsx                  # Own editable ledger and partner read-only feed
    finance-charts.tsx                # Recharts week/month + category charts
  layout/app-providers.tsx            # StyledEngineProvider, MUI ThemeProvider, Toasts
  notes/
    note-card.tsx                     # Blur/countdown time-locked note card
    note-dialog.tsx                   # MUI note form and Cloudinary attachment upload
  login-form.tsx
lib/
  auth.ts                             # Current session/profile/partner helpers
  constants.ts                        # Currency/category constants and formatting
  data.ts                             # Dashboard query and chart aggregation logic
  supabase/
    admin.ts
    browser.ts
    server.ts
  types.ts                            # Shared TypeScript interfaces
supabase/migrations/
  001_initial_schema.sql              # Tables, enums, triggers, RLS, realtime
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_HERO_IMAGE_URL=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ONESIGNAL_APP_ID=d27ba552-6618-4673-9914-6cb8e637d287
```

`NEXT_PUBLIC_CLOUDINARY_HERO_IMAGE_URL` should be a high-quality Cloudinary URL for the couple hero image. Cloudinary uploads from note attachments are stored under `our-space/attachments`.

Supabase Edge Function secrets for push notifications:

```bash
supabase secrets set \
  ONESIGNAL_APP_ID=d27ba552-6618-4673-9914-6cb8e637d287 \
  ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key \
  APP_URL=https://dailymoments.vercel.app \
  NOTIFICATION_WEBHOOK_SECRET=your-webhook-secret
```

## Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run build
```

## Supabase Setup

1. Create a Supabase project.
2. Enable Email/Password auth in Supabase Auth.
3. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor or via Supabase CLI.
4. Create exactly two auth users.
5. Insert and link their profiles.

Example profile seed:

```sql
insert into public.profiles (id, email, display_name, country_code, currency)
values
  ('USER_A_UUID', 'vietnam@example.com', 'Vietnam Partner', 'VN', 'VND'),
  ('USER_B_UUID', 'singapore@example.com', 'Singapore Partner', 'SG', 'SGD');

update public.profiles
set partner_id = 'USER_B_UUID'
where id = 'USER_A_UUID';

update public.profiles
set partner_id = 'USER_A_UUID'
where id = 'USER_B_UUID';
```

The schema defines:

- `profiles`: user identity, country, fixed currency, partner link
- `notes`: shared note CRUD with optional `unlock_at`, attachments, author/recipient
- `individual_expenses`: owner-only writes, partner-readable rows, category enum, currency enum

Run `supabase/migrations/002_add_onesignal_subscription.sql` if your database was created before push notifications were added. It stores the OneSignal browser subscription ID for the signed-in profile.

RLS rules enforce:

- Users read only their own profile and partner profile.
- Users write only their own profile.
- Users can read notes where they are author or recipient.
- Users can create/update/delete only notes they authored.
- Users can read both ledgers but insert/update/delete only their own expenses.
- Expense currency must match the owner profile currency through a database trigger.

Realtime is enabled for `notes` and `individual_expenses`, so the dashboard refreshes when either partner changes data.

## Tailwind and MUI Coexistence

Tailwind handles layout primitives and project identity:

- `container-page`
- `eyebrow`
- dashboard grids
- hero image composition
- note blur state via `blur-md`

MUI handles interactive and form-heavy surfaces:

- `Dialog`
- `TextField`
- `Button`
- `Card`
- `Chip`
- `DateTimePicker`
- `ToggleButtonGroup`

`components/layout/app-providers.tsx` wraps the app in:

- `StyledEngineProvider injectFirst`
- MUI `ThemeProvider`
- MUI `CssBaseline`
- MUI X `LocalizationProvider`
- local `ToastProvider`

This keeps Tailwind utility classes predictable while still allowing MUI theme overrides.

## Feature Notes

### Time-Locked Notes

When `unlock_at` is in the future, `NoteCard` shows metadata and a countdown while the note body is blurred with Tailwind `blur-md`. The card updates every second and automatically reveals content after the lock expires.

### Expenses

Each profile has a currency:

- Vietnam profile: `VND`
- Singapore profile: `SGD`

The expense dialog disables currency editing and submits the current profile currency. The database trigger rejects mismatched currencies even if a malicious client tampers with the request.

### Charts

`lib/data.ts` aggregates expenses separately for each user:

- weekly trend
- monthly trend
- category distribution
- total spending in each profile's local currency

The dashboard intentionally does not convert currencies, because the product requirement is to preserve localized ledgers.

## Production Notes

- Add a Supabase email allowlist or invite-only account creation process so the app remains limited to exactly two users.
- Use Cloudinary upload presets or folder restrictions for production governance.
- Add error monitoring before deployment.
- For stricter note privacy, encrypt note content client-side before saving it to Supabase. Current RLS prevents partner-external reads but stores plaintext in PostgreSQL.

## Push Notifications

This app uses OneSignal Web Push, Supabase Database Webhooks, and a Supabase Edge Function to send iPhone PWA lock-screen notifications when one partner creates a note or transaction.

Current production values:

```txt
App URL: https://dailymoments.vercel.app
Supabase project ref: uojaxhmrfhbtthypugwq
OneSignal App ID: d27ba552-6618-4673-9914-6cb8e637d287
Edge Function: send-push-notification
Edge Function URL: https://uojaxhmrfhbtthypugwq.functions.supabase.co/send-push-notification
Webhook secret: 89c802fbcfad1d5cdd9ec247c4c5e30744e1443358459c5f49a4f86371dbba0d
```

### OneSignal Setup

1. Create a OneSignal Web Push app.
2. Configure the site URL as `https://dailymoments.vercel.app`.
3. For iOS PWA support, make sure the app is installed from Safari with Add to Home Screen. iOS only supports Web Push for installed standalone web apps.
4. Copy the OneSignal App ID into `NEXT_PUBLIC_ONESIGNAL_APP_ID` in Vercel. Current app ID: `d27ba552-6618-4673-9914-6cb8e637d287`.
5. Copy the OneSignal REST API key into the Supabase secret `ONESIGNAL_REST_API_KEY`.

The required OneSignal service worker files live in `public/`:

```txt
public/OneSignalSDKWorker.js
public/OneSignalSDKUpdaterWorker.js
```

They import OneSignal's Web SDK worker from the CDN and are served from the site root, which lets OneSignal register a root-scoped service worker for the PWA.

Verify these URLs return JavaScript:

```txt
https://dailymoments.vercel.app/OneSignalSDKWorker.js
https://dailymoments.vercel.app/OneSignalSDKUpdaterWorker.js
```

### Frontend Flow

`components/notifications/onesignal-bootstrap.tsx` initializes the OneSignal Web SDK on every page so OneSignal can verify the installation. The root layout also enables OneSignal's floating notify button, which is useful for creating the first subscription during OneSignal setup. The dashboard still renders an `Enable notifications` button, because iOS requires a direct user gesture before the native notification permission prompt can appear.

When the user taps the button:

1. OneSignal initializes with `NEXT_PUBLIC_ONESIGNAL_APP_ID`.
2. The SDK calls `OneSignal.login(profile.id)` to link the web subscription to the Supabase user ID.
3. The OneSignal prompt and native browser permission prompt are shown.
4. The current browser subscription is linked to the profile id as OneSignal's `external_id`.
5. Every enabled device for the same profile id can receive the same notification.

The mobile notification option lives in the avatar menu. The desktop/tablet notification button lives in the dashboard toolbar. Turning notifications off calls OneSignal `optOut()` for the current browser/device only.

### Edge Function Deploy

Install and link Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref uojaxhmrfhbtthypugwq
```

Set secrets:

```bash
supabase secrets set \
  ONESIGNAL_APP_ID=d27ba552-6618-4673-9914-6cb8e637d287 \
  ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key \
  APP_URL=https://dailymoments.vercel.app \
  NOTIFICATION_WEBHOOK_SECRET=89c802fbcfad1d5cdd9ec247c4c5e30744e1443358459c5f49a4f86371dbba0d \
  --project-ref uojaxhmrfhbtthypugwq
```

Deploy the function without JWT verification. Database Webhooks do not send a Supabase Auth JWT, so `--no-verify-jwt` is required:

```bash
supabase functions deploy send-push-notification \
  --project-ref uojaxhmrfhbtthypugwq \
  --no-verify-jwt
```

Verify function settings:

```bash
supabase functions list --project-ref uojaxhmrfhbtthypugwq
```

The function must show `verify_jwt: false`.

Smoke-test the function with the webhook secret:

```bash
curl -sS -X POST \
  'https://uojaxhmrfhbtthypugwq.functions.supabase.co/send-push-notification?x-webhook-secret=89c802fbcfad1d5cdd9ec247c4c5e30744e1443358459c5f49a4f86371dbba0d' \
  -H 'Content-Type: application/json' \
  -d '{"type":"INSERT","table":"unknown","schema":"public","record":{}}'
```

Expected response:

```json
{ "ok": true, "skipped": true }
```

The production function URL is:

```txt
https://uojaxhmrfhbtthypugwq.functions.supabase.co/send-push-notification
```

### Anniversary Reminder Webhook

This repository also includes a second Edge Function named `notify-on-anniversary-reminder`.
It checks `public.app_settings.anniversary_date` for each couple and sends push reminders at:

- 7 days before
- 3 days before
- 1 day before
- on the anniversary date

Deploy it with the same secrets as the main notification function:

```bash
supabase functions deploy notify-on-anniversary-reminder \
  --project-ref uojaxhmrfhbtthypugwq \
  --no-verify-jwt
```

The function URL is:

```txt
https://uojaxhmrfhbtthypugwq.functions.supabase.co/notify-on-anniversary-reminder
```

It accepts the same `x-webhook-secret` header or `?x-webhook-secret=...` query parameter.

For a daily scheduler, point your cron or external webhook caller at this URL and send a POST request once per day. A manual smoke test can pass a test date in the body:

```bash
curl -sS -X POST \
  'https://uojaxhmrfhbtthypugwq.functions.supabase.co/notify-on-anniversary-reminder?x-webhook-secret=89c802fbcfad1d5cdd9ec247c4c5e30744e1443358459c5f49a4f86371dbba0d' \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-06-28T00:00:00.000Z"}'
```

### Database Grants

The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` to fetch sender and receiver profiles. Make sure the remote database has these grants:

```sql
grant select, update on public.profiles to service_role;
grant select on public.notes to service_role;
grant select on public.individual_expenses to service_role;
grant select on public.app_settings to service_role;
```

If the function returns this error, the grants are missing:

```txt
permission denied for table profiles
```

### Database Webhook Setup

Create two Database Webhooks in the Supabase Dashboard:

1. Go to `Database` -> `Webhooks` -> `Create a new hook`.
2. Name the first hook `notify-on-note-insert`.
3. Set table to `public.notes`.
4. Set events to `Insert`.
5. Set type to `HTTP Request`.
6. Set method to `POST`.
7. Set URL to the Edge Function URL.
8. Prefer adding header `x-webhook-secret` with the same value as `NOTIFICATION_WEBHOOK_SECRET`.
9. Save the hook.
10. Repeat for `public.individual_expenses`, naming it `notify-on-expense-insert`.

Recommended webhook URL:

```txt
https://uojaxhmrfhbtthypugwq.functions.supabase.co/send-push-notification
```

Recommended webhook header:

```txt
x-webhook-secret: 89c802fbcfad1d5cdd9ec247c4c5e30744e1443358459c5f49a4f86371dbba0d
```

The function also accepts the secret as a query parameter, which is useful if the Dashboard webhook UI cannot set custom headers:

```txt
https://uojaxhmrfhbtthypugwq.functions.supabase.co/send-push-notification?x-webhook-secret=89c802fbcfad1d5cdd9ec247c4c5e30744e1443358459c5f49a4f86371dbba0d
```

When a note row is inserted, the function reads `record.recipient_id`, targets that profile id as OneSignal `external_id`, and sends `[author display name] just wrote a new note for you!`.

When an expense row is inserted, the function reads `record.owner_id`, finds that owner's `partner_id`, targets the partner profile id as OneSignal `external_id`, and sends a transaction notification.

### Testing

1. Deploy the frontend to HTTPS on Vercel.
2. Confirm Vercel has `NEXT_PUBLIC_ONESIGNAL_APP_ID=d27ba552-6618-4673-9914-6cb8e637d287`.
3. Open `https://dailymoments.vercel.app` on a supported browser.
4. Sign in and tap `Enable notifications`.
5. Confirm OneSignal Dashboard -> Audience -> Subscriptions shows the device as subscribed with the profile id as external id.
6. Repeat steps 3-5 on another device with the same profile.
7. Sign in as the other partner and create a note or transaction.
8. Lock both receiving devices and confirm the notification appears on both.

Useful SQL checks:

```sql
select id, display_name
from public.profiles;
```

Useful browser console checks:

```js
const oneSignal = await window.__oneSignalInitPromise;
oneSignal.Notifications.permission;
oneSignal.User.PushSubscription.id;
```

On iPhone, Web Push works only in an installed standalone PWA:

1. Use Safari, not Chrome, Zalo, Messenger, or an in-app browser.
2. Open `https://dailymoments.vercel.app`.
3. Share -> Add to Home Screen.
4. Open the installed Home Screen icon, not the Safari tab.
5. Confirm:

```js
window.navigator.standalone === true;
"serviceWorker" in navigator === true;
```

If the body of notification message is changed, redeploy the Edge Function and test again using command:

```bash
supabase functions deploy send-push-notification \
    --project-ref uojaxhmrfhbtthypugwq \
    --no-verify-jwt
```

If `window.navigator.standalone` is `false`, the app is still running in Safari and iOS will not show the native Apple notification permission popup.

If `"serviceWorker" in navigator` is `false`, the current iPhone browser context cannot subscribe to Web Push.

### Troubleshooting

- `POST 401` from the Edge Function: the webhook secret is missing or wrong. Use the `x-webhook-secret` header or the `?x-webhook-secret=...` query parameter.
- `permission denied for table profiles`: run the service role grants in the Database Grants section.
- `App not configured for web push`: the OneSignal App ID does not have Web Push configured for `https://dailymoments.vercel.app`, or the frontend is using an App ID from a different OneSignal app.
- Supabase function returns `oneSignalResponse.id`: OneSignal accepted the send request. If the device still does not receive it, debug the specific device subscription in OneSignal Dashboard.
- Mac can subscribe but iPhone cannot: the iPhone is usually not running the Home Screen PWA in standalone mode, or it is below iOS 16.4.
