create or replace function public.respond_property_contact_authorization(
  p_authorization_id uuid,
  p_status text
)
returns table(status text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_authorization record;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión.';
  end if;

  if p_status not in ('authorized', 'declined') then
    raise exception 'Solicitud inválida.';
  end if;

  select
    contact_authorization.id,
    contact_authorization.property_id,
    contact_authorization.advisor_id,
    contact_authorization.status,
    property_record.title
  into v_authorization
  from public.property_contact_authorizations contact_authorization
  join public.properties property_record
    on property_record.id = contact_authorization.property_id
  where contact_authorization.id = p_authorization_id
    and property_record.owner_id = auth.uid()
  for update of contact_authorization;

  if not found then
    raise exception 'No tienes permiso para responder esta solicitud.';
  end if;

  if v_authorization.status <> 'pending' then
    raise exception 'Esta solicitud ya fue respondida.';
  end if;

  update public.property_contact_authorizations
  set
    status = p_status,
    responded_at = now()
  where id = p_authorization_id;

  if p_status = 'authorized' and v_authorization.advisor_id is not null then
    insert into public.notifications (
      user_id,
      type,
      title,
      message,
      property_id
    )
    values (
      v_authorization.advisor_id,
      'property_contact_authorized',
      'Contacto autorizado',
      'El propietario autorizó tu solicitud de contacto para: ' ||
        v_authorization.title,
      v_authorization.property_id
    );
  end if;

  return query select p_status;
end;
$function$;
