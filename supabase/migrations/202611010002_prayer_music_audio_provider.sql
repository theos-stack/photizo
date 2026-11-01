begin;

do $$
begin
  if to_regclass('public.prayer_music_items') is null then
    raise exception 'prayer_music_items must exist before enabling PHOTIZO audio tracks';
  end if;
end
$$;

alter table public.prayer_music_items
  drop constraint if exists prayer_music_items_provider_check;

alter table public.prayer_music_items
  add constraint prayer_music_items_provider_check
  check (provider in ('spotify', 'youtube', 'audio')) not valid;

alter table public.prayer_music_items
  validate constraint prayer_music_items_provider_check;

commit;
