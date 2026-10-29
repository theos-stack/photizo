\set ON_ERROR_STOP on

insert into auth.users(id,email,raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001','member-a@test.invalid','{"display_name":"Member A"}'),
  ('00000000-0000-0000-0000-000000000002','member-b@test.invalid','{"display_name":"Member B"}'),
  ('00000000-0000-0000-0000-000000000003','admin@test.invalid','{"display_name":"Test Admin"}'),
  ('00000000-0000-0000-0000-000000000004','viewer@test.invalid','{"display_name":"Test Viewer"}');
insert into public.admin_users(id,email,full_name,role) values
  ('00000000-0000-0000-0000-000000000003','admin@test.invalid','Test Admin','admin'),
  ('00000000-0000-0000-0000-000000000004','viewer@test.invalid','Test Viewer','viewer');

update public.member_profiles set timezone='Pacific/Kiritimati' where id='00000000-0000-0000-0000-000000000001';
update public.member_profiles set timezone='America/Adak' where id='00000000-0000-0000-0000-000000000002';

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000001","email":"member-a@test.invalid","role":"authenticated"}';
select (public.enroll_prayer_member((select id from public.prayer_challenges where slug='30-day-prayer-streak'))).id;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000002","email":"member-b@test.invalid","role":"authenticated"}';
select (public.enroll_prayer_member((select id from public.prayer_challenges where slug='30-day-prayer-streak'))).id;
commit;

create table public.integration_enrollment_starts(member_id uuid primary key,start_local_date date not null);
insert into public.integration_enrollment_starts
select member_id,start_local_date from public.prayer_enrollments;

update public.prayer_enrollments
set start_local_date=(now() at time zone enrollment_timezone)::date-29
where member_id='00000000-0000-0000-0000-000000000001';
update public.prayer_enrollments
set start_local_date=(now() at time zone enrollment_timezone)::date-5
where member_id='00000000-0000-0000-0000-000000000002';

do $$
begin
  if (select count(*) from public.prayer_challenge_days where challenge_id=(select id from public.prayer_challenges where slug='30-day-prayer-streak'))<>30 then
    raise exception 'Seed challenge does not have exactly 30 guides';
  end if;
  if (select count(*) from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000001')<>1 then
    raise exception 'Member A enrollment was not unique';
  end if;
  if (select enrollment_timezone from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000001')<>'Pacific/Kiritimati' then
    raise exception 'Enrollment did not snapshot the member time zone';
  end if;
  if (select start_local_date from public.integration_enrollment_starts where member_id='00000000-0000-0000-0000-000000000001')<>(select (enrolled_at at time zone enrollment_timezone)::date from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000001') then
    raise exception 'Member A enrollment did not start on the local enrollment date';
  end if;
  if (select enrollment_timezone from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000002')<>'America/Adak' then
    raise exception 'Member B time zone was not snapshotted';
  end if;
  if (select start_local_date from public.integration_enrollment_starts where member_id='00000000-0000-0000-0000-000000000002')<>(select (enrolled_at at time zone enrollment_timezone)::date from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000002') then
    raise exception 'Member B enrollment did not start on the local enrollment date';
  end if;
end $$;

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000001","email":"member-a@test.invalid","role":"authenticated"}';
do $$
declare v_enrollment public.prayer_enrollments; v_visible integer; v_rows integer;
begin
  select * into v_enrollment from public.prayer_enrollments where member_id=auth.uid();
  if v_enrollment.id is null then raise exception 'Member A cannot read own enrollment'; end if;
  if exists(select 1 from public.member_profiles where id='00000000-0000-0000-0000-000000000002') then
    raise exception 'Member A can read Member B profile';
  end if;
  if exists(select 1 from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000002') then
    raise exception 'Member A can read Member B enrollment';
  end if;
  if exists(select 1 from public.prayer_notification_preferences where member_id='00000000-0000-0000-0000-000000000002') then
    raise exception 'Member A can read Member B notification settings';
  end if;
  update public.prayer_notification_preferences set push_enabled=true where member_id='00000000-0000-0000-0000-000000000002';
  get diagnostics v_rows = row_count;
  if v_rows<>0 then raise exception 'Member A can modify Member B notification settings'; end if;
  update public.prayer_notification_preferences set push_enabled=false where member_id=auth.uid();
  get diagnostics v_rows = row_count;
  if v_rows<>1 then raise exception 'Member A cannot modify their own notification settings'; end if;
  perform public.enroll_prayer_member(v_enrollment.challenge_id);
  select count(*) into v_visible from public.prayer_enrollments where member_id=auth.uid();
  if v_visible<>1 then raise exception 'Duplicate enrollment was created'; end if;
  update public.member_communication_consents set ministry_announcements=true,consented_at='2000-01-01' where member_id=auth.uid();
end $$;
commit;

do $$
begin
  if (select consented_at from public.member_communication_consents where member_id='00000000-0000-0000-0000-000000000001')<='2020-01-01'::timestamptz then
    raise exception 'Consent trigger trusted a client-supplied timestamp';
  end if;
end $$;

begin;
set local role service_role;
set local request.jwt.claim.role='service_role';
set local request.jwt.claims='{"role":"service_role"}';
do $$
declare v_enrollment public.prayer_enrollments; v_day integer;
begin
  select * into v_enrollment from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000001';
  for v_day in 1..29 loop
    perform public.admin_correct_prayer_checkin(v_enrollment.id,v_enrollment.start_local_date+v_day-1,'staging integration correction','admin@test.invalid');
  end loop;
end $$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000001","email":"member-a@test.invalid","role":"authenticated"}';
do $$
declare v_enrollment public.prayer_enrollments; v_result jsonb;
begin
  select * into v_enrollment from public.prayer_enrollments where member_id=auth.uid();
  v_result:=public.checkin_prayer(v_enrollment.id);
  if (v_result->>'journey_day')::integer<>30 or v_result->>'completed'<>'true' then
    raise exception 'Day 30 did not complete the journey';
  end if;
  if (v_result->>'current_streak')::integer<>30 or (v_result->>'longest_streak')::integer<>30 then
    raise exception 'Thirty-day streak metrics are incorrect';
  end if;
  if (v_result->>'missed_days')::integer<>0 then raise exception 'A complete journey has missed days'; end if;
  if (select status from public.prayer_enrollments where id=v_enrollment.id)<>'completed' then
    raise exception 'Enrollment status was not completed';
  end if;
  if (select count(*) from public.prayer_achievements where enrollment_id=v_enrollment.id)<>5 then
    raise exception 'Milestone awards are incomplete';
  end if;
  begin
    insert into public.prayer_checkins(enrollment_id,local_date,journey_day) values(v_enrollment.id,(now() at time zone v_enrollment.enrollment_timezone)::date,30);
    raise exception 'Direct member check-in insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;

update public.prayer_challenges set status='archived' where slug='30-day-prayer-streak';
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000001","email":"member-a@test.invalid","role":"authenticated"}';
do $$
begin
  if not exists(select 1 from public.prayer_challenges where slug='30-day-prayer-streak') then
    raise exception 'Existing member lost access to archived campaign';
  end if;
  if not exists(select 1 from public.prayer_challenge_days where challenge_id=(select id from public.prayer_challenges where slug='30-day-prayer-streak') and day_number=30) then
    raise exception 'Existing member lost access to archived campaign guide';
  end if;
end $$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000004","email":"viewer@test.invalid","role":"authenticated"}';
do $$
begin
  if public.is_admin_user() then raise exception 'Non-admin role received admin privileges'; end if;
  if exists(select 1 from public.member_profiles where id='00000000-0000-0000-0000-000000000001') then
    raise exception 'Non-admin can read another member profile';
  end if;
end $$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-000000000003","email":"admin@test.invalid","role":"authenticated"}';
do $$
declare v_id uuid; v_rows integer;
begin
  if not public.is_admin_user() then raise exception 'Verified admin role was not recognized'; end if;
  if not exists(select 1 from public.prayer_checkins) then raise exception 'Admin cannot read check-ins'; end if;
  select id into v_id from public.prayer_checkins limit 1;
  update public.prayer_checkins set source='member' where id=v_id;
  get diagnostics v_rows = row_count;
  if v_rows<>0 then raise exception 'Admin direct check-in mutation unexpectedly succeeded'; end if;
end $$;
commit;

begin;
set local role anon;
set local request.jwt.claim.sub='';
set local request.jwt.claim.role='anon';
set local request.jwt.claims='{"role":"anon"}';
do $$
begin
  if exists(select 1 from public.member_profiles) then raise exception 'Anonymous visitor can read member profiles'; end if;
  if exists(select 1 from public.prayer_enrollments) then raise exception 'Anonymous visitor can read enrollments'; end if;
  begin
    perform public.checkin_prayer('00000000-0000-0000-0000-000000000000');
    raise exception 'Anonymous visitor invoked check-in';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;

create function public.test_reject_correction_audit() returns trigger language plpgsql as $fn$
begin raise exception 'forced audit failure'; end $fn$;
create trigger test_reject_correction_audit before insert on public.prayer_admin_audit for each row execute function public.test_reject_correction_audit();

begin;
set local role service_role;
set local request.jwt.claim.role='service_role';
set local request.jwt.claims='{"role":"service_role"}';
do $$
declare v_enrollment public.prayer_enrollments; v_audit_count integer; v_failed boolean:=false;
begin
  select * into v_enrollment from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000002';
  select count(*) into v_audit_count from public.prayer_admin_audit where enrollment_id=v_enrollment.id;
  begin
    perform public.admin_correct_prayer_checkin(v_enrollment.id,v_enrollment.start_local_date+3,'rollback behavior test','admin@test.invalid');
  exception when others then
    if sqlerrm='forced audit failure' then v_failed:=true; else raise; end if;
  end;
  if not v_failed then raise exception 'Correction unexpectedly passed the rejecting audit trigger'; end if;
  if exists(select 1 from public.prayer_checkins where enrollment_id=v_enrollment.id and journey_day=4) then
    raise exception 'Check-in persisted although its audit insert rolled back';
  end if;
  if (select count(*) from public.prayer_admin_audit where enrollment_id=v_enrollment.id)<>v_audit_count then
    raise exception 'Audit row persisted after failed correction';
  end if;
end $$;
commit;

drop trigger test_reject_correction_audit on public.prayer_admin_audit;
drop function public.test_reject_correction_audit();

do $$
declare v_enrollment public.prayer_enrollments;
begin
  select * into v_enrollment from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000001';
  if (select count(*) from public.prayer_admin_audit where enrollment_id=v_enrollment.id)<>29 then raise exception 'Correction audit trail count is incorrect'; end if;
  if (select count(*) from public.prayer_notification_deliveries where enrollment_id=v_enrollment.id and kind='milestone' and channel='in_app')<>5 then raise exception 'Milestone notification queue is incomplete'; end if;
end $$;
