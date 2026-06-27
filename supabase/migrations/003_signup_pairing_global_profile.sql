alter table public.profiles
  alter column country_code type text using country_code::text,
  alter column currency type text using currency::text;

alter table public.individual_expenses
  alter column currency type text using currency::text;

drop type if exists public.country_code;
drop type if exists public.currency_code;

alter table public.profiles
  add column if not exists time_zone text not null default 'Asia/Singapore',
  add column if not exists pair_code text;

update public.profiles
set
  time_zone = case country_code
    when 'VN' then 'Asia/Ho_Chi_Minh'
    else 'Asia/Singapore'
  end
where time_zone is null or time_zone = 'Asia/Singapore';

update public.profiles
set pair_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where pair_code is null;

alter table public.profiles
  alter column pair_code set not null,
  alter column pair_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

create unique index if not exists profiles_pair_code_key
on public.profiles(pair_code);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_country_code_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_country_code_format_check
      check (country_code ~ '^[A-Z]{2}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_currency_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_currency_format_check
      check (currency ~ '^[A-Z]{3}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_time_zone_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_time_zone_length_check
      check (char_length(time_zone) between 1 and 80) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'individual_expenses_currency_format_check'
  ) then
    alter table public.individual_expenses
      add constraint individual_expenses_currency_format_check
      check (currency ~ '^[A-Z]{3}$') not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can create their own profile'
  ) then
    create policy "Users can create their own profile"
    on public.profiles for insert
    with check (id = auth.uid());
  end if;
end;
$$;

grant insert on public.profiles to authenticated;

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
    coalesce(nullif(new.raw_user_meta_data->>'time_zone', ''), 'Asia/Singapore')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.pair_with_code(target_pair_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  normalized_code text := upper(trim(target_pair_code));
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = auth.uid()
  for update;

  if current_profile.id is null then
    raise exception 'Your profile does not exist.';
  end if;

  select *
  into target_profile
  from public.profiles
  where pair_code = normalized_code
  for update;

  if target_profile.id is null then
    raise exception 'Pairing code was not found.';
  end if;

  if target_profile.id = current_profile.id then
    raise exception 'You cannot pair with yourself.';
  end if;

  if current_profile.partner_id is not null and current_profile.partner_id <> target_profile.id then
    raise exception 'Your profile is already paired.';
  end if;

  if target_profile.partner_id is not null and target_profile.partner_id <> current_profile.id then
    raise exception 'That profile is already paired.';
  end if;

  update public.profiles
  set partner_id = target_profile.id
  where id = current_profile.id;

  update public.profiles
  set partner_id = current_profile.id
  where id = target_profile.id;
end;
$$;

grant execute on function public.pair_with_code(text) to authenticated;
