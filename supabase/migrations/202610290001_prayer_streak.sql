create extension if not exists pgcrypto;

alter table public.admin_users add column if not exists role text default 'admin';

create table if not exists public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text not null default '',
  timezone text not null default 'Africa/Lagos',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  duration_days integer not null default 30 check (duration_days between 1 and 90),
  minutes_per_day integer not null default 10 check (minutes_per_day between 1 and 120),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_challenge_days (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.prayer_challenges(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  title text not null,
  bible_reference text not null,
  encouragement text not null,
  prayer_points text[] not null default '{}',
  completion_message text not null,
  updated_at timestamptz not null default now(),
  unique(challenge_id, day_number)
);

create table if not exists public.prayer_enrollments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member_profiles(id) on delete cascade,
  challenge_id uuid not null references public.prayer_challenges(id) on delete restrict,
  enrolled_at timestamptz not null default now(),
  enrollment_timezone text not null,
  start_local_date date not null,
  status text not null default 'active' check (status in ('active','completed','left')),
  total_completed_days integer not null default 0 check (total_completed_days between 0 and 30),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  missed_days integer not null default 0 check (missed_days between 0 and 30),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(member_id, challenge_id)
);

create index if not exists prayer_enrollments_member_status_idx on public.prayer_enrollments(member_id, status);
create index if not exists prayer_enrollments_challenge_status_idx on public.prayer_enrollments(challenge_id, status);

create table if not exists public.prayer_checkins (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.prayer_enrollments(id) on delete cascade,
  local_date date not null,
  journey_day integer not null check (journey_day > 0),
  completed_at timestamptz not null default now(),
  source text not null default 'member' check (source in ('member','admin_correction')),
  unique(enrollment_id, local_date),
  unique(enrollment_id, journey_day)
);
create index if not exists prayer_checkins_enrollment_date_idx on public.prayer_checkins(enrollment_id, local_date desc);

create table if not exists public.prayer_notification_preferences (
  member_id uuid primary key references public.member_profiles(id) on delete cascade,
  push_enabled boolean not null default false,
  email_enabled boolean not null default true,
  reminder_09_enabled boolean not null default true,
  reminder_18_enabled boolean not null default true,
  reminder_21_enabled boolean not null default false,
  reminder_23_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member_profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prayer_push_subscriptions_member_idx on public.prayer_push_subscriptions(member_id);

create table if not exists public.prayer_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member_profiles(id) on delete cascade,
  enrollment_id uuid references public.prayer_enrollments(id) on delete set null,
  channel text not null check (channel in ('push','email','in_app')),
  kind text not null,
  local_date date not null,
  reminder_hour integer,
  status text not null default 'queued' check (status in ('queued','processing','sent','failed','skipped')),
  provider_id text,
  error text,
  attempts integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique(member_id, enrollment_id, channel, kind, local_date, reminder_hour)
);
create index if not exists prayer_notification_deliveries_member_idx on public.prayer_notification_deliveries(member_id, created_at desc);
create index if not exists prayer_notification_deliveries_queue_idx on public.prayer_notification_deliveries(status,created_at) where status in ('queued','failed','processing');

create table if not exists public.prayer_achievements (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.prayer_enrollments(id) on delete cascade,
  member_id uuid not null references public.member_profiles(id) on delete cascade,
  milestone integer not null check (milestone in (3,7,14,21,30)),
  achieved_at timestamptz not null default now(),
  unique(enrollment_id, milestone)
);

create table if not exists public.member_communication_consents (
  member_id uuid primary key references public.member_profiles(id) on delete cascade,
  ministry_announcements boolean not null default false,
  consented_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  member_id uuid not null references public.member_profiles(id) on delete cascade,
  enrollment_id uuid not null references public.prayer_enrollments(id) on delete cascade,
  action text not null,
  local_date date not null,
  journey_day integer not null,
  note text not null,
  created_at timestamptz not null default now()
);
create index if not exists prayer_admin_audit_enrollment_idx on public.prayer_admin_audit(enrollment_id, created_at desc);

create table if not exists public.prayer_notification_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.public_submission_limits (
  fingerprint text not null,
  purpose text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  primary key(fingerprint,purpose,window_started_at)
);

create or replace function public.is_admin_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt()->>'email',''))
      and role in ('admin','super_admin')
  )
$$;

create or replace function public.touch_member_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.member_profiles(id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''), coalesce(new.email,''))
  on conflict (id) do update set email = excluded.email, updated_at = now();
  insert into public.prayer_notification_preferences(member_id) values(new.id) on conflict do nothing;
  insert into public.member_communication_consents(member_id) values(new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created_prayer_profile on auth.users;
create trigger on_auth_user_created_prayer_profile after insert or update of email on auth.users for each row execute function public.touch_member_profile();

create or replace function public.stamp_member_communication_consent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op='INSERT' then
    if new.ministry_announcements then
      new.consented_at:=now();
    else
      new.consented_at:=null;
    end if;
  elsif new.ministry_announcements then
    if not old.ministry_announcements then
      new.consented_at:=now();
    else
      new.consented_at:=old.consented_at;
    end if;
  else
    new.consented_at:=null;
  end if;
  new.updated_at:=now();
  return new;
end $$;

drop trigger if exists stamp_member_communication_consent on public.member_communication_consents;
create trigger stamp_member_communication_consent before insert or update on public.member_communication_consents for each row execute function public.stamp_member_communication_consent();

insert into public.member_profiles(id,display_name,email)
select id,coalesce(raw_user_meta_data->>'display_name',raw_user_meta_data->>'full_name',''),coalesce(email,'') from auth.users
on conflict(id) do update set email=excluded.email;
insert into public.prayer_notification_preferences(member_id) select id from auth.users on conflict do nothing;
insert into public.member_communication_consents(member_id) select id from auth.users on conflict do nothing;

create or replace function public.enroll_prayer_member(p_challenge_id uuid)
returns public.prayer_enrollments
language plpgsql security definer set search_path = public as $$
declare v_enrollment public.prayer_enrollments; v_timezone text; v_new boolean; v_email text; v_email_enabled boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select coalesce(p.timezone,'Africa/Lagos') into v_timezone from public.member_profiles p where p.id = auth.uid();
  if v_timezone is null or not exists(select 1 from pg_timezone_names where name = v_timezone) then v_timezone := 'Africa/Lagos'; end if;
  if not exists(select 1 from public.prayer_challenges where id=p_challenge_id and status='published') then raise exception 'Challenge is not open'; end if;
  insert into public.prayer_enrollments(member_id, challenge_id, enrollment_timezone, start_local_date)
  values(auth.uid(), p_challenge_id, v_timezone, (now() at time zone v_timezone)::date)
  on conflict(member_id, challenge_id) do nothing
  returning * into v_enrollment;
  v_new := found;
  if not v_new then select * into v_enrollment from public.prayer_enrollments where member_id=auth.uid() and challenge_id=p_challenge_id; end if;
  if v_new then
    select email into v_email from public.member_profiles where id=auth.uid();
    select email_enabled into v_email_enabled from public.prayer_notification_preferences where member_id=auth.uid();
    insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
    values(auth.uid(),v_enrollment.id,'in_app','welcome',v_enrollment.start_local_date,-1,'sent',jsonb_build_object('title','Welcome to your prayer journey','body','Your first day is here. Open your prayer guide when you are ready.')) on conflict do nothing;
    if coalesce(v_email_enabled,true) and coalesce(v_email,'')<>'' then
      insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
      values(auth.uid(),v_enrollment.id,'email','welcome',v_enrollment.start_local_date,-1,'queued',jsonb_build_object('email',v_email)) on conflict do nothing;
    end if;
  end if;
  return v_enrollment;
end $$;

create or replace function public.checkin_prayer(p_enrollment_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_enrollment public.prayer_enrollments; v_today date; v_day integer; v_total integer; v_current integer; v_longest integer; v_award integer; v_inserted boolean; v_rows integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_enrollment from public.prayer_enrollments where id=p_enrollment_id and member_id=auth.uid() for update;
  if not found or v_enrollment.status <> 'active' then raise exception 'Active enrollment not found'; end if;
  v_today := (now() at time zone v_enrollment.enrollment_timezone)::date;
  v_day := v_today - v_enrollment.start_local_date + 1;
  if v_day < 1 or v_day > 30 then raise exception 'The 30-day journey is complete'; end if;
  insert into public.prayer_checkins(enrollment_id, local_date, journey_day)
  values(v_enrollment.id, v_today, v_day) on conflict(enrollment_id, local_date) do nothing;
  get diagnostics v_rows = row_count;
  v_inserted := v_rows > 0;
  select count(*)::int into v_total from public.prayer_checkins where enrollment_id=v_enrollment.id;
  with ordered as (
    select local_date, row_number() over(order by local_date desc) as n
    from public.prayer_checkins where enrollment_id=v_enrollment.id
  ), runs as (
    select count(*)::int as days from ordered
    where local_date = (case when exists(select 1 from public.prayer_checkins where enrollment_id=v_enrollment.id and local_date=v_today) then v_today else v_today-1 end) - (n::int - 1)
  ) select days into v_current from runs;
  with ordered as (
    select local_date, row_number() over(order by local_date) as n
    from public.prayer_checkins where enrollment_id=v_enrollment.id
  ), groups as (select count(*)::int as days from ordered group by local_date - n::int)
  select coalesce(max(days),0)::int into v_longest from groups;
  update public.prayer_enrollments set total_completed_days=v_total,current_streak=v_current,longest_streak=v_longest,missed_days=greatest(0,v_day-v_total) where id=v_enrollment.id;
  foreach v_award in array array[3,7,14,21,30] loop
    if v_total >= v_award then
      insert into public.prayer_achievements(enrollment_id, member_id, milestone)
      values(v_enrollment.id, auth.uid(), v_award) on conflict do nothing;
      get diagnostics v_rows = row_count;
      if v_rows > 0 then
        insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
        values(auth.uid(),v_enrollment.id,'in_app','milestone',v_today,v_award,'sent',jsonb_build_object('title',v_award||' day milestone','body','You have completed '||v_award||' days of your prayer journey.')) on conflict do nothing;
        if exists(select 1 from public.prayer_notification_preferences where member_id=auth.uid() and email_enabled) then
          insert into public.prayer_notification_deliveries(member_id,enrollment_id,channel,kind,local_date,reminder_hour,status,payload)
          select auth.uid(),v_enrollment.id,'email','milestone',v_today,v_award,'queued',jsonb_build_object('email',mp.email) from public.member_profiles mp where mp.id=auth.uid() and coalesce(mp.email,'')<>'' on conflict do nothing;
        end if;
      end if;
    end if;
  end loop;
  if v_day = 30 then update public.prayer_enrollments set status='completed',completed_at=coalesce(completed_at,now()) where id=v_enrollment.id; end if;
  return jsonb_build_object('journey_day',v_day,'total_completed',v_total,'current_streak',v_current,'longest_streak',v_longest,'missed_days',greatest(0,v_day-v_total),'already_checked_in',not v_inserted,'completed',v_day=30);
end $$;

create or replace function public.admin_correct_prayer_checkin(p_enrollment_id uuid, p_local_date date, p_note text, p_actor_email text)
returns integer language plpgsql security definer set search_path = public as $$
declare v_enrollment public.prayer_enrollments; v_today date; v_day integer; v_total integer; v_current integer; v_longest integer; v_award integer; v_rows integer;
begin
  if coalesce(auth.role(),'') <> 'service_role' or length(trim(coalesce(p_actor_email,'')))=0 then raise exception 'Administrator access required'; end if;
  if length(trim(coalesce(p_note,''))) < 10 then raise exception 'A correction note is required'; end if;
  select * into v_enrollment from public.prayer_enrollments where id=p_enrollment_id for update;
  if not found then raise exception 'Enrollment not found'; end if;
  v_today := (now() at time zone v_enrollment.enrollment_timezone)::date;
  v_day := p_local_date - v_enrollment.start_local_date + 1;
  if p_local_date > v_today or v_day < 1 or v_day > 30 then raise exception 'Choose a valid past or current journey day'; end if;
  insert into public.prayer_checkins(enrollment_id,local_date,journey_day,source)
  values(v_enrollment.id,p_local_date,v_day,'admin_correction');
  insert into public.prayer_admin_audit(actor_email,member_id,enrollment_id,action,local_date,journey_day,note)
  values(trim(p_actor_email),v_enrollment.member_id,v_enrollment.id,'add_checkin',p_local_date,v_day,trim(p_note));
  select count(*)::int into v_total from public.prayer_checkins where enrollment_id=v_enrollment.id;
  with ordered as (select local_date,row_number() over(order by local_date desc) as n from public.prayer_checkins where enrollment_id=v_enrollment.id), runs as (
    select count(*)::int as days from ordered where local_date=(case when exists(select 1 from public.prayer_checkins where enrollment_id=v_enrollment.id and local_date=v_today) then v_today else v_today-1 end)-(n::int-1)
  ) select coalesce(max(days),0)::int into v_current from runs;
  with ordered as (select local_date,row_number() over(order by local_date) as n from public.prayer_checkins where enrollment_id=v_enrollment.id), groups as (select count(*)::int as days from ordered group by local_date-n::int)
  select coalesce(max(days),0)::int into v_longest from groups;
  update public.prayer_enrollments set total_completed_days=v_total,current_streak=v_current,longest_streak=v_longest,missed_days=greatest(0,least(30,v_today-start_local_date+1)-v_total-case when v_today-start_local_date+1 between 1 and 30 and not exists(select 1 from public.prayer_checkins where enrollment_id=v_enrollment.id and local_date=v_today) then 1 else 0 end) where id=v_enrollment.id;
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
  if v_day=30 then update public.prayer_enrollments set status='completed',completed_at=coalesce(completed_at,now()) where id=v_enrollment.id; end if;
  return v_day;
end $$;

create or replace function public.claim_prayer_notification(p_delivery_id uuid)
returns public.prayer_notification_deliveries language plpgsql security definer set search_path=public as $$
declare v_delivery public.prayer_notification_deliveries;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service role required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_delivery_id::text,0));
  select * into v_delivery from public.prayer_notification_deliveries where id=p_delivery_id for update;
  if not found or v_delivery.status='sent' or v_delivery.status='skipped' then return null; end if;
  if v_delivery.attempts >= 5 then
    update public.prayer_notification_deliveries set status='skipped',error='Maximum delivery attempts reached',updated_at=now() where id=p_delivery_id;
    return null;
  end if;
  if v_delivery.status='processing' and v_delivery.updated_at>now()-interval '20 minutes' then return null; end if;
  update public.prayer_notification_deliveries set status='processing',attempts=attempts+1,updated_at=now(),error=null where id=p_delivery_id returning * into v_delivery;
  return v_delivery;
end $$;

create or replace function public.admin_save_prayer_challenge(p_id uuid,p_title text,p_description text,p_status text,p_days jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_day record; v_rows integer;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service role required'; end if;
  if jsonb_typeof(p_days)<>'array' or jsonb_array_length(p_days)<>30 then raise exception 'Exactly 30 day guides are required'; end if;
  if (select count(distinct (item->>'day_number')::integer)
      from jsonb_array_elements(p_days) as day_entry(item)
      where (item->>'day_number')::integer between 1 and 30)<>30 then
    raise exception 'Day numbers must contain each value from 1 through 30 exactly once';
  end if;
  if p_status not in ('draft','published','archived') then raise exception 'Invalid campaign status'; end if;
  update public.prayer_challenges set title=trim(p_title),description=trim(p_description),status=p_status,updated_at=now() where id=p_id;
  get diagnostics v_rows = row_count;
  if v_rows=0 then raise exception 'Campaign not found'; end if;
  for v_day in select * from jsonb_to_recordset(p_days) as x(day_number integer,title text,bible_reference text,encouragement text,prayer_points text[],completion_message text) loop
    insert into public.prayer_challenge_days(challenge_id,day_number,title,bible_reference,encouragement,prayer_points,completion_message,updated_at)
    values(p_id,v_day.day_number,trim(v_day.title),trim(v_day.bible_reference),trim(v_day.encouragement),v_day.prayer_points,trim(v_day.completion_message),now())
    on conflict(challenge_id,day_number) do update set title=excluded.title,bible_reference=excluded.bible_reference,encouragement=excluded.encouragement,prayer_points=excluded.prayer_points,completion_message=excluded.completion_message,updated_at=now();
  end loop;
  return true;
end $$;

create or replace function public.admin_create_prayer_campaign(p_title text,p_slug text,p_description text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_source uuid; v_new uuid; v_count integer;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service role required'; end if;
  select id into v_source from public.prayer_challenges where slug='30-day-prayer-streak';
  if v_source is null then raise exception 'Initial prayer challenge is missing'; end if;
  select count(*) into v_count from public.prayer_challenge_days where challenge_id=v_source;
  if v_count<>30 then raise exception 'Initial campaign must contain 30 guides'; end if;
  insert into public.prayer_challenges(title,slug,description,duration_days,minutes_per_day,status)
  values(trim(p_title),trim(p_slug),trim(p_description),30,10,'draft') returning id into v_new;
  insert into public.prayer_challenge_days(challenge_id,day_number,title,bible_reference,encouragement,prayer_points,completion_message)
  select v_new,day_number,title,bible_reference,encouragement,prayer_points,completion_message from public.prayer_challenge_days where challenge_id=v_source;
  return v_new;
end $$;

create or replace function public.consume_public_submission_limit(p_fingerprint text,p_purpose text)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_limit integer; v_window integer; v_start timestamptz; v_count integer;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service role required'; end if;
  if length(coalesce(p_fingerprint,''))<>64 then raise exception 'Invalid fingerprint'; end if;
  case p_purpose
    when 'contact' then v_limit:=5; v_window:=600;
    when 'question' then v_limit:=4; v_window:=600;
    when 'salvation' then v_limit:=5; v_window:=600;
    when 'program_registration' then v_limit:=5; v_window:=600;
    when 'program_interest' then v_limit:=4; v_window:=600;
    else raise exception 'Invalid purpose';
  end case;
  v_start:=to_timestamp(floor(extract(epoch from now())/v_window)*v_window);
  insert into public.public_submission_limits(fingerprint,purpose,window_started_at,request_count)
    values(p_fingerprint,p_purpose,v_start,1)
  on conflict(fingerprint,purpose,window_started_at) do update set request_count=public_submission_limits.request_count+1
  returning request_count into v_count;
  return v_count<=v_limit;
end $$;

alter table public.member_profiles enable row level security;
alter table public.prayer_challenges enable row level security;
alter table public.prayer_challenge_days enable row level security;
alter table public.prayer_enrollments enable row level security;
alter table public.prayer_checkins enable row level security;
alter table public.prayer_notification_preferences enable row level security;
alter table public.prayer_push_subscriptions enable row level security;
alter table public.prayer_notification_deliveries enable row level security;
alter table public.prayer_achievements enable row level security;
alter table public.member_communication_consents enable row level security;
alter table public.prayer_notification_templates enable row level security;
alter table public.prayer_admin_audit enable row level security;

drop policy if exists member_profiles_own on public.member_profiles;
drop policy if exists member_profiles_own_read on public.member_profiles;
drop policy if exists member_profiles_own_update on public.member_profiles;
drop policy if exists member_profiles_admin_read on public.member_profiles;
create policy member_profiles_own_read on public.member_profiles for select using(id=auth.uid());
create policy member_profiles_own_update on public.member_profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy member_profiles_admin_read on public.member_profiles for select using(public.is_admin_user());
drop policy if exists challenges_read on public.prayer_challenges;
create policy challenges_read on public.prayer_challenges for select using(
  status='published'
  or public.is_admin_user()
  or exists(select 1 from public.prayer_enrollments e where e.challenge_id=public.prayer_challenges.id and e.member_id=auth.uid())
);
drop policy if exists challenges_admin on public.prayer_challenges;
create policy challenges_admin on public.prayer_challenges for all using(public.is_admin_user()) with check(public.is_admin_user());
drop policy if exists challenge_days_read on public.prayer_challenge_days;
create policy challenge_days_read on public.prayer_challenge_days for select using(
  exists(select 1 from public.prayer_challenges c where c.id=public.prayer_challenge_days.challenge_id and (c.status='published' or public.is_admin_user()))
  or exists(select 1 from public.prayer_enrollments e where e.challenge_id=public.prayer_challenge_days.challenge_id and e.member_id=auth.uid())
);
drop policy if exists challenge_days_admin on public.prayer_challenge_days;
create policy challenge_days_admin on public.prayer_challenge_days for all using(public.is_admin_user()) with check(public.is_admin_user());
drop policy if exists enrollments_own on public.prayer_enrollments;
create policy enrollments_own on public.prayer_enrollments for select using(member_id=auth.uid());
drop policy if exists enrollments_admin on public.prayer_enrollments;
drop policy if exists enrollments_admin_read on public.prayer_enrollments;
create policy enrollments_admin_read on public.prayer_enrollments for select using(public.is_admin_user());
drop policy if exists checkins_own on public.prayer_checkins;
create policy checkins_own on public.prayer_checkins for select using(exists(select 1 from public.prayer_enrollments e where e.id=public.prayer_checkins.enrollment_id and e.member_id=auth.uid()));
drop policy if exists checkins_admin on public.prayer_checkins;
drop policy if exists checkins_admin_read on public.prayer_checkins;
create policy checkins_admin_read on public.prayer_checkins for select using(public.is_admin_user());
drop policy if exists preferences_own on public.prayer_notification_preferences;
create policy preferences_own on public.prayer_notification_preferences for all using(member_id=auth.uid()) with check(member_id=auth.uid());
drop policy if exists subscriptions_own on public.prayer_push_subscriptions;
create policy subscriptions_own on public.prayer_push_subscriptions for all using(member_id=auth.uid()) with check(member_id=auth.uid());
drop policy if exists deliveries_own on public.prayer_notification_deliveries;
create policy deliveries_own on public.prayer_notification_deliveries for select using(member_id=auth.uid());
drop policy if exists deliveries_admin_read on public.prayer_notification_deliveries;
create policy deliveries_admin_read on public.prayer_notification_deliveries for select using(public.is_admin_user());
drop policy if exists achievements_own on public.prayer_achievements;
create policy achievements_own on public.prayer_achievements for select using(member_id=auth.uid());
drop policy if exists achievements_admin_read on public.prayer_achievements;
create policy achievements_admin_read on public.prayer_achievements for select using(public.is_admin_user());
drop policy if exists consents_own on public.member_communication_consents;
create policy consents_own on public.member_communication_consents for all using(member_id=auth.uid()) with check(member_id=auth.uid());
drop policy if exists consents_admin_read on public.member_communication_consents;
create policy consents_admin_read on public.member_communication_consents for select using(public.is_admin_user());
drop policy if exists templates_admin on public.prayer_notification_templates;
create policy templates_admin on public.prayer_notification_templates for all using(public.is_admin_user()) with check(public.is_admin_user());
drop policy if exists audit_admin_read on public.prayer_admin_audit;
create policy audit_admin_read on public.prayer_admin_audit for select using(public.is_admin_user());

revoke all on function public.enroll_prayer_member(uuid) from public;
grant execute on function public.enroll_prayer_member(uuid) to authenticated;
revoke all on function public.checkin_prayer(uuid) from public;
grant execute on function public.checkin_prayer(uuid) to authenticated;
revoke all on function public.admin_correct_prayer_checkin(uuid,date,text,text) from public, authenticated;
grant execute on function public.admin_correct_prayer_checkin(uuid,date,text,text) to service_role;
revoke all on function public.claim_prayer_notification(uuid) from public, authenticated;
grant execute on function public.claim_prayer_notification(uuid) to service_role;
revoke all on function public.admin_save_prayer_challenge(uuid,text,text,text,jsonb) from public,authenticated;
grant execute on function public.admin_save_prayer_challenge(uuid,text,text,text,jsonb) to service_role;
revoke all on function public.admin_create_prayer_campaign(text,text,text) from public,authenticated;
grant execute on function public.admin_create_prayer_campaign(text,text,text) to service_role;
alter table public.public_submission_limits enable row level security;
revoke all on public.public_submission_limits from anon,authenticated;
revoke all on function public.consume_public_submission_limit(text,text) from public,anon,authenticated;
grant execute on function public.consume_public_submission_limit(text,text) to service_role;

insert into public.prayer_challenges(slug,title,description,duration_days,minutes_per_day,status)
values('30-day-prayer-streak','30-Day Prayer Streak Challenge','Build a steady rhythm of prayer with ten focused minutes each day for thirty calendar days.',30,10,'published')
on conflict(slug) do nothing;

with challenge as (select id from public.prayer_challenges where slug='30-day-prayer-streak'), days(day_number,title,bible_reference,encouragement,prayer_points,completion_message) as (values
(1,'Begin with trust','Proverbs 3:5–6','Bring your plans to God and make room to listen.','{Offer your day to God,Ask for wisdom,Name one concern you are carrying}','You began with trust. Return tomorrow for another quiet step.'),
(2,'Make room for stillness','Psalm 46:10','Slow down enough to remember that God is present.','{Take a few quiet breaths,Thank God for His presence,Ask for a settled heart}','You made room for stillness. Carry that calm into your day.'),
(3,'Give thanks','1 Thessalonians 5:16–18','Gratitude helps you notice gifts that routine can hide.','{Name three things you are grateful for,Pray for someone who encouraged you,Thank God for daily provision}','Three days of showing up. Celebrate the steady beginning.'),
(4,'Ask for wisdom','James 1:5','Bring a real decision to God and ask for wisdom to act well.','{Describe one decision,Ask for wisdom without fear,Consider one faithful next step}','You asked for wisdom. Keep seeking it in prayer and practice.'),
(5,'Pray for family','Joshua 24:15','Hold the people closest to you in prayer with patience and care.','{Pray for a family member by name,Ask for peace in your home,Offer thanks for someone who shaped you}','You made space to pray for family. May care continue beyond this moment.'),
(6,'Choose forgiveness','Ephesians 4:32','Ask for help to release resentment and act with compassion.','{Name a hurt honestly,Ask for strength to forgive,Pray for wise boundaries and healing}','You brought a hard matter to prayer. Let healing take its time.'),
(7,'Rest in grace','Matthew 11:28–30','You do not need to earn God’s care; bring your burdens to Him.','{Name what feels heavy,Ask for rest and help,Pray for someone who is weary}','One week completed. Your growing rhythm matters more than speed.'),
(8,'Pray for your community','Jeremiah 29:7','Seek the wellbeing of the people and places around you.','{Pray for your neighborhood,Ask for care for those in need,Consider one practical act of service}','You prayed beyond yourself. Look for a small way to serve.'),
(9,'Grow in patience','Colossians 3:12','Patience is practiced in ordinary moments with other people.','{Recall a moment you need patience,Ask for gentleness in your words,Pray for someone difficult to understand}','You practiced patience in prayer. Keep choosing a gentle response.'),
(10,'Bring your worries','Philippians 4:6–7','Name your worries and ask for peace and a clear next step.','{Name a worry without minimizing it,Ask for peace,Identify one helpful action you can take}','Ten days of prayer. Notice what has helped you keep returning.'),
(11,'Pray for healing','James 5:13–16','Bring illness and suffering to God, and seek wise support from others.','{Pray for someone who is unwell,Ask for comfort for caregivers,Consider how you can offer practical support}','You held someone in prayer. Continue to offer care in practical ways.'),
(12,'Practice humility','Micah 6:8','Ask how to act justly, love mercy, and walk humbly today.','{Review a recent choice honestly,Ask for a teachable spirit,Pray for fairness in your community}','You made room for humility. Let it shape one choice today.'),
(13,'Remember hope','Romans 15:13','Hope can coexist with difficulty; ask for strength for the next step.','{Name one place you need hope,Pray for someone facing uncertainty,Ask for courage to keep going}','You turned toward hope. Keep taking the next faithful step.'),
(14,'Pray for wisdom in words','Proverbs 15:1','Ask for words that are truthful, kind, and suited to the moment.','{Think of a conversation ahead,Ask for listening as well as speaking,Pray for reconciliation where possible}','Two weeks in. May your words carry more care and clarity.'),
(15,'Serve with love','Galatians 5:13','Prayer can guide the simple ways you serve people around you.','{Pray for someone who needs support,Ask how to serve without seeking praise,Choose one practical act of kindness}','You prayed toward service. Let one small action follow.'),
(16,'Pray for leaders','1 Timothy 2:1–2','Pray for leaders to act with wisdom, justice, and concern for others.','{Pray for local leaders,Ask for integrity in public service,Pray for peace and fairness}','You remembered those carrying responsibility. Keep praying for wise service.'),
(17,'Seek understanding','Proverbs 18:13','Listening carefully is one way to honor another person.','{Recall a time you need to listen better,Ask for curiosity and patience,Pray for someone whose view differs from yours}','You practiced listening in prayer. Bring that patience into conversation.'),
(18,'Pray through change','Isaiah 43:19','Change can be unsettling; ask for courage to notice a way forward.','{Name a change you are facing,Ask for steadiness and wise counsel,Pray for someone beginning a new season}','You brought change to God. Take the next step with care.'),
(19,'Care for creation','Psalm 24:1','Give thanks for the natural world and consider how to care for it.','{Thank God for a place in nature,Pray for communities facing environmental harm,Choose one way to reduce waste or protect a place}','You made room for gratitude and care for creation.'),
(20,'Pray for peace','Matthew 5:9','Ask for peace that includes justice, safety, and restored relationships.','{Pray for a conflict near or far,Ask for protection for vulnerable people,Consider a peace-making action within your reach}','You prayed for peace. Keep seeking what is just and life-giving.'),
(21,'Stay faithful','Hebrews 10:23–24','Faithfulness grows through repeated choices and mutual encouragement.','{Recall what has helped you return to prayer,Pray for a friend who needs encouragement,Ask for strength for the coming week}','Three weeks completed. Your consistency is taking shape.'),
(22,'Pray for children and young people','Psalm 78:4','Hold the next generation in prayer and support their wellbeing.','{Pray for a child or young person by name,Ask for safety and good mentors,Pray for access to learning and opportunity}','You prayed for the next generation. Look for a way to encourage them.'),
(23,'Ask for courage','Joshua 1:9','Courage is not the absence of fear; ask for help to do what is right.','{Name a step you are avoiding,Ask for courage and sound judgment,Pray for someone acting bravely for others}','You asked for courage. Move thoughtfully toward the good you can do.'),
(24,'Pray for those who are grieving','Psalm 34:18','Grief needs presence and patience more than quick explanations.','{Remember someone grieving,Ask for comfort without easy answers,Consider a gentle check-in or practical support}','You made room for grief and compassion. Keep showing up gently.'),
(25,'Practice generosity','2 Corinthians 9:7','Consider how to share time, attention, or resources freely and wisely.','{Give thanks for what you have received,Pray for someone facing scarcity,Ask where you can share with care}','You prayed about generosity. Let kindness guide what you share.'),
(26,'Pray for reconciliation','Romans 12:18','Seek peace where possible while respecting safety, truth, and boundaries.','{Name a relationship needing peace,Ask for honesty and humility,Pray for safety and wise support where needed}','You prayed for peace in relationships. Reconciliation can take time.'),
(27,'Give thanks for growth','Philippians 1:6','Notice growth without demanding perfection from yourself.','{Name one way you have grown,Thank someone who helped you,Ask for patience with unfinished work}','You noticed growth. Keep learning one day at a time.'),
(28,'Pray for the church','Ephesians 4:1–3','Pray for communities of faith to practice unity, patience, and care.','{Pray for your church community,Ask for unity with room for honest difference,Pray for leaders and those they serve}','You prayed for the church. Help build the care you hope to see.'),
(29,'Offer your gifts','1 Peter 4:10','Your abilities can become a practical gift to other people.','{Name a gift or skill you can offer,Ask where it could serve others,Pray for people whose work is often unseen}','You considered how to serve with your gifts. Keep offering them generously.'),
(30,'Continue the journey','Psalm 90:17','The final day is also an invitation to keep a sustainable rhythm.','{Give thanks for completing this journey,Reflect on what helped you pray,Choose a simple next rhythm and ask for support}','Thirty days completed. Celebrate your commitment and carry prayer into the days ahead.')
)
insert into public.prayer_challenge_days(challenge_id,day_number,title,bible_reference,encouragement,prayer_points,completion_message)
select c.id,d.day_number,d.title,d.bible_reference,d.encouragement,d.prayer_points::text[],d.completion_message from challenge c cross join days d
on conflict(challenge_id,day_number) do nothing;

insert into public.prayer_notification_templates(template_key,subject,body) values
('welcome','Welcome to the 30-Day Prayer Streak','Welcome {{display_name}}. Your first day of the prayer journey is {{start_date}}.'),
('reminder','A moment for prayer today','Your Day {{journey_day}} prayer guide is ready. Take ten quiet minutes when you can.'),
('milestone','A prayer streak milestone','You have completed {{milestone}} days of your prayer journey. Keep going at your own pace.')
on conflict(template_key) do nothing;
