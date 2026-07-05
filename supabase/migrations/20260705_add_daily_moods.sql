create table if not exists public.daily_moods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  mood_date date not null,
  mood text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_moods_mood_check check (mood in ('great', 'excited', 'happy', 'calm', 'okay', 'tired', 'stressed', 'sad')),
  constraint daily_moods_note_length_check check (note is null or char_length(note) <= 500),
  constraint daily_moods_one_per_owner_day_key unique (owner_id, mood_date)
);

create index if not exists daily_moods_owner_date_idx
on public.daily_moods(owner_id, mood_date desc);

drop trigger if exists daily_moods_set_updated_at on public.daily_moods;
create trigger daily_moods_set_updated_at
before update on public.daily_moods
for each row execute function public.set_updated_at();

alter table public.daily_moods enable row level security;

drop policy if exists "Users can read their and partner moods" on public.daily_moods;
create policy "Users can read their and partner moods"
on public.daily_moods for select
using (public.profile_is_partner(owner_id));

drop policy if exists "Users can insert only their own moods" on public.daily_moods;
create policy "Users can insert only their own moods"
on public.daily_moods for insert
with check (owner_id = auth.uid());

drop policy if exists "Users can update only their own moods" on public.daily_moods;
create policy "Users can update only their own moods"
on public.daily_moods for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete only their own moods" on public.daily_moods;
create policy "Users can delete only their own moods"
on public.daily_moods for delete
using (owner_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.daily_moods;
exception
  when duplicate_object then null;
end $$;

grant select, insert, update, delete on public.daily_moods to authenticated;
