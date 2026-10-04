alter table public.profiles
  add column if not exists identity_last_changed_at timestamptz,
  add column if not exists identity_change_locked_until timestamptz;

create or replace function public.protect_profile_identity_changes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
begin
  if auth.uid() is not null
     and (
       new.full_name is distinct from old.full_name
       or new.company_name is distinct from old.company_name
     )
  then
    if old.identity_change_locked_until is not null
       and old.identity_change_locked_until > now()
    then
      raise exception 'El nombre y la empresa están bloqueados hasta %.',
        to_char(
          old.identity_change_locked_until at time zone 'America/Mexico_City',
          'DD/MM/YYYY'
        );
    end if;

    new.identity_last_changed_at := now();
    new.identity_change_locked_until := now() + interval '30 days';
  end if;

  return new;
end;
$function$;

drop trigger if exists protect_profile_identity_changes on public.profiles;

create trigger protect_profile_identity_changes
  before update on public.profiles
  for each row
  execute function public.protect_profile_identity_changes();
