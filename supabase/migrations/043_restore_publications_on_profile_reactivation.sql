begin;

create or replace function public.admin_set_profile_account_status(
  target_profile_id uuid,
  next_status text,
  reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $function$
declare
  updated_profile public.profiles;
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'No tienes permisos para cambiar el estado de la cuenta.';
  end if;

  if next_status not in ('active', 'suspended') then
    raise exception 'Estado de cuenta no válido.';
  end if;

  if next_status = 'suspended'
     and nullif(trim(reason), '') is null then
    raise exception 'Debes indicar un motivo para suspender la cuenta.';
  end if;

  update public.profiles
  set
    account_status = next_status,
    suspension_reason = case
      when next_status = 'suspended' then trim(reason)
      else null
    end,
    suspended_at = case
      when next_status = 'suspended' then now()
      else null
    end,
    suspended_by = case
      when next_status = 'suspended' then auth.uid()
      else null
    end,
    publications_enabled = case
      when next_status = 'suspended' then false
      when next_status = 'active' then true
      else publications_enabled
    end
  where id = target_profile_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'El perfil indicado no existe.';
  end if;

  return updated_profile;
end;
$function$;

revoke all on function public.admin_set_profile_account_status(uuid, text, text)
from public;

grant execute on function public.admin_set_profile_account_status(uuid, text, text)
to authenticated;

commit;
