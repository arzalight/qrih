create or replace function public.get_auto_approve_contact_requests(p_owner_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (
      select auto_approve_contact_requests
      from public.profiles
      where id = p_owner_id
    ),
    false
  );
$function$;

create or replace function public.notify_opportunity_property_registered(
  p_demand_request_id uuid,
  p_property_id uuid,
  p_registered_by uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_property_title text;
begin
  if p_registered_by <> auth.uid() then
    raise exception 'Usuario no autorizado.';
  end if;

  select user_id
  into v_user_id
  from public.demand_requests
  where id = p_demand_request_id;

  select title
  into v_property_title
  from public.properties
  where id = p_property_id
    and owner_id = auth.uid()
    and status = 'published';

  if v_user_id is null or v_property_title is null then
    raise exception 'Datos de oportunidad no válidos.';
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    demand_request_id,
    property_id
  )
  values (
    v_user_id,
    'opportunity_property_registered',
    'Nueva propiedad para tu requerimiento',
    'Una propiedad fue registrada como compatible con tu requerimiento: ' ||
      v_property_title,
    p_demand_request_id,
    p_property_id
  );
end;
$function$;

create or replace function public.notify_property_contact_request(
  p_property_id uuid,
  p_contact_id uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner_id uuid;
  v_property_title text;
  v_contact_name text;
begin
  select
    owner_id,
    title
  into
    v_owner_id,
    v_property_title
  from public.properties
  where id = p_property_id
    and status = 'published';

  select name
  into v_contact_name
  from public.property_contacts
  where id = p_contact_id
    and property_id = p_property_id;

  if v_owner_id is null or v_property_title is null or v_contact_name is null then
    raise exception 'Datos de solicitud de contacto no válidos.';
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    property_id
  )
  values (
    v_owner_id,
    'property_contact_request',
    'Nueva solicitud de contacto',
    v_contact_name ||
      ' solicitó información sobre tu propiedad: ' ||
      v_property_title,
    p_property_id
  );
end;
$function$;
