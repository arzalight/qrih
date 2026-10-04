create or replace function public.get_property_publisher_contact(
  p_property_id uuid
)
returns table(
  name text,
  phone text,
  company text,
  email text
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    p.full_name as name,
    p.phone,
    p.company_name as company,
    u.email
  from public.properties pr
  join public.profiles p
    on p.id = pr.owner_id
  join auth.users u
    on u.id = pr.owner_id
  where pr.id = p_property_id
    and pr.status = 'published'
    and pr.owner_id <> auth.uid()
    and exists (
      select 1
      from public.property_contact_authorizations contact_authorization
      where contact_authorization.property_id = pr.id
        and contact_authorization.advisor_id = auth.uid()
        and contact_authorization.status = 'authorized'
    );
$function$;
