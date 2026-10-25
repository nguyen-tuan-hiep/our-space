-- Track when the recipient first opened a note, so unread notes can show as sealed envelopes.
alter table public.notes
  add column if not exists read_at timestamptz;

-- Existing notes count as read; only notes written after this migration arrive as new letters.
update public.notes set read_at = created_at where read_at is null;

-- Recipients cannot UPDATE notes (only authors can), so marking as read goes through this function.
create or replace function public.mark_note_read(p_note_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_read_at timestamptz;
begin
  update public.notes
  set read_at = now()
  where id = p_note_id
    and recipient_id = auth.uid()
    and read_at is null
    and (unlock_at is null or unlock_at <= now())
  returning read_at into v_read_at;

  return v_read_at;
end;
$$;

revoke all on function public.mark_note_read(uuid) from public;
grant execute on function public.mark_note_read(uuid) to authenticated;
