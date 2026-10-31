\set ON_ERROR_STOP on

insert into auth.users(id,email,raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000005','prelaunch@test.invalid','{}'),
  ('00000000-0000-0000-0000-000000000006','lateclosed@test.invalid','{}');
update public.member_profiles set timezone='Africa/Lagos'
where id in ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000006');

update public.prayer_challenges set status='published',starts_at=now()+interval '1 hour',campaign_timezone='Africa/Lagos',allow_late_enrollment=true,daily_rollover=time '00:00' where slug='30-day-prayer-streak-2026';

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000005';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000005","email":"prelaunch@test.invalid","role":"authenticated"}';
select (public.enroll_prayer_member((select id from public.prayer_challenges where slug='30-day-prayer-streak-2026'))).id;
do $$
declare v_enrollment public.prayer_enrollments; v_challenge public.prayer_challenges;
begin
  select * into v_enrollment from public.prayer_enrollments where member_id=auth.uid();
  select * into v_challenge from public.prayer_challenges where id=v_enrollment.challenge_id;
  if v_enrollment.start_local_date<>(v_challenge.starts_at at time zone v_challenge.campaign_timezone)::date then raise exception 'Prelaunch enrollment must be anchored to campaign Day 1'; end if;
  begin
    perform public.checkin_prayer(v_enrollment.id);
    raise exception 'Prelaunch check-in unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm not like '%campaign has not started%' then raise; end if;
  end;
end $$;
commit;

update public.prayer_challenges set starts_at=now()-interval '1 hour',allow_late_enrollment=false where slug='30-day-prayer-streak-2026';
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000006';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000006","email":"lateclosed@test.invalid","role":"authenticated"}';
do $$
begin
  begin
    perform public.enroll_prayer_member((select id from public.prayer_challenges where slug='30-day-prayer-streak-2026'));
    raise exception 'Late enrollment unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm not like '%Late enrollment is closed%' then raise; end if;
  end;
end $$;
commit;

begin;
set local role service_role;
set local request.jwt.claim.role='service_role';
set local request.jwt.claims='{"role":"service_role"}';
select public.admin_correct_prayer_checkin(
  (select id from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000005'),
  (select start_local_date from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000005'),
  'campaign day correction test','admin@test.invalid'
);
do $$
begin
  if not exists(select 1 from public.prayer_checkins where enrollment_id=(select id from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000005') and journey_day=1 and source='admin_correction') then raise exception 'Campaign correction used the wrong campaign day'; end if;
  if not exists(select 1 from public.prayer_admin_audit where enrollment_id=(select id from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000005') and journey_day=1 and note='campaign day correction test') then raise exception 'Campaign correction was not audited'; end if;
end $$;
commit;

do $$
begin
  if has_function_privilege('anon','public.admin_set_prayer_schedule(uuid,timestamp with time zone,text,boolean,time,text)','execute') then raise exception 'Anonymous schedule modification is allowed'; end if;
  if has_function_privilege('authenticated','public.admin_set_prayer_schedule(uuid,timestamp with time zone,text,boolean,time,text)','execute') then raise exception 'Member schedule modification is allowed'; end if;
  if not has_function_privilege('service_role','public.admin_set_prayer_schedule(uuid,timestamp with time zone,text,boolean,time,text)','execute') then raise exception 'Service role cannot schedule campaigns'; end if;
  if not has_function_privilege('anon','public.prayer_campaign_server_now()','execute') then raise exception 'Public countdown cannot read the database clock'; end if;
  if has_table_privilege('anon','public.prayer_music_items','select') then raise exception 'Anonymous user can read private music configuration'; end if;
  if not has_table_privilege('authenticated','public.prayer_music_items','select') then raise exception 'Authenticated members cannot load published music selections'; end if;
end $$;

begin;
set local role service_role;
insert into public.prayer_music_items(title,provider,provider_url,is_published) values
  ('Published test selection','spotify','https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',true),
  ('Private test selection','youtube','https://www.youtube.com/watch?v=dQw4w9WgXcQ',false);
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000005';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000005","email":"prelaunch@test.invalid","role":"authenticated"}';
do $$
begin
  if (select count(*) from public.prayer_music_items)<>1 then raise exception 'Member can see unpublished music selection'; end if;
  begin
    insert into public.prayer_music_items(title,provider,provider_url) values('Member injected','spotify','https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
    raise exception 'Member unexpectedly modified admin music';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;
