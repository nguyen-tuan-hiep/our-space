alter table public.profiles
add column if not exists onesignal_subscription_id text;
