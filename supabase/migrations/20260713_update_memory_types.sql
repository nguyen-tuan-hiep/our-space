do $$
begin
  if to_regtype('public.memory_type') is null then
    create type public.memory_type as enum (
      '💞 Date',
      '🍜 Food',
      '✈️ Travel',
      '💍 Anniversary',
      '📸 Photo',
      '🏕️ Outdoor & Nature',
      '🎸 Concert & Show',
      '🎬 Movies',
      '📍 Others'
    );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_enum
    where enumtypid = 'public.memory_type'::regtype
      and enumlabel = 'other'
  ) and not exists (
    select 1
    from pg_enum
    where enumtypid = 'public.memory_type'::regtype
      and enumlabel = '📍 Others'
  ) then
    alter type public.memory_type rename value 'other' to '📍 Others';
  end if;
end $$;

alter table public.memory_map_entries
alter column memory_type set default '💞 Date'::public.memory_type;
