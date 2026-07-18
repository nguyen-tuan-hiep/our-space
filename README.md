# Our Space

Our Space is a private Next.js application for a couple. It combines shared notes, memories, moods, movies, personal expense ledgers, anniversary settings, realtime Supabase sync, Cloudinary media uploads, PWA support, OneSignal push notifications, and responsive Tailwind-based app screens.

## Stack

- Next.js App Router with TypeScript strict mode
- Tailwind CSS for layout, responsive grids, app surfaces, animation classes, and native-feeling controls
- Local UI primitives in `components/ui/` plus native dialog/input/select controls
- Supabase Auth, PostgreSQL, Row Level Security, and Realtime
- Cloudinary for hero images, memory photos, profile pictures, and movie posters
- Recharts for finance trend and category charts
- OneSignal Web Push through Supabase Edge Functions
- Local toast provider for feedback notifications

## Project Structure

```txt
app/
  actions.ts                         # Server actions for auth, setup, notes, expenses, moods, memories, movies
  api/cloudinary/upload/route.ts      # Auth-protected Cloudinary upload endpoint
  auth/callback/route.ts              # Supabase OAuth/email callback
  login/page.tsx                      # Supabase password login and forgot-password entry point
  reset-password/page.tsx             # Password reset completion page
  layout.tsx                          # Root layout, PWA metadata, iOS splash links, providers
  page.tsx                            # Protected app server page
  globals.css                         # Tailwind globals and app tokens
components/
  auth/
    login-form.tsx                    # Sign in, sign up, forgot-password request
    reset-password-form.tsx           # New-password form after email reset callback
  expenses/
    expense-dialog.tsx                # Expense form with fixed local currency
    expense-feed.tsx                  # Own editable ledger and partner read-only feed
    finance-charts.tsx                # Recharts week/month + category charts
  memory/
    memory-map-panel.tsx              # Memory map surface and memory cards
  movies/
    movie-dialog.tsx                  # Movie create/edit form, poster upload, multi-category selection
    movies-panel.tsx                  # Movie board and details dialog
  layout/app-providers.tsx            # Theme, toast, realtime, and runtime providers
  notes/
    note-card.tsx                     # Blur/countdown time-locked note card
    note-dialog.tsx                   # Note form
  our-space/
    client.tsx                        # Main realtime app shell
lib/
  auth.ts                             # Current session/profile/partner helpers
  constants.ts                        # Currency/category constants and formatting
  data.ts                             # App data query and chart aggregation logic
  supabase/
    browser.ts
    server.ts
  types.ts                            # Shared TypeScript interfaces
supabase/migrations/
  final_schema.sql                    # Fresh database schema
  202607*.sql                         # Incremental migrations for moods, memories, movies, couple settings
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
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id
```

`NEXT_PUBLIC_CLOUDINARY_HERO_IMAGE_URL` should be a high-quality Cloudinary URL for the couple hero image. Runtime uploads are organized by upload kind, including hero images, memories, and movie posters.

Supabase Edge Function secrets for push notifications:

```bash
supabase secrets set \
  ONESIGNAL_APP_ID=your-onesignal-app-id \
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
3. Run the migrations in `supabase/migrations/` via Supabase CLI, or use `final_schema.sql` only for a fresh local database reset.
4. Add auth redirect URLs for password reset:

```txt
http://localhost:3000/auth/confirm
https://your-production-domain.com/auth/confirm
```

Update the Supabase Reset Password email template link to use `token_hash` so the server can create a recovery session:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Reset password</a>
```

The reset email enters the app at `/auth/confirm?next=/reset-password`; Supabase only needs `/auth/confirm` in the allowlist.

5. Create auth users and let the setup flow create/link profiles, or seed profiles manually for local testing.

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
- `daily_moods`: per-profile mood tracking with partner visibility
- `memory_map_entries`: shared memories with location and optional photos
- `movies`: shared movie list with `movie_status` enum, optional multi-category `text[]`, poster URL, rating, and reaction
- `couple`: couple-level settings such as hero image, anniversary date, and exchange-rate cache

Recent movie migrations:

```txt
20260716_change_movie_category_to_array.sql
20260716_make_movie_category_optional.sql
20260716_change_movie_status_to_enum.sql
```

These convert movie categories to an optional `text[]` and convert movie status from free text to the `public.movie_status` enum.

RLS rules enforce:

- Users read only their own profile and partner profile.
- Users write only their own profile.
- Users can read notes where they are author or recipient.
- Users can create/update/delete only notes they authored.
- Users can read both ledgers but insert/update/delete only their own expenses.
- Expense currency must match the owner profile currency through a database trigger.
- Paired users can read and manage shared couple movies and memories.

Realtime is enabled for the shared app data so the main app refreshes when either partner changes notes, expenses, moods, memories, or movies.

## UI System

Tailwind handles layout primitives and project identity:

- `container-page`
- `eyebrow`
- app grids
- hero image composition
- note blur state via `blur-md`

Local UI primitives handle interactive and form-heavy surfaces:

- `components/ui/button.tsx`
- `components/ui/dialog.tsx`
- `components/ui/native-controls.tsx`
- `components/common/action-menu.tsx`
- `components/common/confirm-dialog.tsx`

`components/layout/app-providers.tsx` wraps the app in:

- local `ToastProvider`
- theme provider
- runtime error guard
- performance logger in supported environments

The app avoids a separate component-theme runtime and keeps most visual behavior in Tailwind utility classes and small local primitives.

## Feature Notes

### Authentication

Email/password auth uses Supabase Auth. The login screen supports:

- sign in
- sign up
- forgot password email flow
- reset password completion at `/reset-password`

Forgot password calls `supabase.auth.resetPasswordForEmail()` with:

```txt
/auth/confirm?next=/reset-password
```

`app/auth/confirm/route.ts` verifies Supabase's `token_hash` for `type=recovery`, stores the recovery session in cookies, validates `next` as an internal path, then redirects to the reset-password form.

### Time-Locked Notes

When `unlock_at` is in the future, `NoteCard` shows metadata and a countdown while the note body is blurred with Tailwind `blur-md`. The card updates every second and automatically reveals content after the lock expires.

### Movies

The Movies tab supports:

- wishlist, watching, and watched columns
- movie details dialog
- poster upload through Cloudinary
- rating selection in 0.5 increments
- optional reaction emoji
- optional multi-category selection

The database stores movie status as `public.movie_status`:

```sql
create type public.movie_status as enum ('wishlist', 'watching', 'watched');
```

Movie categories are stored as optional `text[]` values. The server action validates each category against `movieCategories` before writing to Supabase. When status is `wishlist`, rating and reaction are cleared and disabled in the form.

### Memories

The Memories tab stores map-based memory entries with title, description, type, location, visit date, creator, and optional photo. Cloudinary uploads for memories are stored separately from hero and movie uploads.

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

The app intentionally does not convert currencies in personal ledgers by default, because the product requirement is to preserve localized spending views.

### PWA and iOS Splash Screens

`app/layout.tsx` declares:

- `/manifest.webmanifest`
- Apple mobile web app meta tags
- `apple-touch-startup-image` links for iPhone and iPad portrait/landscape splash screens

iOS splash images only appear when the app is launched from a Home Screen installed PWA, not from a normal Safari tab. After changing splash images or startup metadata, remove the Home Screen app and add it again because iOS aggressively caches these assets.

## Production Notes

- Add a Supabase email allowlist or invite-only account creation process so the app remains limited to exactly two users.
- Use Cloudinary upload presets or folder restrictions for production governance.
- Add error monitoring before deployment.
- For stricter note privacy, encrypt note content client-side before saving it to Supabase. Current RLS prevents partner-external reads but stores plaintext in PostgreSQL.

## Push Notifications

This app uses OneSignal Web Push, Supabase Database Webhooks, and a Supabase Edge Function to send iPhone PWA lock-screen notifications when one partner creates a note, creates a transaction, or sets/updates a mood.

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
4. Copy the OneSignal App ID into `NEXT_PUBLIC_ONESIGNAL_APP_ID` in Vercel.
5. Copy the OneSignal REST API key into the Supabase secret `ONESIGNAL_REST_API_KEY`.
6. Make sure Vercel `NEXT_PUBLIC_ONESIGNAL_APP_ID` and Supabase `ONESIGNAL_APP_ID` are exactly the same OneSignal app. If they differ, subscriptions are created in one app while Edge Functions send through another app.

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

The notification permission control initializes the OneSignal Web SDK when the user asks to enable notifications. iOS requires a direct user gesture before the native notification permission prompt can appear.

When the user taps the button:

1. OneSignal initializes with `NEXT_PUBLIC_ONESIGNAL_APP_ID`.
2. The SDK calls `OneSignal.login(profile.id)` to link the web subscription to the Supabase user ID.
3. The OneSignal prompt and native browser permission prompt are shown.
4. The current browser subscription is linked to the profile id as OneSignal's `external_id`.
5. Every enabled device for the same profile id can receive the same notification.

The mobile notification option lives in the avatar menu. Desktop/tablet surfaces expose the same notification action in app controls. Turning notifications off calls OneSignal `optOut()` for the current browser/device only.

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
  ONESIGNAL_APP_ID=your-onesignal-app-id \
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
It checks each paired couple, uses `public.couple.anniversary_date` when present, falls back to the couple profile creation date when settings have not been saved yet, and sends push reminders at:

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

The Edge Function does not run by itself. For anniversary reminders to be delivered, point a daily cron or external webhook caller at this URL and send a `POST` request once per day.

A manual smoke test can pass a test date in the body. Add `dryRun: true` to inspect matched targets without sending a OneSignal notification:

```bash
curl -sS -X POST \
  'https://uojaxhmrfhbtthypugwq.functions.supabase.co/notify-on-anniversary-reminder?x-webhook-secret=89c802fbcfad1d5cdd9ec247c4c5e30744e1443358459c5f49a4f86371dbba0d' \
  -H 'Content-Type: application/json' \
  -d '{"dryRun":true,"date":"2026-06-28T00:00:00.000Z"}'
```

### Database Grants

The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` to fetch sender and receiver profiles. Make sure the remote database has these grants:

```sql
grant select, update on public.profiles to service_role;
grant select on public.notes to service_role;
grant select on public.individual_expenses to service_role;
grant select on public.daily_moods to service_role;
grant select on public.couple to service_role;
```

If the function returns this error, the grants are missing:

```txt
permission denied for table profiles
```

### Database Webhook Setup

Create three Database Webhooks in the Supabase Dashboard:

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
11. Repeat for `public.daily_moods`, naming it `notify-on-mood-change`, and set events to `Insert` and `Update`.

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

When a mood row is inserted or updated, the function reads `record.owner_id`, finds that owner's `partner_id`, targets the partner profile id as OneSignal `external_id`, and sends a mood update notification.

### Testing

1. Deploy the frontend to HTTPS on Vercel.
2. Confirm Vercel `NEXT_PUBLIC_ONESIGNAL_APP_ID` matches Supabase secret `ONESIGNAL_APP_ID`.
3. Open `https://dailymoments.vercel.app` on a supported browser.
4. Sign in and tap `Enable notifications`.
5. Confirm OneSignal Dashboard -> Audience -> Subscriptions shows the device as subscribed with the profile id as external id.
6. Repeat steps 3-5 on another device with the same profile.
7. Sign in as the other partner and create a note, transaction, or mood.
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
