begin;

create or replace function public.notify_property_rejected(
  p_property_id uuid,
  p_rejection_reason text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner_id uuid;
  v_property_title text;
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Usuario no autorizado.';
  end if;

  select
    owner_id,
    title
  into
    v_owner_id,
    v_property_title
  from public.properties
  where id = p_property_id
    and status = 'rejected';

  if v_owner_id is null or v_property_title is null then
    raise exception 'Propiedad rechazada no válida.';
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
    'property_rejected',
    'Tu propiedad fue rechazada',
    'La propiedad "' ||
      v_property_title ||
      '" fue rechazada.' ||
      case
        when nullif(trim(p_rejection_reason), '') is not null
        then ' Motivo: ' || trim(p_rejection_reason)
        else ''
      end,
    p_property_id
  );
end;
$function$;

create or replace function public.notify_property_published(
  p_property_id uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner_id uuid;
  v_property_title text;
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Usuario no autorizado.';
  end if;

  select
    owner_id,
    title
  into
    v_owner_id,
    v_property_title
  from public.properties
  where id = p_property_id
    and status = 'published';

  if v_owner_id is null or v_property_title is null then
    raise exception 'Propiedad publicada no válida.';
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
    'property_published',
    'Tu propiedad fue publicada',
    'La propiedad "' ||
      v_property_title ||
      '" ya está publicada y disponible para recibir interesados.',
    p_property_id
  );
end;
$function$;

commit;
