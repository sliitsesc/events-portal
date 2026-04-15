-- Run this in Supabase SQL Editor.
-- Purpose: allow admins to read all profile rows so admin registrants table can show name/email for all users.

-- 1) Helper function to check whether current authenticated user is an admin.
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

-- 2) Admins can read all profiles; regular users can still read only their own row.
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.is_current_user_admin()
);
