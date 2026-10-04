begin;

create or replace function public.prevent_self_profile_role_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
begin
  if auth.uid() is not null
     and not public.current_user_is_admin()
     and (
       new.role is distinct from old.role
       or new.plan is distinct from old.plan
       or new.trial_ends_at is distinct from old.trial_ends_at
       or new.is_verified is distinct from old.is_verified
       or new.account_status is distinct from old.account_status
       or new.suspension_reason is distinct from old.suspension_reason
       or new.suspended_at is distinct from old.suspended_at
       or new.suspended_by is distinct from old.suspended_by
     )
  then
    raise exception 'No tienes permiso para cambiar los campos administrados de tu perfil.';
  end if;

  return new;
end;
$function$;

commit;
