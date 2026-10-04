begin;

alter table public.profiles
  add column if not exists is_verified boolean not null default false;

create or replace function public.admin_set_profile_verified(
  target_profile_id uuid,
  verified boolean
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
    raise exception 'No tienes permisos para verificar perfiles.';
  end if;

  update public.profiles
  set is_verified = verified
  where id = target_profile_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'El perfil indicado no existe.';
  end if;

  return updated_profile;
end;
$function$;

revoke all on function public.admin_set_profile_verified(uuid, boolean)
from public;

grant execute on function public.admin_set_profile_verified(uuid, boolean)
to authenticated;

commit;
