create table if not exists public.pairing_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pairing_requests_not_self_check check (requester_id <> recipient_id),
  constraint pairing_requests_status_check check (status in ('pending', 'accepted', 'declined', 'cancelled'))
);

create unique index if not exists pairing_requests_one_pending_pair_idx
on public.pairing_requests (
  least(requester_id, recipient_id),
  greatest(requester_id, recipient_id)
)
where status = 'pending';

create index if not exists pairing_requests_recipient_status_idx
on public.pairing_requests(recipient_id, status, created_at desc);

create index if not exists pairing_requests_requester_status_idx
on public.pairing_requests(requester_id, status, created_at desc);

drop trigger if exists pairing_requests_set_updated_at on public.pairing_requests;

create trigger pairing_requests_set_updated_at
before update on public.pairing_requests
for each row execute function public.set_updated_at();

alter table public.pairing_requests enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pairing_requests'
      and policyname = 'Users can read their pairing requests'
  ) then
    create policy "Users can read their pairing requests"
    on public.pairing_requests for select
    using (requester_id = auth.uid() or recipient_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pairing_requests'
      and policyname = 'Users can create outgoing pairing requests'
  ) then
    create policy "Users can create outgoing pairing requests"
    on public.pairing_requests for insert
    with check (requester_id = auth.uid() and recipient_id <> auth.uid());
  end if;
end;
$$;

grant select, insert on public.pairing_requests to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pairing_requests'
  ) then
    alter publication supabase_realtime add table public.pairing_requests;
  end if;
end;
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

grant execute on function public.request_pairing_with_code(text) to authenticated;
grant execute on function public.accept_pairing_request(uuid) to authenticated;
