do $$
begin
  if to_regclass('public.couple') is null and to_regclass('public.app_settings') is not null then
    alter table public.app_settings rename to couple;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.couple'::regclass
      and conname = 'app_settings_pkey'
  ) then
    alter table public.couple rename constraint app_settings_pkey to couple_pkey;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.couple'::regclass
      and tgname = 'app_settings_set_updated_at'
  ) then
    alter trigger app_settings_set_updated_at on public.couple rename to couple_set_updated_at;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'couple'
      and policyname = 'Couple can read app settings'
  ) then
    alter policy "Couple can read app settings"
    on public.couple
    rename to "Couple can read couple settings";
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'couple'
      and policyname = 'Couple can update app settings'
  ) then
    alter policy "Couple can update app settings"
    on public.couple
    rename to "Couple can update couple settings";
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'couple'
      and policyname = 'Couple can create app settings'
  ) then
    alter policy "Couple can create app settings"
    on public.couple
    rename to "Couple can create couple settings";
  end if;
end $$;

update public.couple
set id = regexp_replace(id, '^couple:', '')
where id like 'couple:%';

update public.memory_map_entries
set couple_id = regexp_replace(couple_id, '^couple:', '')
where couple_id like 'couple:%';

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'couple'
  ) then
    alter publication supabase_realtime add table public.couple;
  end if;
end $$;

grant select, insert, update on public.couple to authenticated;
grant select, insert, update on public.couple to service_role;
