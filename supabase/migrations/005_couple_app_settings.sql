alter table public.app_settings
drop constraint if exists app_settings_singleton_check;

insert into public.app_settings (id, hero_image_url, hero_image_public_id)
select distinct
  'couple:' || least(p.id::text, p.partner_id::text) || ':' || greatest(p.id::text, p.partner_id::text),
  main.hero_image_url,
  main.hero_image_public_id
from public.profiles p
left join public.app_settings main on main.id = 'main'
where p.partner_id is not null
on conflict (id) do nothing;
