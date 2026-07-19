alter table public.memory_map_entries
add column if not exists description_by_user jsonb not null default '{}'::jsonb;

alter table public.memory_map_entries
drop column if exists description;

alter table public.movies
add column if not exists comment_by_user jsonb not null default '{}'::jsonb;

alter table public.movies
drop column if exists comment;
