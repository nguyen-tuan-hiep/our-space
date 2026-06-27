-- Fresh database only. This drops and recreates the public schema.
-- Do not run this on a database that contains data you want to keep.

drop schema public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

create extension if not exists pgcrypto;

create type public.expense_category as enum (
  'Food & Drinks',
  'Shopping',
  'Travel/Transport',
  'Entertainment',
  'Groceries',
  'Utilities',
  'Others'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  avatar_url text,
  onesignal_subscription_id text,
  country_code text not null,
  currency text not null,
  time_zone text not null default 'UTC',
  pair_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  partner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_not_own_partner_check check (partner_id is null or partner_id <> id),
  constraint profiles_country_code_format_check check (country_code ~ '^[A-Z]{2}$'),
  constraint profiles_currency_format_check check (currency ~ '^[A-Z]{3}$'),
  constraint profiles_time_zone_length_check check (char_length(time_zone) between 1 and 80)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  attachment_url text,
  attachment_public_id text,
  unlock_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_title_length_check check (char_length(title) between 1 and 120),
  constraint notes_content_length_check check (char_length(content) between 1 and 10000),
  constraint notes_not_self_check check (author_id <> recipient_id)
);

create table public.individual_expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  amount numeric(14, 2) not null,
  currency text not null,
  transaction_date timestamptz not null,
  category public.expense_category not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint individual_expenses_amount_check check (amount > 0),
  constraint individual_expenses_title_length_check check (char_length(title) between 1 and 140),
  constraint individual_expenses_currency_format_check check (currency ~ '^[A-Z]{3}$')
);

create table public.pairing_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pairing_requests_not_self_check check (requester_id <> recipient_id),
  constraint pairing_requests_status_check check (status in ('pending', 'accepted', 'declined', 'cancelled'))
);

create table public.app_settings (
  id text primary key default 'main',
  hero_image_url text,
  hero_image_public_id text,
  anniversary_date date default current_date,
  exchange_rates_base text,
  exchange_rates jsonb,
  exchange_rate_updated_at timestamptz,
  exchange_rate_source text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_partner_id_idx on public.profiles(partner_id);
create unique index profiles_pair_code_key on public.profiles(pair_code);
create index notes_author_id_idx on public.notes(author_id);
create index notes_recipient_id_idx on public.notes(recipient_id);
create index notes_created_at_idx on public.notes(created_at desc);
create index individual_expenses_owner_date_idx on public.individual_expenses(owner_id, transaction_date desc);
create index individual_expenses_category_idx on public.individual_expenses(category);
create unique index pairing_requests_one_pending_pair_idx
on public.pairing_requests (
  least(requester_id, recipient_id),
  greatest(requester_id, recipient_id)
)
where status = 'pending';
create index pairing_requests_recipient_status_idx on public.pairing_requests(recipient_id, status, created_at desc);
create index pairing_requests_requester_status_idx on public.pairing_requests(requester_id, status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

create trigger individual_expenses_set_updated_at
before update on public.individual_expenses
for each row execute function public.set_updated_at();

create trigger pairing_requests_set_updated_at
before update on public.pairing_requests
for each row execute function public.set_updated_at();

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    country_code,
    currency,
    time_zone
  )
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1), 'New user'),
    coalesce(nullif(new.raw_user_meta_data->>'avatar_url', ''), '💖'),
    upper(coalesce(nullif(new.raw_user_meta_data->>'country_code', ''), 'SG')),
    upper(coalesce(nullif(new.raw_user_meta_data->>'currency', ''), 'SGD')),
    coalesce(nullif(new.raw_user_meta_data->>'time_zone', ''), 'UTC')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.profile_is_partner(profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.partner_id = profile_id or p.id = profile_id)
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = profile_id
      and p.partner_id = auth.uid()
  );
$$;

create or replace function public.request_pairing_with_code(target_pair_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  existing_request public.pairing_requests%rowtype;
  request_id uuid;
  normalized_code text := upper(trim(target_pair_code));
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = auth.uid();

  if current_profile.id is null then
    raise exception 'Your profile does not exist.';
  end if;

  if current_profile.partner_id is not null then
    raise exception 'Your profile is already paired.';
  end if;

  select *
  into target_profile
  from public.profiles
  where pair_code = normalized_code;

  if target_profile.id is null then
    raise exception 'Pairing code was not found.';
  end if;

  if target_profile.id = current_profile.id then
    raise exception 'You cannot pair with yourself.';
  end if;

  if target_profile.partner_id is not null then
    raise exception 'That profile is already paired.';
  end if;

  select *
  into existing_request
  from public.pairing_requests
  where status = 'pending'
    and (
      (requester_id = current_profile.id and recipient_id = target_profile.id)
      or (requester_id = target_profile.id and recipient_id = current_profile.id)
    )
  limit 1;

  if existing_request.id is not null then
    return existing_request.id;
  end if;

  insert into public.pairing_requests (requester_id, recipient_id)
  values (current_profile.id, target_profile.id)
  returning id into request_id;

  return request_id;
end;
$$;

create or replace function public.accept_pairing_request(pairing_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.pairing_requests%rowtype;
  requester_profile public.profiles%rowtype;
  recipient_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  select *
  into request_row
  from public.pairing_requests
  where id = pairing_request_id
  for update;

  if request_row.id is null then
    raise exception 'Pairing request was not found.';
  end if;

  if request_row.recipient_id <> auth.uid() then
    raise exception 'Only the recipient can accept this request.';
  end if;

  if request_row.status <> 'pending' then
    raise exception 'This request is no longer pending.';
  end if;

  select *
  into requester_profile
  from public.profiles
  where id = request_row.requester_id
  for update;

  select *
  into recipient_profile
  from public.profiles
  where id = request_row.recipient_id
  for update;

  if requester_profile.partner_id is not null then
    raise exception 'The requester is already paired.';
  end if;

  if recipient_profile.partner_id is not null then
    raise exception 'Your profile is already paired.';
  end if;

  update public.profiles
  set partner_id = recipient_profile.id
  where id = requester_profile.id;

  update public.profiles
  set partner_id = requester_profile.id
  where id = recipient_profile.id;

  update public.pairing_requests
  set status = 'accepted'
  where id = request_row.id;

  update public.pairing_requests
  set status = 'cancelled'
  where status = 'pending'
    and id <> request_row.id
    and (
      requester_id in (requester_profile.id, recipient_profile.id)
      or recipient_id in (requester_profile.id, recipient_profile.id)
    );
end;
$$;

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.individual_expenses enable row level security;
alter table public.pairing_requests enable row level security;
alter table public.app_settings enable row level security;

create policy "Users can read their profile and partner profile"
on public.profiles for select
using (public.profile_is_partner(id));

create policy "Users can update only their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can create their own profile"
on public.profiles for insert
with check (id = auth.uid());

create policy "Users can read notes between the couple"
on public.notes for select
using (
  author_id = auth.uid()
  or recipient_id = auth.uid()
);

create policy "Users can create notes for their partner"
on public.notes for insert
with check (
  author_id = auth.uid()
  and public.profile_is_partner(recipient_id)
  and recipient_id <> auth.uid()
);

create policy "Users can update notes they authored"
on public.notes for update
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and public.profile_is_partner(recipient_id)
  and recipient_id <> auth.uid()
);

create policy "Users can delete notes they authored"
on public.notes for delete
using (author_id = auth.uid());

create policy "Users can read their and partner expenses"
on public.individual_expenses for select
using (public.profile_is_partner(owner_id));

create policy "Users can insert only their own expenses"
on public.individual_expenses for insert
with check (owner_id = auth.uid());

create policy "Users can update only their own expenses"
on public.individual_expenses for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete only their own expenses"
on public.individual_expenses for delete
using (owner_id = auth.uid());

create policy "Users can read their pairing requests"
on public.pairing_requests for select
using (requester_id = auth.uid() or recipient_id = auth.uid());

create policy "Users can create outgoing pairing requests"
on public.pairing_requests for insert
with check (requester_id = auth.uid() and recipient_id <> auth.uid());

create policy "Couple can read app settings"
on public.app_settings for select
using (auth.role() = 'authenticated');

create policy "Couple can update app settings"
on public.app_settings for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Couple can create app settings"
on public.app_settings for insert
with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.individual_expenses;
alter publication supabase_realtime add table public.pairing_requests;
alter publication supabase_realtime add table public.app_settings;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.individual_expenses to authenticated;
grant select, insert on public.pairing_requests to authenticated;
grant select, insert, update on public.app_settings to authenticated;
grant execute on function public.profile_is_partner(uuid) to authenticated;
grant execute on function public.request_pairing_with_code(text) to authenticated;
grant execute on function public.accept_pairing_request(uuid) to authenticated;

insert into public.app_settings (id, hero_image_url, anniversary_date)
values ('main', null, current_date)
on conflict (id) do nothing;
