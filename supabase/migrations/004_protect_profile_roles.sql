drop policy if exists "Users can insert their own profile" on public.profiles;

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (
    id = auth.uid()
    and role = 'publisher'
  );

create or replace function public.prevent_self_profile_role_change()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'No tienes permiso para cambiar tu rol.';
  end if;

  return new;
end;
$function$;

drop trigger if exists prevent_self_profile_role_change on public.profiles;

create trigger prevent_self_profile_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_self_profile_role_change();
