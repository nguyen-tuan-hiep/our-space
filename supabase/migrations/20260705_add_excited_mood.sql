alter table public.daily_moods
drop constraint if exists daily_moods_mood_check;

alter table public.daily_moods
add constraint daily_moods_mood_check
check (mood in ('great', 'excited', 'happy', 'calm', 'okay', 'tired', 'stressed', 'sad'));
