begin;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$function$;

revoke all on function public.current_user_is_admin()
from public;

grant execute on function public.current_user_is_admin()
to authenticated;

drop policy if exists "admins can read all profiles" on public.profiles;

create policy "admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (
    public.current_user_is_admin()
  );

commit;
