-- The author's decoration choices for a letter (envelope, seal, paper, ink,
-- stickers). A versioned object validated by lib/note-style.ts in the app;
-- '{}' renders as the default look, so existing notes are unchanged.
alter table public.notes
  add column if not exists style jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.notes'::regclass
      and conname = 'notes_style_shape_check'
  ) then
    alter table public.notes add constraint notes_style_shape_check
      check (jsonb_typeof(style) = 'object' and pg_column_size(style) <= 4096);
  end if;
end $$;
