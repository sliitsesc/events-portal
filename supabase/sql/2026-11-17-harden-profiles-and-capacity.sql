-- REVIEW BEFORE APPLYING. Run in the Supabase SQL editor (as the postgres role).
-- Written without access to the live schema: check column/table names first.

-- 1) Stop signed-in users from changing their own role flags.
--    RLS decides WHICH ROWS a user may update, not which COLUMNS, so without
--    this a user could run supabase.from('profiles').update({ is_admin: true }).
--    The SQL editor / service role have auth.uid() = null and are unaffected.
create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_current_user_admin()
     and (
       new.is_admin     is distinct from old.is_admin or
       new.is_volunteer is distinct from old.is_volunteer
     )
  then
    raise exception 'Not allowed to change role flags';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_roles on public.profiles;
create trigger profiles_protect_roles
before update on public.profiles
for each row execute function public.protect_profile_roles();

-- Inserts must not self-assign roles either.
create or replace function public.protect_profile_roles_on_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null
     and (coalesce(new.is_admin,false) or coalesce(new.is_volunteer,false))
  then
    raise exception 'Not allowed to set role flags on insert';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_roles_insert on public.profiles;
create trigger profiles_protect_roles_insert
before insert on public.profiles
for each row execute function public.protect_profile_roles_on_insert();

-- 2) Enforce capacity atomically (the app's count-then-insert can oversell).
create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap integer;
  taken integer;
begin
  if new.status <> 'registered' then
    return new;
  end if;

  -- Serialise concurrent registrations for the same event.
  select capacity into cap from public.events where id = new.event_id for update;

  if cap is not null then
    select count(*) into taken
    from public.event_registrations
    where event_id = new.event_id
      and status = 'registered'
      and id is distinct from new.id;

    if taken >= cap then
      raise exception 'EVENT_FULL' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists event_registrations_capacity on public.event_registrations;
create trigger event_registrations_capacity
before insert or update of status on public.event_registrations
for each row execute function public.enforce_event_capacity();
