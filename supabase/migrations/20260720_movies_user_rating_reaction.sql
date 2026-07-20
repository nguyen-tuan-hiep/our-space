alter table public.movies
  add column if not exists rating_by_user jsonb not null default '{}'::jsonb,
  add column if not exists reaction_by_user jsonb not null default '{}'::jsonb;

alter table public.movies
  drop constraint if exists movies_rating_check,
  drop constraint if exists movies_reaction_length_check,
  drop constraint if exists movies_rating_by_user_object_check,
  drop constraint if exists movies_reaction_by_user_object_check;

alter table public.movies
  drop column if exists rating,
  drop column if exists reaction;

alter table public.movies
  add constraint movies_rating_by_user_object_check check (jsonb_typeof(rating_by_user) = 'object'),
  add constraint movies_reaction_by_user_object_check check (jsonb_typeof(reaction_by_user) = 'object');
