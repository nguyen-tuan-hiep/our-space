grant usage on schema public to authenticated;

grant select on public.profiles to authenticated;
grant insert on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.individual_expenses to authenticated;
grant select, insert, update, delete on public.daily_moods to authenticated;
grant select, insert on public.pairing_requests to authenticated;
grant select, insert, update on public.couple to authenticated;
grant select, insert, update, delete on public.memory_map_entries to authenticated;
grant select, insert, update, delete on public.movies to authenticated;
grant select on public.profiles to service_role;
grant select on public.couple to service_role;
grant select on public.memory_map_entries to service_role;
grant select on public.movies to service_role;

alter table public.memory_map_entries enable row level security;
alter table public.movies enable row level security;

grant execute on function public.profile_is_partner(uuid) to authenticated;
grant execute on function public.profile_in_couple(text) to authenticated;
grant execute on function public.request_pairing_with_code(text) to authenticated;
grant execute on function public.accept_pairing_request(uuid) to authenticated;

drop policy if exists "Users can read couple memory map entries"
on public.memory_map_entries;
create policy "Users can read couple memory map entries"
on public.memory_map_entries for select
using (public.profile_is_partner(created_by));

drop policy if exists "Users can create couple memory map entries"
on public.memory_map_entries;
create policy "Users can create couple memory map entries"
on public.memory_map_entries for insert
with check (created_by = auth.uid());

drop policy if exists "Partners can update couple memory map entries"
on public.memory_map_entries;
create policy "Partners can update couple memory map entries"
on public.memory_map_entries for update
using (public.profile_is_partner(created_by))
with check (public.profile_is_partner(created_by));

drop policy if exists "Partners can delete couple memory map entries"
on public.memory_map_entries;
create policy "Partners can delete couple memory map entries"
on public.memory_map_entries for delete
using (public.profile_is_partner(created_by));

drop policy if exists "Users can read couple movies"
on public.movies;
create policy "Users can read couple movies"
on public.movies for select
using (public.profile_in_couple(couple_id));

drop policy if exists "Users can create couple movies"
on public.movies;
create policy "Users can create couple movies"
on public.movies for insert
with check (created_by = auth.uid() and public.profile_in_couple(couple_id));

drop policy if exists "Partners can update couple movies"
on public.movies;
create policy "Partners can update couple movies"
on public.movies for update
using (public.profile_in_couple(couple_id))
with check (public.profile_in_couple(couple_id));

drop policy if exists "Partners can delete couple movies"
on public.movies;
create policy "Partners can delete couple movies"
on public.movies for delete
using (public.profile_in_couple(couple_id));
