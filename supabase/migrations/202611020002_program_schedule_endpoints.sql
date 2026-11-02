begin;

alter table public.programs
  add column if not exists end_date date,
  add column if not exists end_time text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'programs_end_schedule_pair_check'
      and conrelid = 'public.programs'::regclass
  ) then
    alter table public.programs
      add constraint programs_end_schedule_pair_check
      check (
        (end_date is null and end_time is null)
        or (date is not null and end_date is not null and nullif(btrim(end_time), '') is not null and end_date >= date)
      );
  end if;
end;
$$;

comment on column public.programs.end_date is
  'Optional local programme end date. Ongoing visibility requires an explicit end date and time.';
comment on column public.programs.end_time is
  'Optional local programme end time paired with end_date; programme schedules use Africa/Lagos.';

commit;
