-- Remember which time zone the author picked for the unlock date/time, so editing
-- a note shows (and keeps) that choice instead of falling back to the recipient's.
alter table public.notes
  add column if not exists unlock_time_zone text;

alter table public.notes
  drop constraint if exists notes_unlock_time_zone_length_check;
alter table public.notes
  add constraint notes_unlock_time_zone_length_check
  check (unlock_time_zone is null or char_length(unlock_time_zone) between 1 and 80);
