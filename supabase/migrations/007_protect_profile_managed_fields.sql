create or replace function public.prevent_self_profile_role_change()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if auth.uid() is not null and (
    new.role is distinct from old.role
    or new.plan is distinct from old.plan
    or new.trial_ends_at is distinct from old.trial_ends_at
  ) then
    raise exception 'No tienes permiso para cambiar los campos administrados de tu perfil.';
  end if;

  return new;
end;
$function$;
