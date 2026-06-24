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

drop policy if exists "Users can read their and partner expenses"
on public.individual_expenses;

create policy "Users can read their and partner expenses"
on public.individual_expenses for select
using (public.profile_is_partner(owner_id));

grant select on public.individual_expenses to authenticated;
grant execute on function public.profile_is_partner(uuid) to authenticated;
