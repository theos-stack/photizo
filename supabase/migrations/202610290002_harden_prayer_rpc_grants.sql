begin;

-- Supabase projects may grant newly-created functions to anon through default
-- privileges. Remove that implicit access and grant only the intended roles.
revoke all on function public.enroll_prayer_member(uuid) from public, anon;
grant execute on function public.enroll_prayer_member(uuid) to authenticated;

revoke all on function public.checkin_prayer(uuid) from public, anon;
grant execute on function public.checkin_prayer(uuid) to authenticated;

revoke all on function public.admin_correct_prayer_checkin(uuid, date, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_correct_prayer_checkin(uuid, date, text, text)
  to service_role;

revoke all on function public.claim_prayer_notification(uuid)
  from public, anon, authenticated;
grant execute on function public.claim_prayer_notification(uuid)
  to service_role;

revoke all on function public.admin_save_prayer_challenge(uuid, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_save_prayer_challenge(uuid, text, text, text, jsonb)
  to service_role;

revoke all on function public.admin_create_prayer_campaign(text, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_create_prayer_campaign(text, text, text)
  to service_role;

commit;
