alter table public.admin_users
add column if not exists role text default 'admin';

create or replace function public.is_super_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
      and role = 'super_admin'
  );
$$;

drop policy if exists "Admins can view own admin record" on public.admin_users;
create policy "Admins can view own admin record"
on public.admin_users
for select
using (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

drop policy if exists "Super admins can manage admin users" on public.admin_users;
create policy "Super admins can manage admin users"
on public.admin_users
for all
using (public.is_super_admin_user())
with check (public.is_super_admin_user());
