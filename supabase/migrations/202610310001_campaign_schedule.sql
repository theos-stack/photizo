begin;

alter table public.prayer_challenges
  add column if not exists starts_at timestamptz,
  add column if not exists campaign_timezone text not null default 'Africa/Lagos',
  add column if not exists allow_late_enrollment boolean not null default true,
  add column if not exists daily_rollover time not null default time '00:00';

alter table public.prayer_enrollments drop constraint if exists prayer_enrollments_total_completed_days_check;
alter table public.prayer_enrollments add constraint prayer_enrollments_total_completed_days_check check (total_completed_days between 0 and 90);
alter table public.prayer_enrollments drop constraint if exists prayer_enrollments_missed_days_check;
alter table public.prayer_enrollments add constraint prayer_enrollments_missed_days_check check (missed_days between 0 and 90);

create table if not exists public.prayer_campaign_schedule_audit (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.prayer_challenges(id) on delete restrict,
  actor_email text not null,
  old_schedule jsonb not null,
  new_schedule jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.prayer_campaign_schedule_audit enable row level security;
revoke all on public.prayer_campaign_schedule_audit from public, anon, authenticated;
grant all on public.prayer_campaign_schedule_audit to service_role;

create table if not exists public.prayer_music_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 120),
  description text not null default '' check (length(description) <= 500),
  provider text not null check (provider in ('spotify','youtube')),
  provider_url text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prayer_music_items_published_order_idx on public.prayer_music_items(is_published,sort_order,created_at);
alter table public.prayer_music_items enable row level security;
revoke all on public.prayer_music_items from public,anon,authenticated;
grant select on public.prayer_music_items to authenticated;
grant all on public.prayer_music_items to service_role;
drop policy if exists "Authenticated members read published prayer music" on public.prayer_music_items;
create policy "Authenticated members read published prayer music" on public.prayer_music_items
  for select to authenticated using (is_published);

create or replace function public.prayer_campaign_server_now()
returns timestamptz language sql stable set search_path=public as $$ select now() $$;
revoke all on function public.prayer_campaign_server_now() from public;
grant execute on function public.prayer_campaign_server_now() to anon,authenticated,service_role;

insert into public.prayer_challenges(slug,title,description,duration_days,minutes_per_day,status,starts_at,campaign_timezone,allow_late_enrollment,daily_rollover)
select '30-day-prayer-streak-2026', title, description, 30, minutes_per_day, 'published', '2026-11-01 08:00:00+00', 'Africa/Lagos', true, time '00:00'
from public.prayer_challenges where slug='30-day-prayer-streak'
on conflict(slug) do nothing;

insert into public.prayer_challenge_days(challenge_id,day_number,title,bible_reference,encouragement,prayer_points,completion_message)
select campaign.id,day.day_number,day.title,day.bible_reference,day.encouragement,day.prayer_points,day.completion_message
from public.prayer_challenges campaign
join public.prayer_challenges original on original.slug='30-day-prayer-streak'
join public.prayer_challenge_days day on day.challenge_id=original.id
where campaign.slug='30-day-prayer-streak-2026'
on conflict(challenge_id,day_number) do nothing;

create or replace function public.enroll_prayer_member(p_challenge_id uuid)
returns public.prayer_enrollments
language plpgsql security definer set search_path = public as $$
declare
  v_enrollment public.prayer_enrollments;
  v_challenge public.prayer_challenges;
  v_timezone text;
  v_new boolean;
  v_email text;
  v_email_enabled boolean;
  v_local_now timestamp;
  v_start_date date;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_challenge from public.prayer_challenges where id=p_challenge_id and status='published';
  if not found then raise exception 'Challenge is not open'; end if;
  -- Keep the legacy unscheduled challenge on its member-local clock. Scheduled
  -- campaigns intentionally use one shared campaign time zone.
  if v_challenge.starts_at is null then
    select timezone into v_timezone from public.member_profiles where id=auth.uid();
  else
    v_timezone := v_challenge.campaign_timezone;
  end if;
  if v_timezone is null or not exists(select 1 from pg_timezone_names where name=v_timezone) then v_timezone := 'Africa/Lagos'; end if;
  v_local_now := now() at time zone v_timezone;
  if v_challenge.starts_at is not null and now() >= v_challenge.starts_at and not v_challenge.allow_late_enrollment then
    raise exception 'Late enrollment is closed';
  end if;
  if v_timezone is null or not exists(select 1 from pg_timezone_names where name=v_timezone) then v_timezone := 'Africa/Lagos'; end if;
  v_local_now := now() at time zone v_timezone;
  v_start_date := case
    when v_challenge.starts_at is null then v_local_now::date
    when now() < v_challenge.starts_at then (v_challenge.starts_at at time zone v_challenge.campaign_timezone)::date
    else v_local_now::date
  end;
  insert into public.prayer_enrollments(member_id,challenge_id,enrollment_timezone,start_local_date)
  values(auth.uid(),p_challenge_id,v_timezone,v_start_date)
  on conflict(member_id,challenge_id) do nothing returning * into v_enrollment;
  v_new := found;
  if not v_new then select * into v_enrollment from public.prayer_enrollments where member_id=auth.uid() and challenge_id=p_challenge_id; end if;
  if v_new then
    select email into v_email from public.member_profiles where id=auth.uid();
    select email_enabled into v_email_enabled from public.prayer_notification_preferences where member_id=auth.uid();
    insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
    values(auth.uid(),v_enrollment.id,'in_app','welcome',v_start_date,-1,'sent',jsonb_build_object('title','Welcome to your prayer journey','body','Your place in the campaign is confirmed.')) on conflict do nothing;
    if coalesce(v_email_enabled,true) and coalesce(v_email,'')<>'' then
      insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
      values(auth.uid(),v_enrollment.id,'email','welcome',v_start_date,-1,'queued',jsonb_build_object('email',v_email)) on conflict do nothing;
    end if;
  end if;
  return v_enrollment;
end $$;

create or replace function public.checkin_prayer(p_enrollment_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_enrollment public.prayer_enrollments;
  v_challenge public.prayer_challenges;
  v_today date;
  v_campaign_start date;
  v_campaign_day integer;
  v_eligible_days integer;
  v_total integer;
  v_current integer;
  v_longest integer;
  v_award integer;
  v_inserted boolean;
  v_rows integer;
  v_local_now timestamp;
  v_missed integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_enrollment from public.prayer_enrollments where id=p_enrollment_id and member_id=auth.uid() for update;
  if not found or v_enrollment.status <> 'active' then raise exception 'Active enrollment not found'; end if;
  select * into v_challenge from public.prayer_challenges where id=v_enrollment.challenge_id;
  if not found then raise exception 'Challenge not found'; end if;
  if v_challenge.starts_at is not null and now()<v_challenge.starts_at then raise exception 'The campaign has not started'; end if;
  v_local_now := now() at time zone case
    when v_challenge.starts_at is null then v_enrollment.enrollment_timezone
    else coalesce(v_challenge.campaign_timezone,v_enrollment.enrollment_timezone)
  end;
  v_today := v_local_now::date - case when v_local_now::time < coalesce(v_challenge.daily_rollover,time '00:00') then 1 else 0 end;
  v_campaign_start := case when v_challenge.starts_at is null then v_enrollment.start_local_date else (v_challenge.starts_at at time zone v_challenge.campaign_timezone)::date end;
  v_campaign_day := v_today-v_campaign_start+1;
  if v_campaign_day<1 or v_campaign_day>v_challenge.duration_days then raise exception 'The campaign is not accepting check-ins today'; end if;
  if v_today<v_enrollment.start_local_date then raise exception 'Your enrollment begins later'; end if;
  v_eligible_days := greatest(0,least(v_challenge.duration_days,v_today-greatest(v_campaign_start,v_enrollment.start_local_date)+1));
  insert into public.prayer_checkins(enrollment_id,local_date,journey_day) values(v_enrollment.id,v_today,v_campaign_day)
  on conflict(enrollment_id,local_date) do nothing;
  get diagnostics v_rows = row_count;
  v_inserted := v_rows>0;
  select count(*)::int into v_total from public.prayer_checkins where enrollment_id=v_enrollment.id;
  with ordered as (select local_date,row_number() over(order by local_date desc) n from public.prayer_checkins where enrollment_id=v_enrollment.id), runs as (
    select count(*)::int days from ordered where local_date=(case when exists(select 1 from public.prayer_checkins where enrollment_id=v_enrollment.id and local_date=v_today) then v_today else v_today-1 end)-(n::int-1)
  ) select coalesce(max(days),0)::int into v_current from runs;
  with ordered as (select local_date,row_number() over(order by local_date) n from public.prayer_checkins where enrollment_id=v_enrollment.id), groups as (select count(*)::int days from ordered group by local_date-n::int)
  select coalesce(max(days),0)::int into v_longest from groups;
  v_missed := greatest(0,v_eligible_days-v_total);
  update public.prayer_enrollments set total_completed_days=v_total,current_streak=v_current,longest_streak=v_longest,missed_days=v_missed where id=v_enrollment.id;
  foreach v_award in array array[3,7,14,21,30] loop
    if v_total>=v_award then
      insert into public.prayer_achievements(enrollment_id,member_id,milestone) values(v_enrollment.id,auth.uid(),v_award) on conflict do nothing;
      get diagnostics v_rows=row_count;
      if v_rows>0 then
        insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
        values(auth.uid(),v_enrollment.id,'in_app','milestone',v_today,v_award,'sent',jsonb_build_object('title',v_award||' day milestone','body','You have completed '||v_award||' days of your prayer journey.')) on conflict do nothing;
      end if;
    end if;
  end loop;
  if v_campaign_day=v_challenge.duration_days then update public.prayer_enrollments set status='completed',completed_at=coalesce(completed_at,now()) where id=v_enrollment.id; end if;
  return jsonb_build_object('journey_day',v_campaign_day,'total_completed',v_total,'current_streak',v_current,'longest_streak',v_longest,'missed_days',v_missed,'already_checked_in',not v_inserted,'completed',v_campaign_day=v_challenge.duration_days);
end $$;

create or replace function public.admin_correct_prayer_checkin(p_enrollment_id uuid, p_local_date date, p_note text, p_actor_email text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_enrollment public.prayer_enrollments;
  v_challenge public.prayer_challenges;
  v_today date;
  v_campaign_start date;
  v_day integer;
  v_eligible_days integer;
  v_total integer;
  v_current integer;
  v_longest integer;
  v_award integer;
  v_rows integer;
  v_local_now timestamp;
begin
  if coalesce(auth.role(),'') <> 'service_role' or length(trim(coalesce(p_actor_email,'')))=0 then raise exception 'Administrator access required'; end if;
  if length(trim(coalesce(p_note,''))) < 10 then raise exception 'A correction note is required'; end if;
  select * into v_enrollment from public.prayer_enrollments where id=p_enrollment_id for update;
  if not found then raise exception 'Enrollment not found'; end if;
  select * into v_challenge from public.prayer_challenges where id=v_enrollment.challenge_id;
  if not found then raise exception 'Challenge not found'; end if;
  v_local_now := now() at time zone case when v_challenge.starts_at is null then v_enrollment.enrollment_timezone else coalesce(v_challenge.campaign_timezone,v_enrollment.enrollment_timezone) end;
  v_today := v_local_now::date - case when v_local_now::time < coalesce(v_challenge.daily_rollover,time '00:00') then 1 else 0 end;
  v_campaign_start := case when v_challenge.starts_at is null then v_enrollment.start_local_date else (v_challenge.starts_at at time zone v_challenge.campaign_timezone)::date end;
  v_day := p_local_date - v_campaign_start + 1;
  if p_local_date > v_today or v_day < 1 or v_day > v_challenge.duration_days or p_local_date < v_enrollment.start_local_date then raise exception 'Choose an eligible past or current campaign day'; end if;
  insert into public.prayer_checkins(enrollment_id,local_date,journey_day,source)
  values(v_enrollment.id,p_local_date,v_day,'admin_correction');
  insert into public.prayer_admin_audit(actor_email,member_id,enrollment_id,action,local_date,journey_day,note)
  values(trim(p_actor_email),v_enrollment.member_id,v_enrollment.id,'add_checkin',p_local_date,v_day,trim(p_note));
  select count(*)::int into v_total from public.prayer_checkins where enrollment_id=v_enrollment.id;
  with ordered as (select local_date,row_number() over(order by local_date desc) n from public.prayer_checkins where enrollment_id=v_enrollment.id), runs as (
    select count(*)::int days from ordered where local_date=(case when exists(select 1 from public.prayer_checkins where enrollment_id=v_enrollment.id and local_date=v_today) then v_today else v_today-1 end)-(n::int-1)
  ) select coalesce(max(days),0)::int into v_current from runs;
  with ordered as (select local_date,row_number() over(order by local_date) n from public.prayer_checkins where enrollment_id=v_enrollment.id), groups as (select count(*)::int days from ordered group by local_date-n::int)
  select coalesce(max(days),0)::int into v_longest from groups;
  v_eligible_days := greatest(0,least(v_challenge.duration_days,v_today-v_campaign_start+1)-greatest(0,v_enrollment.start_local_date-v_campaign_start));
  update public.prayer_enrollments set total_completed_days=v_total,current_streak=v_current,longest_streak=v_longest,missed_days=greatest(0,v_eligible_days-v_total) where id=v_enrollment.id;
  foreach v_award in array array[3,7,14,21,30] loop
    if v_total >= v_award then
      insert into public.prayer_achievements(enrollment_id,member_id,milestone) values(v_enrollment.id,v_enrollment.member_id,v_award) on conflict do nothing;
      get diagnostics v_rows = row_count;
      if v_rows>0 then
        insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
        values(v_enrollment.member_id,v_enrollment.id,'in_app','milestone',p_local_date,v_award,'sent',jsonb_build_object('title',v_award||' day milestone','body','You have completed '||v_award||' days of your prayer journey.')) on conflict do nothing;
        if exists(select 1 from public.prayer_notification_preferences where member_id=v_enrollment.member_id and email_enabled) then
          insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
          select v_enrollment.member_id,v_enrollment.id,'email','milestone',p_local_date,v_award,'queued',jsonb_build_object('email',mp.email) from public.member_profiles mp where mp.id=v_enrollment.member_id and coalesce(mp.email,'')<>'' on conflict do nothing;
        end if;
      end if;
    end if;
  end loop;
  if v_day=v_challenge.duration_days then update public.prayer_enrollments set status='completed',completed_at=coalesce(completed_at,now()) where id=v_enrollment.id; end if;
  return v_day;
end $$;

create or replace function public.admin_set_prayer_schedule(
  p_challenge_id uuid,p_starts_at timestamptz,p_timezone text,p_allow_late_enrollment boolean,p_daily_rollover time,p_actor_email text
) returns boolean language plpgsql security definer set search_path=public as $$
declare v_challenge public.prayer_challenges; v_old jsonb; v_new jsonb;
begin
  if coalesce(auth.role(),'')<>'service_role' or length(trim(coalesce(p_actor_email,'')))=0 then raise exception 'Administrator access required'; end if;
  if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Use a valid IANA time zone'; end if;
  select * into v_challenge from public.prayer_challenges where id=p_challenge_id for update;
  if not found then raise exception 'Campaign not found'; end if;
  v_old:=jsonb_build_object('starts_at',v_challenge.starts_at,'timezone',v_challenge.campaign_timezone,'allow_late_enrollment',v_challenge.allow_late_enrollment,'daily_rollover',v_challenge.daily_rollover);
  v_new:=jsonb_build_object('starts_at',p_starts_at,'timezone',p_timezone,'allow_late_enrollment',p_allow_late_enrollment,'daily_rollover',p_daily_rollover);
  if v_old=v_new then return true; end if;
  if (v_challenge.starts_at is not null and now()>=v_challenge.starts_at) or exists(select 1 from public.prayer_enrollments where challenge_id=p_challenge_id) then
    raise exception 'Schedule is locked after enrollment or campaign start to protect participant records';
  end if;
  update public.prayer_challenges set starts_at=p_starts_at,campaign_timezone=p_timezone,allow_late_enrollment=p_allow_late_enrollment,daily_rollover=p_daily_rollover,updated_at=now() where id=p_challenge_id;
  insert into public.prayer_campaign_schedule_audit(challenge_id,actor_email,old_schedule,new_schedule) values(p_challenge_id,trim(p_actor_email),v_old,v_new);
  return true;
end $$;

revoke all on function public.admin_set_prayer_schedule(uuid,timestamptz,text,boolean,time,text) from public,anon,authenticated;
grant execute on function public.admin_set_prayer_schedule(uuid,timestamptz,text,boolean,time,text) to service_role;
revoke all on function public.enroll_prayer_member(uuid) from public,anon;
grant execute on function public.enroll_prayer_member(uuid) to authenticated;
revoke all on function public.checkin_prayer(uuid) from public,anon;
grant execute on function public.checkin_prayer(uuid) to authenticated;

commit;
