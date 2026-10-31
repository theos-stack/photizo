grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
-- Keep production-sensitive music permissions after the generic test grants.
revoke all on public.prayer_music_items from anon;
revoke insert, update, delete on public.prayer_music_items from authenticated;
grant select on public.prayer_music_items to authenticated;
