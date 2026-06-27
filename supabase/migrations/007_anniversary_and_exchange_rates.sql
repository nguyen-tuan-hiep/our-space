alter table public.app_settings
  add column if not exists anniversary_date date,
  add column if not exists exchange_rates_base text,
  add column if not exists exchange_rates jsonb;

update public.app_settings
set anniversary_date = current_date
where anniversary_date is null;

alter table public.app_settings
  alter column anniversary_date set default current_date;
