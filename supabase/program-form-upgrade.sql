alter table public.programs
add column if not exists registration_form jsonb not null default '[]'::jsonb;

alter table public.program_registrations
add column if not exists custom_answers jsonb not null default '{}'::jsonb;
