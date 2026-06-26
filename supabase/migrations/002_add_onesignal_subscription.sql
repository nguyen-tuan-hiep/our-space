alter table public.profiles
add column if not exists onesignal_subscription_id text;

grant select, update on public.profiles to service_role;
grant select on public.notes to service_role;
grant select on public.individual_expenses to service_role;
