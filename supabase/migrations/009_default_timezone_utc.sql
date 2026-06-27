alter table public.profiles
  alter column time_zone set default 'UTC';

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
