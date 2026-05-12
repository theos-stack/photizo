drop policy if exists "Admins can view own admin record" on public.admin_users;

create policy "Admins can view own admin record"
on public.admin_users
for select
using (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));
