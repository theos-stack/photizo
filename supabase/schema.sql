create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  flyer_url text,
  date date,
  time text,
  location text,
  online_link text,
  registration_deadline date,
  registration_form jsonb not null default '[]'::jsonb,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.program_registrations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  full_name text not null,
  email text,
  whatsapp text,
  country text,
  city text,
  program_of_interest text,
  how_did_you_hear text,
  message text,
  custom_answers jsonb not null default '{}'::jsonb,
  status text default 'new',
  created_at timestamptz default now()
);

create table if not exists public.salvation_responses (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  whatsapp text,
  country text,
  city text,
  received_christ_today boolean,
  needs_follow_up boolean,
  attends_church boolean,
  message text,
  status text default 'new',
  assigned_to text,
  next_follow_up_date date,
  created_at timestamptz default now()
);

create table if not exists public.biblical_questions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  whatsapp text,
  country text,
  city text,
  category text,
  question text not null,
  wants_private_response boolean default true,
  allow_public_answer boolean default false,
  status text default 'new',
  assigned_to text,
  internal_notes text,
  response_notes text,
  created_at timestamptz default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  whatsapp text,
  subject text,
  message text not null,
  status text default 'new',
  created_at timestamptz default now()
);

create table if not exists public.follow_up_logs (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  record_id uuid not null,
  note text not null,
  next_action text,
  next_follow_up_date date,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  email text,
  whatsapp text,
  instagram text,
  facebook text,
  youtube text,
  telegram text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.admin_users enable row level security;
alter table public.programs enable row level security;
alter table public.program_registrations enable row level security;
alter table public.salvation_responses enable row level security;
alter table public.biblical_questions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.follow_up_logs enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Admins can view own admin record" on public.admin_users;
create policy "Admins can view own admin record"
on public.admin_users
for select
using (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

drop policy if exists "Public can read published programs" on public.programs;
create policy "Public can read published programs"
on public.programs
for select
using (status = 'published' or public.is_admin_user());

drop policy if exists "Admins can manage programs" on public.programs;
create policy "Admins can manage programs"
on public.programs
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can manage registrations" on public.program_registrations;
create policy "Admins can manage registrations"
on public.program_registrations
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can manage salvation responses" on public.salvation_responses;
create policy "Admins can manage salvation responses"
on public.salvation_responses
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can manage biblical questions" on public.biblical_questions;
create policy "Admins can manage biblical questions"
on public.biblical_questions
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages"
on public.contact_messages
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can manage follow up logs" on public.follow_up_logs;
create policy "Admins can manage follow up logs"
on public.follow_up_logs
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings
for all
using (public.is_admin_user())
with check (public.is_admin_user());

insert into storage.buckets (id, name, public)
values ('program-flyers', 'program-flyers', true)
on conflict (id) do nothing;

drop policy if exists "Public can view program flyers" on storage.objects;
create policy "Public can view program flyers"
on storage.objects
for select
using (bucket_id = 'program-flyers');

drop policy if exists "Admins can upload program flyers" on storage.objects;
create policy "Admins can upload program flyers"
on storage.objects
for all
using (bucket_id = 'program-flyers' and public.is_admin_user())
with check (bucket_id = 'program-flyers' and public.is_admin_user());
