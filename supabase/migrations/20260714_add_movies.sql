create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null,
  title text not null,
  rating numeric(3, 1),
  poster_url text,
  category text not null,
  status text not null default 'wishlist',
  comment text,
  reaction text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint movies_title_length_check check (char_length(title) between 1 and 160),
  constraint movies_rating_check check (rating is null or (rating >= 1 and rating <= 10 and rating * 2 = floor(rating * 2))),
  constraint movies_category_length_check check (char_length(category) between 1 and 80),
  constraint movies_status_check check (status in ('wishlist', 'watching', 'watched')),
  constraint movies_comment_length_check check (comment is null or char_length(comment) <= 1000),
  constraint movies_reaction_length_check check (reaction is null or char_length(reaction) <= 32)
);

create index if not exists movies_couple_status_updated_idx
on public.movies(couple_id, status, updated_at desc);

create index if not exists movies_created_by_idx
on public.movies(created_by);

create or replace function public.profile_in_couple(target_couple_id text)
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
      and p.partner_id is not null
      and target_couple_id = (
        select string_agg(id_text, ':' order by id_text)
        from unnest(array[p.id::text, p.partner_id::text]) as ids(id_text)
      )
  );
$$;

drop trigger if exists movies_set_updated_at on public.movies;
create trigger movies_set_updated_at
before update on public.movies
for each row execute function public.set_updated_at();

alter table public.movies enable row level security;

drop policy if exists "Users can read couple movies" on public.movies;
create policy "Users can read couple movies"
on public.movies for select
using (public.profile_in_couple(couple_id));

drop policy if exists "Users can create couple movies" on public.movies;
create policy "Users can create couple movies"
on public.movies for insert
with check (created_by = auth.uid() and public.profile_in_couple(couple_id));

drop policy if exists "Partners can update couple movies" on public.movies;
create policy "Partners can update couple movies"
on public.movies for update
using (public.profile_in_couple(couple_id))
with check (public.profile_in_couple(couple_id));

drop policy if exists "Partners can delete couple movies" on public.movies;
create policy "Partners can delete couple movies"
on public.movies for delete
using (public.profile_in_couple(couple_id));

do $$
begin
  alter publication supabase_realtime add table public.movies;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

grant select, insert, update, delete on public.movies to authenticated;
grant execute on function public.profile_in_couple(text) to authenticated;
