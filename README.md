# Our Space

Our Space is a private Next.js application for exactly two users living in Vietnam and Singapore. It combines shared time-locked notes with two separate personal expense ledgers, dual-currency display, realtime Supabase sync, Cloudinary media uploads, MUI forms, Tailwind layouts, and Recharts visualization.

The visual direction follows the sibling `portfolio` project: warm paper background, full-bleed photographic hero, serif display headings, restrained cards, and dense dashboard sections.

## Stack

- Next.js App Router with TypeScript strict mode
- Tailwind CSS for layout, responsive grids, spacing, and project-level utility classes
- Material UI for Card, Button, TextField, Select, Dialog, DateTimePicker, ThemeProvider, and CssBaseline
- Supabase Auth, PostgreSQL, Row Level Security, and Realtime
- Cloudinary for hero images, profile pictures, and note attachments
- Recharts for finance trend and category charts
- notistack for toast notifications

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
NEXT_PUBLIC_ONESIGNAL_APP_ID=4a57e90e-433d-465c-a3d1-99d6c1a0c5df
```

`NEXT_PUBLIC_CLOUDINARY_HERO_IMAGE_URL` should be a high-quality Cloudinary URL for the couple hero image. Cloudinary uploads from note attachments are stored under `our-space/attachments`.

Supabase Edge Function secrets for push notifications:

```bash
supabase secrets set \
  ONESIGNAL_APP_ID=your-onesignal-app-id \
  ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key \
  APP_URL=https://your-vercel-domain.com \
  NOTIFICATION_WEBHOOK_SECRET=a-long-random-shared-secret
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
- notistack `SnackbarProvider`

This keeps Tailwind utility classes predictable while still allowing MUI theme overrides.

## Feature Notes

### Time-Locked Notes

When `unlock_at` is in the future, `NoteCard` shows metadata and a countdown while the note body is blurred with Tailwind `blur-md`. The card updates every second and automatically reveals content after the lock expires.

### Expenses

Each profile has a fixed currency:

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

### OneSignal Setup

1. Create a OneSignal Web Push app.
2. Configure the site URL as your production Vercel domain.
3. For iOS PWA support, make sure the app is installed from Safari with Add to Home Screen. iOS only supports Web Push for installed standalone web apps.
4. Copy the OneSignal App ID into `NEXT_PUBLIC_ONESIGNAL_APP_ID` in Vercel. Current app ID: `4a57e90e-433d-465c-a3d1-99d6c1a0c5df`.
5. Copy the OneSignal REST API key into the Supabase secret `ONESIGNAL_REST_API_KEY`.

The required OneSignal service worker files live in `public/`:

```txt
public/OneSignalSDKWorker.js
public/OneSignalSDKUpdaterWorker.js
```

They import OneSignal's Web SDK worker from the CDN and are served from the site root, which lets OneSignal register a root-scoped service worker for the PWA.

### Frontend Flow

`components/notifications/onesignal-bootstrap.tsx` initializes the OneSignal Web SDK on every page so OneSignal can verify the installation. The dashboard still renders an `Enable notifications` button, because iOS requires a direct user gesture before the native notification permission prompt can appear.

When the user taps the button:

1. OneSignal initializes with `NEXT_PUBLIC_ONESIGNAL_APP_ID`.
2. The SDK calls `OneSignal.login(profile.id)` to link the web subscription to the Supabase user ID.
3. The OneSignal prompt and native browser permission prompt are shown.
4. The current `OneSignal.User.PushSubscription.id` is saved to `profiles.onesignal_subscription_id`.
5. Future subscription changes update the same profile column.

### Edge Function Deploy

Deploy the function:

```bash
supabase functions deploy send-push-notification
```

Set secrets:

```bash
supabase secrets set \
  ONESIGNAL_APP_ID=your-onesignal-app-id \
  ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key \
  APP_URL=https://your-vercel-domain.com \
  NOTIFICATION_WEBHOOK_SECRET=a-long-random-shared-secret
```

The function URL will look like:

```txt
https://PROJECT_REF.functions.supabase.co/send-push-notification
```

### Database Webhook Setup

Create two Database Webhooks in the Supabase Dashboard:

1. Go to `Database` -> `Webhooks` -> `Create a new hook`.
2. Name the first hook `notify-on-note-insert`.
3. Set table to `public.notes`.
4. Set events to `Insert`.
5. Set type to `HTTP Request`.
6. Set method to `POST`.
7. Set URL to your Edge Function URL.
8. Add header `x-webhook-secret` with the same value as `NOTIFICATION_WEBHOOK_SECRET`.
9. Save the hook.
10. Repeat for `public.individual_expenses`, naming it `notify-on-expense-insert`.

When a note row is inserted, the function reads `record.recipient_id`, fetches that profile's `onesignal_subscription_id`, and sends `[author display name] just wrote you a new note!`.

When an expense row is inserted, the function reads `record.owner_id`, finds that owner's `partner_id`, fetches the partner's `onesignal_subscription_id`, and sends a transaction notification.

### Testing

1. Deploy the frontend to HTTPS on Vercel.
2. Open the site on iPhone Safari and add it to the Home Screen.
3. Launch it from the Home Screen, not Safari.
4. Sign in and tap `Enable notifications`.
5. Confirm that `profiles.onesignal_subscription_id` is populated in Supabase.
6. Sign in as the other partner and create a note or transaction.
7. Lock the receiving iPhone and confirm the notification appears.
