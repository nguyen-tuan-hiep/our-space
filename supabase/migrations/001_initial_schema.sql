drop schema public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

create extension if not exists pgcrypto;

create type public.country_code as enum ('VN', 'SG');
create type public.currency_code as enum ('VND', 'SGD');
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
  country_code public.country_code not null,
  currency public.currency_code not null,
  partner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_not_own_partner_check check (partner_id is null or partner_id <> id)
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
  currency public.currency_code not null,
  transaction_date timestamptz not null,
  category public.expense_category not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint individual_expenses_amount_check check (amount > 0),
  constraint individual_expenses_title_length_check check (char_length(title) between 1 and 140)
);

create table public.app_settings (
  id text primary key default 'main',
  hero_image_url text,
  hero_image_public_id text,
  exchange_rate_sgd_vnd numeric(14, 6),
  exchange_rate_updated_at timestamptz,
  exchange_rate_source text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton_check check (id = 'main')
);

create index profiles_partner_id_idx on public.profiles(partner_id);
create index notes_author_id_idx on public.notes(author_id);
create index notes_recipient_id_idx on public.notes(recipient_id);
create index notes_created_at_idx on public.notes(created_at desc);
create index individual_expenses_owner_date_idx on public.individual_expenses(owner_id, transaction_date desc);
create index individual_expenses_category_idx on public.individual_expenses(category);

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

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

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

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.individual_expenses enable row level security;
alter table public.app_settings enable row level security;

create policy "Users can read their profile and partner profile"
on public.profiles for select
using (public.profile_is_partner(id));

create policy "Users can update only their own profile"
on public.profiles for update
using (id = auth.uid())
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
alter publication supabase_realtime add table public.app_settings;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.individual_expenses to authenticated;
grant select, insert, update on public.app_settings to authenticated;
grant execute on function public.profile_is_partner(uuid) to authenticated;

insert into public.app_settings (id, hero_image_url)
values ('main', null)
on conflict (id) do nothing;

insert into public.profiles (id, email, display_name, country_code, currency)
values
  ('c76955f5-df29-4f6a-b52b-fd6769c230a2', 'hiep@gmail.com', 'Singapore Partner', 'SG', 'SGD'),
  ('d8ea2091-9f0a-43f9-8deb-e6e42b6f3ee5', 'harley@gmail.com', 'Vietnam Partner', 'VN', 'VND');

update public.profiles
set partner_id = 'd8ea2091-9f0a-43f9-8deb-e6e42b6f3ee5'
where id = 'c76955f5-df29-4f6a-b52b-fd6769c230a2';

update public.profiles
set partner_id = 'c76955f5-df29-4f6a-b52b-fd6769c230a2'
where id = 'd8ea2091-9f0a-43f9-8deb-e6e42b6f3ee5';
