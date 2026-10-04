-- Baseline exclusivo para staging vacío. Capturado del catálogo activo el 2026-10-03.
-- Fuente: dmtvnwsuhehxfftddsap. Destino permitido: mcyxunymhuxyiwklyfpy.
-- No incluye filas, usuarios Auth, objetos Storage, claves ni configuración Auth.
-- No ejecutar sobre el proyecto existente ni combinar con 001–043.
begin;
set local search_path = public, extensions, pg_catalog;
set local check_function_bodies = false;
do $$ begin if exists(select 1 from pg_tables where schemaname='public') then raise exception 'El baseline requiere public vacío'; end if; end $$;
create type public."plan_code" as enum ('trial','basic','intermediate','advanced');
create type public."property_status" as enum ('draft','pending','published','paused','rejected','expired','pending_update');
create sequence public."profiles_public_id_seq" as bigint start with 100001 increment by 1 cache 1;
create table public."audit_logs" (
  "id" bigint generated always as identity not null,
  "actor_id" uuid,
  "entity_type" text not null,
  "entity_id" uuid,
  "action" text not null,
  "metadata" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone default now()
);
create table public."demand_requests" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "phone" text not null,
  "email" text not null,
  "company" text,
  "operation" text,
  "zone" text,
  "area_requirement" text,
  "budget" text,
  "notes" text,
  "status" text default 'new'::text not null,
  "created_at" timestamp with time zone default now(),
  "zone_general" text,
  "area_min" numeric,
  "area_max" numeric,
  "budget_min" numeric,
  "budget_max" numeric,
  "user_id" uuid,
  "giro" text
);
create table public."home_pool" (
  "property_id" uuid not null,
  "active" boolean default true,
  "added_at" timestamp with time zone default now()
);
create table public."notifications" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "type" text not null,
  "title" text not null,
  "message" text not null,
  "demand_request_id" uuid,
  "property_id" uuid,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);
create table public."opportunity_property_registrations" (
  "id" uuid default gen_random_uuid() not null,
  "demand_request_id" uuid not null,
  "property_id" uuid not null,
  "registered_by" uuid not null,
  "status" text default 'registered'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public."platform_settings" (
  "id" boolean default true not null,
  "support_email" text,
  "updated_at" timestamp with time zone default now() not null,
  "updated_by" uuid
);
create table public."profiles" (
  "id" uuid not null,
  "full_name" text not null,
  "phone" text,
  "company_name" text,
  "website" text,
  "role" text default 'publisher'::text not null,
  "plan" plan_code default 'trial'::plan_code not null,
  "trial_ends_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "user_type" text,
  "auto_approve_contact_requests" boolean default false not null,
  "public_id" bigint default nextval('profiles_public_id_seq'::regclass) not null,
  "whatsapp" text,
  "instagram_url" text,
  "facebook_url" text,
  "linkedin_url" text,
  "avatar_url" text,
  "identity_last_changed_at" timestamp with time zone,
  "identity_change_locked_until" timestamp with time zone,
  "is_verified" boolean default false not null,
  "account_status" text default 'active'::text not null,
  "suspension_reason" text,
  "suspended_at" timestamp with time zone,
  "suspended_by" uuid,
  "publications_enabled" boolean default true not null
);
create table public."properties" (
  "id" uuid default gen_random_uuid() not null,
  "owner_id" uuid not null,
  "slug" text not null,
  "title" text not null,
  "operation" text not null,
  "status" property_status default 'draft'::property_status not null,
  "zone" text not null,
  "address" text,
  "location_visibility" text default 'zone'::text not null,
  "price_display" text not null,
  "price_plus_vat" boolean default false,
  "price_plus_maintenance" boolean default false,
  "negotiable" boolean default false,
  "total_area" numeric,
  "covered_area" numeric,
  "exterior_area" numeric,
  "max_height" text,
  "offices_area" numeric,
  "parking" integer,
  "docks" integer,
  "description" text,
  "share_commission" boolean default false,
  "main_image" text,
  "featured" boolean default false,
  "featured_priority" integer,
  "publication_authorized_at" timestamp with time zone,
  "terms_accepted_at" timestamp with time zone,
  "last_verified_at" timestamp with time zone,
  "verification_due_at" timestamp with time zone,
  "rejection_reason" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "previous_data" jsonb,
  "zone_general" text,
  "price_value" numeric,
  "price_unit" text
);
create table public."property_contact_authorizations" (
  "id" uuid default gen_random_uuid() not null,
  "property_id" uuid not null,
  "demand_request_id" uuid,
  "status" text default 'pending'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "responded_at" timestamp with time zone,
  "advisor_id" uuid,
  "contact_id" uuid
);
create table public."property_contacts" (
  "id" uuid default gen_random_uuid() not null,
  "property_id" uuid,
  "name" text not null,
  "phone" text,
  "email" text not null,
  "company" text,
  "message" text,
  "source" text,
  "utm" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone default now()
);
create table public."property_images" (
  "id" uuid default gen_random_uuid() not null,
  "property_id" uuid not null,
  "storage_path" text not null,
  "category" text default 'gallery'::text,
  "position" integer default 0,
  "created_at" timestamp with time zone default now(),
  "title" text
);
create table public."property_interest_requests" (
  "id" uuid default gen_random_uuid() not null,
  "demand_request_id" uuid not null,
  "property_id" uuid not null,
  "user_id" uuid not null,
  "status" text default 'interested'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public."property_views" (
  "id" uuid default gen_random_uuid() not null,
  "property_id" uuid not null,
  "created_at" timestamp with time zone default now() not null
);
alter table public."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY (id);
alter table public."demand_requests" add constraint "demand_requests_pkey" PRIMARY KEY (id);
alter table public."home_pool" add constraint "home_pool_pkey" PRIMARY KEY (property_id);
alter table public."notifications" add constraint "notifications_pkey" PRIMARY KEY (id);
alter table public."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['opportunity_property_registered'::text, 'property_contact_request'::text, 'property_contact_authorized'::text, 'property_published'::text, 'property_rejected'::text])));
alter table public."opportunity_property_registrations" add constraint "opportunity_property_registra_demand_request_id_property_id_key" UNIQUE (demand_request_id, property_id);
alter table public."opportunity_property_registrations" add constraint "opportunity_property_registrations_pkey" PRIMARY KEY (id);
alter table public."opportunity_property_registrations" add constraint "opportunity_property_registrations_status_check" CHECK ((status = ANY (ARRAY['registered'::text, 'presented'::text, 'interested'::text, 'visit'::text, 'negotiation'::text, 'closed'::text, 'cancelled'::text])));
alter table public."platform_settings" add constraint "platform_settings_pkey" PRIMARY KEY (id);
alter table public."platform_settings" add constraint "platform_settings_single_row" CHECK ((id = true));
alter table public."profiles" add constraint "profiles_account_status_check" CHECK ((account_status = ANY (ARRAY['active'::text, 'suspended'::text])));
alter table public."profiles" add constraint "profiles_pkey" PRIMARY KEY (id);
alter table public."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['publisher'::text, 'editor'::text, 'admin'::text])));
alter table public."profiles" add constraint "profiles_user_type_check" CHECK ((user_type = ANY (ARRAY['advisor'::text, 'owner'::text])));
alter table public."properties" add constraint "properties_location_visibility_check" CHECK ((location_visibility = ANY (ARRAY['zone'::text, 'address'::text])));
alter table public."properties" add constraint "properties_operation_check" CHECK ((operation = ANY (ARRAY['Renta'::text, 'Venta'::text])));
alter table public."properties" add constraint "properties_pkey" PRIMARY KEY (id);
alter table public."properties" add constraint "properties_slug_key" UNIQUE (slug);
alter table public."property_contact_authorizations" add constraint "property_contact_authorizations_pkey" PRIMARY KEY (id);
alter table public."property_contact_authorizations" add constraint "property_contact_authorizations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'authorized'::text, 'declined'::text])));
alter table public."property_contacts" add constraint "property_contacts_pkey" PRIMARY KEY (id);
alter table public."property_images" add constraint "property_images_pkey" PRIMARY KEY (id);
alter table public."property_interest_requests" add constraint "property_interest_requests_demand_request_id_property_id_key" UNIQUE (demand_request_id, property_id);
alter table public."property_interest_requests" add constraint "property_interest_requests_pkey" PRIMARY KEY (id);
alter table public."property_interest_requests" add constraint "property_interest_requests_status_check" CHECK ((status = ANY (ARRAY['interested'::text, 'contact_authorized'::text, 'contact_shared'::text, 'visit'::text, 'negotiation'::text, 'closed'::text, 'cancelled'::text])));
alter table public."property_views" add constraint "property_views_pkey" PRIMARY KEY (id);
alter table public."audit_logs" add constraint "audit_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id);
alter table public."demand_requests" add constraint "demand_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public."home_pool" add constraint "home_pool_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
alter table public."notifications" add constraint "notifications_demand_request_id_fkey" FOREIGN KEY (demand_request_id) REFERENCES demand_requests(id) ON DELETE CASCADE;
alter table public."notifications" add constraint "notifications_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
alter table public."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."opportunity_property_registrations" add constraint "opportunity_property_registrations_demand_request_id_fkey" FOREIGN KEY (demand_request_id) REFERENCES demand_requests(id) ON DELETE CASCADE;
alter table public."opportunity_property_registrations" add constraint "opportunity_property_registrations_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
alter table public."opportunity_property_registrations" add constraint "opportunity_property_registrations_registered_by_fkey" FOREIGN KEY (registered_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."platform_settings" add constraint "platform_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."profiles" add constraint "profiles_suspended_by_fkey" FOREIGN KEY (suspended_by) REFERENCES profiles(id);
alter table public."properties" add constraint "properties_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id);
alter table public."property_contact_authorizations" add constraint "property_contact_authorizations_advisor_id_fkey" FOREIGN KEY (advisor_id) REFERENCES auth.users(id);
alter table public."property_contact_authorizations" add constraint "property_contact_authorizations_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES property_contacts(id);
alter table public."property_contact_authorizations" add constraint "property_contact_authorizations_demand_request_id_fkey" FOREIGN KEY (demand_request_id) REFERENCES demand_requests(id) ON DELETE SET NULL;
alter table public."property_contact_authorizations" add constraint "property_contact_authorizations_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
alter table public."property_contacts" add constraint "property_contacts_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id);
alter table public."property_images" add constraint "property_images_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
alter table public."property_interest_requests" add constraint "property_interest_requests_demand_request_id_fkey" FOREIGN KEY (demand_request_id) REFERENCES demand_requests(id) ON DELETE CASCADE;
alter table public."property_interest_requests" add constraint "property_interest_requests_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
alter table public."property_interest_requests" add constraint "property_interest_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."property_views" add constraint "property_views_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs USING btree (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON public.audit_logs USING btree (actor_id, created_at DESC);
CREATE UNIQUE INDEX profiles_public_id_unique ON public.profiles USING btree (public_id);
CREATE OR REPLACE FUNCTION public.get_auto_approve_contact_requests(p_owner_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (
      select auto_approve_contact_requests
      from public.profiles
      where id = p_owner_id
    ),
    false
  );
$function$;
CREATE OR REPLACE FUNCTION public.respond_property_contact_authorization(p_authorization_id uuid, p_status text)
 RETURNS TABLE(status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_authorization record;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_status = 'active'
  ) then
    raise exception 'Tu cuenta está suspendida y no puede responder solicitudes.';
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
CREATE OR REPLACE FUNCTION public.notify_property_contact_request(p_property_id uuid, p_contact_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
CREATE OR REPLACE FUNCTION public.notify_opportunity_property_registered(p_demand_request_id uuid, p_property_id uuid, p_registered_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_property_title text;
begin
  if p_registered_by <> auth.uid() then
    raise exception 'Usuario no autorizado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_status = 'active'
  ) then
    raise exception 'Tu cuenta está suspendida y no puede registrar oportunidades.';
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
CREATE OR REPLACE FUNCTION public.replace_property_images(p_property_id uuid, p_images jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_image jsonb;
  v_position integer := 0;
  v_path text;
  v_title text;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_status = 'active'
  ) then
    raise exception 'Tu cuenta está suspendida y no puede modificar fotografías.';
  end if;

  if jsonb_typeof(p_images) <> 'array'
    or jsonb_array_length(p_images) < 1
    or jsonb_array_length(p_images) > 7 then
    raise exception 'Debes registrar entre 1 y 7 fotografías.';
  end if;

  if not exists (
    select 1
    from public.properties
    where id = p_property_id
      and owner_id = auth.uid()
  ) then
    raise exception 'No tienes permiso para actualizar estas fotografías.';
  end if;

  delete from public.property_images
  where property_id = p_property_id;

  for v_image in select value from jsonb_array_elements(p_images)
  loop
    v_path := v_image->>'storage_path';
    v_title := left(trim(coalesce(v_image->>'title', '')), 120);

    if v_path is null
      or v_path !~ ('^' || auth.uid()::text || '/.+\.webp$') then
      raise exception 'La ruta de la fotografía no es válida.';
    end if;

    insert into public.property_images (
      property_id,
      storage_path,
      category,
      position,
      title
    ) values (
      p_property_id,
      v_path,
      case when v_position = 0 then 'main' else 'gallery' end,
      v_position,
      nullif(v_title, '')
    );

    v_position := v_position + 1;
  end loop;
end;
$function$;
CREATE OR REPLACE FUNCTION public.notify_property_published(p_property_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
CREATE OR REPLACE FUNCTION public.protect_profile_identity_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null
     and (
       new.full_name is distinct from old.full_name
       or new.company_name is distinct from old.company_name
     )
  then
    if old.identity_change_locked_until is not null
       and old.identity_change_locked_until > now()
    then
      raise exception 'El nombre y la empresa están bloqueados hasta %.',
        to_char(
          old.identity_change_locked_until at time zone 'America/Mexico_City',
          'DD/MM/YYYY'
        );
    end if;

    new.identity_last_changed_at := now();
    new.identity_change_locked_until := now() + interval '30 days';
  end if;

  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.admin_set_profile_verified(target_profile_id uuid, verified boolean)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
CREATE OR REPLACE FUNCTION public.get_advisor_catalog(advisor_public_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'public_id', p.public_id,
    'name', p.full_name,
    'company', p.company_name,
    'website', p.website,
    'phone', p.phone,
    'whatsapp', p.whatsapp,
    'avatar_url', p.avatar_url,
    'instagram_url', p.instagram_url,
    'facebook_url', p.facebook_url,
    'linkedin_url', p.linkedin_url,
    'is_verified', p.is_verified,
    'properties', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', pr.id,
            'slug', pr.slug,
            'title', pr.title,
            'operation', pr.operation,
            'zone', pr.zone,
            'price_display', pr.price_display,
            'total_area', pr.total_area,
            'covered_area', pr.covered_area,
            'max_height', pr.max_height,
            'share_commission', pr.share_commission,
            'main_image', pr.main_image
          )
          order by pr.created_at desc
        )
        from public.properties pr
        where pr.owner_id = p.id
          and pr.status = 'published'
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.profiles p
  where p.public_id = advisor_public_id
    and p.role = 'publisher'
    and p.account_status = 'active'
    and p.publications_enabled = true;

  return result;
end;
$function$;
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$function$;
CREATE OR REPLACE FUNCTION public.prevent_self_profile_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
       or new.publications_enabled is distinct from old.publications_enabled
     )
  then
    raise exception 'No tienes permiso para cambiar los campos administrados de tu perfil.';
  end if;

  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.get_property_publisher_contact(p_property_id uuid)
 RETURNS TABLE(name text, phone text, company text, email text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    and p.account_status = 'active'
    and p.publications_enabled = true
    and pr.owner_id <> auth.uid()
    and exists (
      select 1
      from public.property_contact_authorizations contact_authorization
      where contact_authorization.property_id = pr.id
        and contact_authorization.advisor_id = auth.uid()
        and contact_authorization.status = 'authorized'
    );
$function$;
CREATE OR REPLACE FUNCTION public.audit_property_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.audit_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    metadata
  )
  values (
    new.owner_id,
    'property',
    new.id,
    'property_created',
    jsonb_build_object(
      'status', new.status::text,
      'title', new.title,
      'operation', new.operation
    )
  );

  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.audit_property_resubmission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  changed_fields jsonb := '[]'::jsonb;
begin
  if old.status::text in ('draft', 'rejected')
    and new.status::text = 'pending' then

    if old.title is distinct from new.title then
      changed_fields := changed_fields || '["title"]'::jsonb;
    end if;

    if old.operation is distinct from new.operation then
      changed_fields := changed_fields || '["operation"]'::jsonb;
    end if;

    if old.price_display is distinct from new.price_display then
      changed_fields := changed_fields || '["price_display"]'::jsonb;
    end if;

    if old.price_plus_vat is distinct from new.price_plus_vat then
      changed_fields := changed_fields || '["price_plus_vat"]'::jsonb;
    end if;

    if old.price_plus_maintenance is distinct from new.price_plus_maintenance then
      changed_fields := changed_fields || '["price_plus_maintenance"]'::jsonb;
    end if;

    if old.negotiable is distinct from new.negotiable then
      changed_fields := changed_fields || '["negotiable"]'::jsonb;
    end if;

    if old.zone_general is distinct from new.zone_general then
      changed_fields := changed_fields || '["zone_general"]'::jsonb;
    end if;

    if old.zone is distinct from new.zone then
      changed_fields := changed_fields || '["zone"]'::jsonb;
    end if;

    if old.location_visibility is distinct from new.location_visibility then
      changed_fields := changed_fields || '["location_visibility"]'::jsonb;
    end if;

    if old.address is distinct from new.address then
      changed_fields := changed_fields || '["address"]'::jsonb;
    end if;

    if old.total_area is distinct from new.total_area then
      changed_fields := changed_fields || '["total_area"]'::jsonb;
    end if;

    if old.covered_area is distinct from new.covered_area then
      changed_fields := changed_fields || '["covered_area"]'::jsonb;
    end if;

    if old.exterior_area is distinct from new.exterior_area then
      changed_fields := changed_fields || '["exterior_area"]'::jsonb;
    end if;

    if old.max_height is distinct from new.max_height then
      changed_fields := changed_fields || '["max_height"]'::jsonb;
    end if;

    if old.offices_area is distinct from new.offices_area then
      changed_fields := changed_fields || '["offices_area"]'::jsonb;
    end if;

    if old.parking is distinct from new.parking then
      changed_fields := changed_fields || '["parking"]'::jsonb;
    end if;

    if old.docks is distinct from new.docks then
      changed_fields := changed_fields || '["docks"]'::jsonb;
    end if;

    if old.description is distinct from new.description then
      changed_fields := changed_fields || '["description"]'::jsonb;
    end if;

    if old.share_commission is distinct from new.share_commission then
      changed_fields := changed_fields || '["share_commission"]'::jsonb;
    end if;

    if old.main_image is distinct from new.main_image then
      changed_fields := changed_fields || '["main_image"]'::jsonb;
    end if;

    insert into public.audit_logs (
      actor_id,
      entity_type,
      entity_id,
      action,
      metadata
    )
    values (
      new.owner_id,
      'property',
      new.id,
      'property_updated',
      jsonb_build_object(
        'previous_status', old.status::text,
        'status', new.status::text,
        'changed_fields', changed_fields
      )
    );
  end if;

  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.notify_property_rejected(p_property_id uuid, p_rejection_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
CREATE OR REPLACE FUNCTION public.admin_set_profile_account_status(target_profile_id uuid, next_status text, reason text DEFAULT NULL::text)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
CREATE TRIGGER prevent_self_profile_role_change BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_self_profile_role_change();
CREATE TRIGGER protect_profile_identity_changes BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_identity_changes();
CREATE TRIGGER audit_property_created_trigger AFTER INSERT ON public.properties FOR EACH ROW EXECUTE FUNCTION audit_property_created();
CREATE TRIGGER audit_property_resubmission_trigger AFTER UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION audit_property_resubmission();
alter table public."audit_logs" enable row level security;
alter table public."demand_requests" enable row level security;
alter table public."home_pool" enable row level security;
alter table public."notifications" enable row level security;
alter table public."opportunity_property_registrations" enable row level security;
alter table public."platform_settings" enable row level security;
alter table public."profiles" enable row level security;
alter table public."properties" enable row level security;
alter table public."property_contact_authorizations" enable row level security;
alter table public."property_contacts" enable row level security;
alter table public."property_images" enable row level security;
alter table public."property_interest_requests" enable row level security;
alter table public."property_views" enable row level security;
create policy "anyone can submit demand" on "public"."demand_requests" as PERMISSIVE for INSERT to PUBLIC with check (true);
create policy "users read own profile" on "public"."profiles" as PERMISSIVE for SELECT to PUBLIC using ((auth.uid() = id));
create policy "owners upload images" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "owners read own properties" on "public"."properties" as PERMISSIVE for SELECT to "authenticated" using ((auth.uid() = owner_id));
create policy "admins update properties" on "public"."properties" as PERMISSIVE for UPDATE to "authenticated" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "users can update own notifications" on "public"."notifications" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "admins can read demand requests" on "public"."demand_requests" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "users can read own demand requests" on "public"."demand_requests" as PERMISSIVE for SELECT to "authenticated" using ((user_id = auth.uid()));
create policy "users can read own notifications" on "public"."notifications" as PERMISSIVE for SELECT to "authenticated" using ((user_id = auth.uid()));
create policy "authenticated users can read platform settings" on "public"."platform_settings" as PERMISSIVE for SELECT to "authenticated" using (true);
create policy "admins can insert platform settings" on "public"."platform_settings" as PERMISSIVE for INSERT to "authenticated" with check (current_user_is_admin());
create policy "admins can update platform settings" on "public"."platform_settings" as PERMISSIVE for UPDATE to "authenticated" using (current_user_is_admin()) with check (current_user_is_admin());
create policy "Users can insert their own profile" on "public"."profiles" as PERMISSIVE for INSERT to "authenticated" with check (((id = auth.uid()) AND (role = 'publisher'::text)));
create policy "authenticated users can submit contacts" on "public"."property_contacts" as PERMISSIVE for INSERT to "authenticated" with check ((EXISTS ( SELECT 1
   FROM properties
  WHERE ((properties.id = property_contacts.property_id) AND (properties.status = 'published'::property_status)))));
create policy "admins can insert audit logs" on "public"."audit_logs" as PERMISSIVE for INSERT to "authenticated" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "admins can read audit logs" on "public"."audit_logs" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "users can read own opportunity registrations" on "public"."opportunity_property_registrations" as PERMISSIVE for SELECT to "authenticated" using (((registered_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = opportunity_property_registrations.property_id) AND (p.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM demand_requests d
  WHERE ((d.id = opportunity_property_registrations.demand_request_id) AND (d.user_id = auth.uid()))))));
create policy "Users can update their own profile" on "public"."profiles" as PERMISSIVE for UPDATE to "authenticated" using ((id = auth.uid())) with check ((id = auth.uid()));
create policy "admins can read all properties" on "public"."properties" as PERMISSIVE for SELECT to PUBLIC using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "advisors can read own contact authorizations" on "public"."property_contact_authorizations" as PERMISSIVE for SELECT to "authenticated" using ((advisor_id = auth.uid()));
create policy "authenticated users can request contact" on "public"."property_contact_authorizations" as PERMISSIVE for INSERT to "authenticated" with check (((advisor_id = auth.uid()) AND ((status = 'pending'::text) OR ((status = 'authorized'::text) AND (EXISTS ( SELECT 1
   FROM properties
  WHERE ((properties.id = property_contact_authorizations.property_id) AND (get_auto_approve_contact_requests(properties.owner_id) = true))))))));
create policy "owners can read contact authorizations for own properties" on "public"."property_contact_authorizations" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM properties
  WHERE ((properties.id = property_contact_authorizations.property_id) AND (properties.owner_id = auth.uid())))));
create policy "owners can read contacts for own properties" on "public"."property_contacts" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM properties
  WHERE ((properties.id = property_contacts.property_id) AND (properties.owner_id = auth.uid())))));
create policy "users can create property interests" on "public"."property_interest_requests" as PERMISSIVE for INSERT to "authenticated" with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM demand_requests d
  WHERE ((d.id = property_interest_requests.demand_request_id) AND (d.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_interest_requests.property_id) AND (p.status = 'published'::property_status))))));
create policy "users can read own property interests" on "public"."property_interest_requests" as PERMISSIVE for SELECT to "authenticated" using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_interest_requests.property_id) AND (p.owner_id = auth.uid()))))));
create policy "owners can read views for own properties" on "public"."property_views" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM properties
  WHERE ((properties.id = property_views.property_id) AND (properties.owner_id = auth.uid())))));
create policy "public can register property views" on "public"."property_views" as PERMISSIVE for INSERT to PUBLIC with check (true);
create policy "admins read all property images" on "public"."property_images" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "users upload own profile image" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "users update own profile image" on "storage"."objects" as PERMISSIVE for UPDATE to "authenticated" using (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) with check (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "users delete own profile image" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "admins can read all profiles" on "public"."profiles" as PERMISSIVE for SELECT to "authenticated" using (current_user_is_admin());
create policy "public sees published properties" on "public"."properties" as PERMISSIVE for SELECT to PUBLIC using (((status = 'published'::property_status) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = properties.owner_id) AND (profiles.account_status = 'active'::text) AND (profiles.publications_enabled = true))))));
create policy "public reads images of published properties" on "public"."property_images" as PERMISSIVE for SELECT to PUBLIC using ((EXISTS ( SELECT 1
   FROM (properties
     JOIN profiles ON ((profiles.id = properties.owner_id)))
  WHERE ((properties.id = property_images.property_id) AND (properties.status = 'published'::property_status) AND (profiles.account_status = 'active'::text) AND (profiles.publications_enabled = true)))));
create policy "owners delete own properties" on "public"."properties" as PERMISSIVE for DELETE to "authenticated" using (((auth.uid() = owner_id) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_status = 'active'::text))))));
create policy "owners manage images of own properties" on "public"."property_images" as PERMISSIVE for ALL to "authenticated" using ((EXISTS ( SELECT 1
   FROM (properties
     JOIN profiles ON ((profiles.id = properties.owner_id)))
  WHERE ((properties.id = property_images.property_id) AND (properties.owner_id = auth.uid()) AND (profiles.account_status = 'active'::text))))) with check ((EXISTS ( SELECT 1
   FROM (properties
     JOIN profiles ON ((profiles.id = properties.owner_id)))
  WHERE ((properties.id = property_images.property_id) AND (properties.owner_id = auth.uid()) AND (profiles.account_status = 'active'::text)))));
create policy "owners read images of own properties" on "public"."property_images" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM (properties
     JOIN profiles ON ((profiles.id = properties.owner_id)))
  WHERE ((properties.id = property_images.property_id) AND (properties.owner_id = auth.uid())))));
create policy "owners upload optimized property images" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text) AND (storage.extension(name) = 'webp'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_status = 'active'::text))))));
create policy "users can create opportunity registrations" on "public"."opportunity_property_registrations" as PERMISSIVE for INSERT to "authenticated" with check (((registered_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_status = 'active'::text)))) AND (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = opportunity_property_registrations.property_id) AND (p.owner_id = auth.uid()) AND (p.status = 'published'::property_status))))));
create policy "owners can delete contacts for own properties" on "public"."property_contacts" as PERMISSIVE for DELETE to "authenticated" using ((EXISTS ( SELECT 1
   FROM (properties
     JOIN profiles ON ((profiles.id = properties.owner_id)))
  WHERE ((properties.id = property_contacts.property_id) AND (properties.owner_id = auth.uid()) AND (profiles.account_status = 'active'::text)))));
create policy "owners delete own property images" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_status = 'active'::text))))));
create policy "owners create own properties" on "public"."properties" as PERMISSIVE for INSERT to "authenticated" with check (((auth.uid() = owner_id) AND (status = ANY (ARRAY['draft'::property_status, 'pending'::property_status])) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_status = 'active'::text))))));
create policy "owners can edit draft or rejected properties" on "public"."properties" as PERMISSIVE for UPDATE to PUBLIC using (((auth.uid() = owner_id) AND (status = ANY (ARRAY['draft'::property_status, 'rejected'::property_status])) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_status = 'active'::text)))))) with check (((auth.uid() = owner_id) AND (status = ANY (ARRAY['draft'::property_status, 'pending'::property_status])) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_status = 'active'::text))))));
revoke all on all tables in schema public from PUBLIC, anon, authenticated, service_role;
revoke all on all sequences in schema public from PUBLIC, anon, authenticated, service_role;
revoke all on all functions in schema public from PUBLIC, anon, authenticated, service_role;
grant INSERT on table public."profiles" to "anon";
grant SELECT on table public."profiles" to "anon";
grant UPDATE on table public."profiles" to "anon";
grant DELETE on table public."profiles" to "anon";
grant TRUNCATE on table public."profiles" to "anon";
grant REFERENCES on table public."profiles" to "anon";
grant TRIGGER on table public."profiles" to "anon";
grant MAINTAIN on table public."profiles" to "anon";
grant INSERT on table public."profiles" to "authenticated";
grant SELECT on table public."profiles" to "authenticated";
grant UPDATE on table public."profiles" to "authenticated";
grant DELETE on table public."profiles" to "authenticated";
grant TRUNCATE on table public."profiles" to "authenticated";
grant REFERENCES on table public."profiles" to "authenticated";
grant TRIGGER on table public."profiles" to "authenticated";
grant MAINTAIN on table public."profiles" to "authenticated";
grant INSERT on table public."profiles" to "service_role";
grant SELECT on table public."profiles" to "service_role";
grant UPDATE on table public."profiles" to "service_role";
grant DELETE on table public."profiles" to "service_role";
grant TRUNCATE on table public."profiles" to "service_role";
grant REFERENCES on table public."profiles" to "service_role";
grant TRIGGER on table public."profiles" to "service_role";
grant MAINTAIN on table public."profiles" to "service_role";
grant INSERT on table public."properties" to "anon";
grant SELECT on table public."properties" to "anon";
grant UPDATE on table public."properties" to "anon";
grant DELETE on table public."properties" to "anon";
grant TRUNCATE on table public."properties" to "anon";
grant REFERENCES on table public."properties" to "anon";
grant TRIGGER on table public."properties" to "anon";
grant MAINTAIN on table public."properties" to "anon";
grant INSERT on table public."properties" to "authenticated";
grant SELECT on table public."properties" to "authenticated";
grant UPDATE on table public."properties" to "authenticated";
grant DELETE on table public."properties" to "authenticated";
grant TRUNCATE on table public."properties" to "authenticated";
grant REFERENCES on table public."properties" to "authenticated";
grant TRIGGER on table public."properties" to "authenticated";
grant MAINTAIN on table public."properties" to "authenticated";
grant INSERT on table public."properties" to "service_role";
grant SELECT on table public."properties" to "service_role";
grant UPDATE on table public."properties" to "service_role";
grant DELETE on table public."properties" to "service_role";
grant TRUNCATE on table public."properties" to "service_role";
grant REFERENCES on table public."properties" to "service_role";
grant TRIGGER on table public."properties" to "service_role";
grant MAINTAIN on table public."properties" to "service_role";
grant SELECT on sequence public."audit_logs_id_seq" to "anon";
grant UPDATE on sequence public."audit_logs_id_seq" to "anon";
grant USAGE on sequence public."audit_logs_id_seq" to "anon";
grant SELECT on sequence public."audit_logs_id_seq" to "authenticated";
grant UPDATE on sequence public."audit_logs_id_seq" to "authenticated";
grant USAGE on sequence public."audit_logs_id_seq" to "authenticated";
grant SELECT on sequence public."audit_logs_id_seq" to "service_role";
grant UPDATE on sequence public."audit_logs_id_seq" to "service_role";
grant USAGE on sequence public."audit_logs_id_seq" to "service_role";
grant INSERT on table public."property_images" to "anon";
grant SELECT on table public."property_images" to "anon";
grant UPDATE on table public."property_images" to "anon";
grant DELETE on table public."property_images" to "anon";
grant TRUNCATE on table public."property_images" to "anon";
grant REFERENCES on table public."property_images" to "anon";
grant TRIGGER on table public."property_images" to "anon";
grant MAINTAIN on table public."property_images" to "anon";
grant INSERT on table public."property_images" to "authenticated";
grant SELECT on table public."property_images" to "authenticated";
grant UPDATE on table public."property_images" to "authenticated";
grant DELETE on table public."property_images" to "authenticated";
grant TRUNCATE on table public."property_images" to "authenticated";
grant REFERENCES on table public."property_images" to "authenticated";
grant TRIGGER on table public."property_images" to "authenticated";
grant MAINTAIN on table public."property_images" to "authenticated";
grant INSERT on table public."property_images" to "service_role";
grant SELECT on table public."property_images" to "service_role";
grant UPDATE on table public."property_images" to "service_role";
grant DELETE on table public."property_images" to "service_role";
grant TRUNCATE on table public."property_images" to "service_role";
grant REFERENCES on table public."property_images" to "service_role";
grant TRIGGER on table public."property_images" to "service_role";
grant MAINTAIN on table public."property_images" to "service_role";
grant INSERT on table public."property_contacts" to "anon";
grant SELECT on table public."property_contacts" to "anon";
grant UPDATE on table public."property_contacts" to "anon";
grant DELETE on table public."property_contacts" to "anon";
grant TRUNCATE on table public."property_contacts" to "anon";
grant REFERENCES on table public."property_contacts" to "anon";
grant TRIGGER on table public."property_contacts" to "anon";
grant MAINTAIN on table public."property_contacts" to "anon";
grant INSERT on table public."property_contacts" to "authenticated";
grant SELECT on table public."property_contacts" to "authenticated";
grant UPDATE on table public."property_contacts" to "authenticated";
grant DELETE on table public."property_contacts" to "authenticated";
grant TRUNCATE on table public."property_contacts" to "authenticated";
grant REFERENCES on table public."property_contacts" to "authenticated";
grant TRIGGER on table public."property_contacts" to "authenticated";
grant MAINTAIN on table public."property_contacts" to "authenticated";
grant INSERT on table public."property_contacts" to "service_role";
grant SELECT on table public."property_contacts" to "service_role";
grant UPDATE on table public."property_contacts" to "service_role";
grant DELETE on table public."property_contacts" to "service_role";
grant TRUNCATE on table public."property_contacts" to "service_role";
grant REFERENCES on table public."property_contacts" to "service_role";
grant TRIGGER on table public."property_contacts" to "service_role";
grant MAINTAIN on table public."property_contacts" to "service_role";
grant INSERT on table public."home_pool" to "anon";
grant SELECT on table public."home_pool" to "anon";
grant UPDATE on table public."home_pool" to "anon";
grant DELETE on table public."home_pool" to "anon";
grant TRUNCATE on table public."home_pool" to "anon";
grant REFERENCES on table public."home_pool" to "anon";
grant TRIGGER on table public."home_pool" to "anon";
grant MAINTAIN on table public."home_pool" to "anon";
grant INSERT on table public."home_pool" to "authenticated";
grant SELECT on table public."home_pool" to "authenticated";
grant UPDATE on table public."home_pool" to "authenticated";
grant DELETE on table public."home_pool" to "authenticated";
grant TRUNCATE on table public."home_pool" to "authenticated";
grant REFERENCES on table public."home_pool" to "authenticated";
grant TRIGGER on table public."home_pool" to "authenticated";
grant MAINTAIN on table public."home_pool" to "authenticated";
grant INSERT on table public."home_pool" to "service_role";
grant SELECT on table public."home_pool" to "service_role";
grant UPDATE on table public."home_pool" to "service_role";
grant DELETE on table public."home_pool" to "service_role";
grant TRUNCATE on table public."home_pool" to "service_role";
grant REFERENCES on table public."home_pool" to "service_role";
grant TRIGGER on table public."home_pool" to "service_role";
grant MAINTAIN on table public."home_pool" to "service_role";
grant INSERT on table public."audit_logs" to "anon";
grant SELECT on table public."audit_logs" to "anon";
grant UPDATE on table public."audit_logs" to "anon";
grant DELETE on table public."audit_logs" to "anon";
grant TRUNCATE on table public."audit_logs" to "anon";
grant REFERENCES on table public."audit_logs" to "anon";
grant TRIGGER on table public."audit_logs" to "anon";
grant MAINTAIN on table public."audit_logs" to "anon";
grant INSERT on table public."audit_logs" to "authenticated";
grant SELECT on table public."audit_logs" to "authenticated";
grant UPDATE on table public."audit_logs" to "authenticated";
grant DELETE on table public."audit_logs" to "authenticated";
grant TRUNCATE on table public."audit_logs" to "authenticated";
grant REFERENCES on table public."audit_logs" to "authenticated";
grant TRIGGER on table public."audit_logs" to "authenticated";
grant MAINTAIN on table public."audit_logs" to "authenticated";
grant INSERT on table public."audit_logs" to "service_role";
grant SELECT on table public."audit_logs" to "service_role";
grant UPDATE on table public."audit_logs" to "service_role";
grant DELETE on table public."audit_logs" to "service_role";
grant TRUNCATE on table public."audit_logs" to "service_role";
grant REFERENCES on table public."audit_logs" to "service_role";
grant TRIGGER on table public."audit_logs" to "service_role";
grant MAINTAIN on table public."audit_logs" to "service_role";
grant INSERT on table public."property_views" to "anon";
grant SELECT on table public."property_views" to "anon";
grant UPDATE on table public."property_views" to "anon";
grant DELETE on table public."property_views" to "anon";
grant TRUNCATE on table public."property_views" to "anon";
grant REFERENCES on table public."property_views" to "anon";
grant TRIGGER on table public."property_views" to "anon";
grant MAINTAIN on table public."property_views" to "anon";
grant INSERT on table public."property_views" to "authenticated";
grant SELECT on table public."property_views" to "authenticated";
grant UPDATE on table public."property_views" to "authenticated";
grant DELETE on table public."property_views" to "authenticated";
grant TRUNCATE on table public."property_views" to "authenticated";
grant REFERENCES on table public."property_views" to "authenticated";
grant TRIGGER on table public."property_views" to "authenticated";
grant MAINTAIN on table public."property_views" to "authenticated";
grant INSERT on table public."property_views" to "service_role";
grant SELECT on table public."property_views" to "service_role";
grant UPDATE on table public."property_views" to "service_role";
grant DELETE on table public."property_views" to "service_role";
grant TRUNCATE on table public."property_views" to "service_role";
grant REFERENCES on table public."property_views" to "service_role";
grant TRIGGER on table public."property_views" to "service_role";
grant MAINTAIN on table public."property_views" to "service_role";
grant INSERT on table public."opportunity_property_registrations" to "anon";
grant SELECT on table public."opportunity_property_registrations" to "anon";
grant UPDATE on table public."opportunity_property_registrations" to "anon";
grant DELETE on table public."opportunity_property_registrations" to "anon";
grant TRUNCATE on table public."opportunity_property_registrations" to "anon";
grant REFERENCES on table public."opportunity_property_registrations" to "anon";
grant TRIGGER on table public."opportunity_property_registrations" to "anon";
grant MAINTAIN on table public."opportunity_property_registrations" to "anon";
grant INSERT on table public."opportunity_property_registrations" to "authenticated";
grant SELECT on table public."opportunity_property_registrations" to "authenticated";
grant UPDATE on table public."opportunity_property_registrations" to "authenticated";
grant DELETE on table public."opportunity_property_registrations" to "authenticated";
grant TRUNCATE on table public."opportunity_property_registrations" to "authenticated";
grant REFERENCES on table public."opportunity_property_registrations" to "authenticated";
grant TRIGGER on table public."opportunity_property_registrations" to "authenticated";
grant MAINTAIN on table public."opportunity_property_registrations" to "authenticated";
grant INSERT on table public."opportunity_property_registrations" to "service_role";
grant SELECT on table public."opportunity_property_registrations" to "service_role";
grant UPDATE on table public."opportunity_property_registrations" to "service_role";
grant DELETE on table public."opportunity_property_registrations" to "service_role";
grant TRUNCATE on table public."opportunity_property_registrations" to "service_role";
grant REFERENCES on table public."opportunity_property_registrations" to "service_role";
grant TRIGGER on table public."opportunity_property_registrations" to "service_role";
grant MAINTAIN on table public."opportunity_property_registrations" to "service_role";
grant SELECT on sequence public."profiles_public_id_seq" to "anon";
grant UPDATE on sequence public."profiles_public_id_seq" to "anon";
grant USAGE on sequence public."profiles_public_id_seq" to "anon";
grant SELECT on sequence public."profiles_public_id_seq" to "authenticated";
grant UPDATE on sequence public."profiles_public_id_seq" to "authenticated";
grant USAGE on sequence public."profiles_public_id_seq" to "authenticated";
grant SELECT on sequence public."profiles_public_id_seq" to "service_role";
grant UPDATE on sequence public."profiles_public_id_seq" to "service_role";
grant USAGE on sequence public."profiles_public_id_seq" to "service_role";
grant INSERT on table public."property_contact_authorizations" to "anon";
grant SELECT on table public."property_contact_authorizations" to "anon";
grant UPDATE on table public."property_contact_authorizations" to "anon";
grant DELETE on table public."property_contact_authorizations" to "anon";
grant TRUNCATE on table public."property_contact_authorizations" to "anon";
grant REFERENCES on table public."property_contact_authorizations" to "anon";
grant TRIGGER on table public."property_contact_authorizations" to "anon";
grant MAINTAIN on table public."property_contact_authorizations" to "anon";
grant INSERT on table public."property_contact_authorizations" to "authenticated";
grant SELECT on table public."property_contact_authorizations" to "authenticated";
grant UPDATE on table public."property_contact_authorizations" to "authenticated";
grant DELETE on table public."property_contact_authorizations" to "authenticated";
grant TRUNCATE on table public."property_contact_authorizations" to "authenticated";
grant REFERENCES on table public."property_contact_authorizations" to "authenticated";
grant TRIGGER on table public."property_contact_authorizations" to "authenticated";
grant MAINTAIN on table public."property_contact_authorizations" to "authenticated";
grant INSERT on table public."property_contact_authorizations" to "service_role";
grant SELECT on table public."property_contact_authorizations" to "service_role";
grant UPDATE on table public."property_contact_authorizations" to "service_role";
grant DELETE on table public."property_contact_authorizations" to "service_role";
grant TRUNCATE on table public."property_contact_authorizations" to "service_role";
grant REFERENCES on table public."property_contact_authorizations" to "service_role";
grant TRIGGER on table public."property_contact_authorizations" to "service_role";
grant MAINTAIN on table public."property_contact_authorizations" to "service_role";
grant INSERT on table public."property_interest_requests" to "anon";
grant SELECT on table public."property_interest_requests" to "anon";
grant UPDATE on table public."property_interest_requests" to "anon";
grant DELETE on table public."property_interest_requests" to "anon";
grant TRUNCATE on table public."property_interest_requests" to "anon";
grant REFERENCES on table public."property_interest_requests" to "anon";
grant TRIGGER on table public."property_interest_requests" to "anon";
grant MAINTAIN on table public."property_interest_requests" to "anon";
grant INSERT on table public."property_interest_requests" to "authenticated";
grant SELECT on table public."property_interest_requests" to "authenticated";
grant UPDATE on table public."property_interest_requests" to "authenticated";
grant DELETE on table public."property_interest_requests" to "authenticated";
grant TRUNCATE on table public."property_interest_requests" to "authenticated";
grant REFERENCES on table public."property_interest_requests" to "authenticated";
grant TRIGGER on table public."property_interest_requests" to "authenticated";
grant MAINTAIN on table public."property_interest_requests" to "authenticated";
grant INSERT on table public."property_interest_requests" to "service_role";
grant SELECT on table public."property_interest_requests" to "service_role";
grant UPDATE on table public."property_interest_requests" to "service_role";
grant DELETE on table public."property_interest_requests" to "service_role";
grant TRUNCATE on table public."property_interest_requests" to "service_role";
grant REFERENCES on table public."property_interest_requests" to "service_role";
grant TRIGGER on table public."property_interest_requests" to "service_role";
grant MAINTAIN on table public."property_interest_requests" to "service_role";
grant INSERT on table public."demand_requests" to "anon";
grant SELECT on table public."demand_requests" to "anon";
grant UPDATE on table public."demand_requests" to "anon";
grant DELETE on table public."demand_requests" to "anon";
grant TRUNCATE on table public."demand_requests" to "anon";
grant REFERENCES on table public."demand_requests" to "anon";
grant TRIGGER on table public."demand_requests" to "anon";
grant MAINTAIN on table public."demand_requests" to "anon";
grant INSERT on table public."demand_requests" to "authenticated";
grant SELECT on table public."demand_requests" to "authenticated";
grant UPDATE on table public."demand_requests" to "authenticated";
grant DELETE on table public."demand_requests" to "authenticated";
grant TRUNCATE on table public."demand_requests" to "authenticated";
grant REFERENCES on table public."demand_requests" to "authenticated";
grant TRIGGER on table public."demand_requests" to "authenticated";
grant MAINTAIN on table public."demand_requests" to "authenticated";
grant INSERT on table public."demand_requests" to "service_role";
grant SELECT on table public."demand_requests" to "service_role";
grant UPDATE on table public."demand_requests" to "service_role";
grant DELETE on table public."demand_requests" to "service_role";
grant TRUNCATE on table public."demand_requests" to "service_role";
grant REFERENCES on table public."demand_requests" to "service_role";
grant TRIGGER on table public."demand_requests" to "service_role";
grant MAINTAIN on table public."demand_requests" to "service_role";
grant INSERT on table public."notifications" to "anon";
grant SELECT on table public."notifications" to "anon";
grant UPDATE on table public."notifications" to "anon";
grant DELETE on table public."notifications" to "anon";
grant TRUNCATE on table public."notifications" to "anon";
grant REFERENCES on table public."notifications" to "anon";
grant TRIGGER on table public."notifications" to "anon";
grant MAINTAIN on table public."notifications" to "anon";
grant INSERT on table public."notifications" to "authenticated";
grant SELECT on table public."notifications" to "authenticated";
grant UPDATE on table public."notifications" to "authenticated";
grant DELETE on table public."notifications" to "authenticated";
grant TRUNCATE on table public."notifications" to "authenticated";
grant REFERENCES on table public."notifications" to "authenticated";
grant TRIGGER on table public."notifications" to "authenticated";
grant MAINTAIN on table public."notifications" to "authenticated";
grant INSERT on table public."notifications" to "service_role";
grant SELECT on table public."notifications" to "service_role";
grant UPDATE on table public."notifications" to "service_role";
grant DELETE on table public."notifications" to "service_role";
grant TRUNCATE on table public."notifications" to "service_role";
grant REFERENCES on table public."notifications" to "service_role";
grant TRIGGER on table public."notifications" to "service_role";
grant MAINTAIN on table public."notifications" to "service_role";
grant INSERT on table public."platform_settings" to "anon";
grant SELECT on table public."platform_settings" to "anon";
grant UPDATE on table public."platform_settings" to "anon";
grant DELETE on table public."platform_settings" to "anon";
grant TRUNCATE on table public."platform_settings" to "anon";
grant REFERENCES on table public."platform_settings" to "anon";
grant TRIGGER on table public."platform_settings" to "anon";
grant MAINTAIN on table public."platform_settings" to "anon";
grant INSERT on table public."platform_settings" to "authenticated";
grant SELECT on table public."platform_settings" to "authenticated";
grant UPDATE on table public."platform_settings" to "authenticated";
grant DELETE on table public."platform_settings" to "authenticated";
grant TRUNCATE on table public."platform_settings" to "authenticated";
grant REFERENCES on table public."platform_settings" to "authenticated";
grant TRIGGER on table public."platform_settings" to "authenticated";
grant MAINTAIN on table public."platform_settings" to "authenticated";
grant INSERT on table public."platform_settings" to "service_role";
grant SELECT on table public."platform_settings" to "service_role";
grant UPDATE on table public."platform_settings" to "service_role";
grant DELETE on table public."platform_settings" to "service_role";
grant TRUNCATE on table public."platform_settings" to "service_role";
grant REFERENCES on table public."platform_settings" to "service_role";
grant TRIGGER on table public."platform_settings" to "service_role";
grant MAINTAIN on table public."platform_settings" to "service_role";
grant EXECUTE on function public.get_auto_approve_contact_requests(uuid) to "anon";
grant EXECUTE on function public.get_auto_approve_contact_requests(uuid) to "authenticated";
grant EXECUTE on function public.get_auto_approve_contact_requests(uuid) to "service_role";
grant EXECUTE on function public.respond_property_contact_authorization(uuid,text) to PUBLIC;
grant EXECUTE on function public.respond_property_contact_authorization(uuid,text) to "anon";
grant EXECUTE on function public.respond_property_contact_authorization(uuid,text) to "authenticated";
grant EXECUTE on function public.respond_property_contact_authorization(uuid,text) to "service_role";
grant EXECUTE on function public.notify_property_contact_request(uuid,uuid) to "anon";
grant EXECUTE on function public.notify_property_contact_request(uuid,uuid) to "authenticated";
grant EXECUTE on function public.notify_property_contact_request(uuid,uuid) to "service_role";
grant EXECUTE on function public.notify_opportunity_property_registered(uuid,uuid,uuid) to PUBLIC;
grant EXECUTE on function public.notify_opportunity_property_registered(uuid,uuid,uuid) to "anon";
grant EXECUTE on function public.notify_opportunity_property_registered(uuid,uuid,uuid) to "authenticated";
grant EXECUTE on function public.notify_opportunity_property_registered(uuid,uuid,uuid) to "service_role";
grant EXECUTE on function public.replace_property_images(uuid,jsonb) to "anon";
grant EXECUTE on function public.replace_property_images(uuid,jsonb) to "authenticated";
grant EXECUTE on function public.replace_property_images(uuid,jsonb) to "service_role";
grant EXECUTE on function public.notify_property_published(uuid) to PUBLIC;
grant EXECUTE on function public.notify_property_published(uuid) to "anon";
grant EXECUTE on function public.notify_property_published(uuid) to "authenticated";
grant EXECUTE on function public.notify_property_published(uuid) to "service_role";
grant EXECUTE on function public.protect_profile_identity_changes() to PUBLIC;
grant EXECUTE on function public.protect_profile_identity_changes() to "anon";
grant EXECUTE on function public.protect_profile_identity_changes() to "authenticated";
grant EXECUTE on function public.protect_profile_identity_changes() to "service_role";
grant EXECUTE on function public.admin_set_profile_verified(uuid,boolean) to "anon";
grant EXECUTE on function public.admin_set_profile_verified(uuid,boolean) to "authenticated";
grant EXECUTE on function public.admin_set_profile_verified(uuid,boolean) to "service_role";
grant EXECUTE on function public.get_advisor_catalog(bigint) to PUBLIC;
grant EXECUTE on function public.get_advisor_catalog(bigint) to "anon";
grant EXECUTE on function public.get_advisor_catalog(bigint) to "authenticated";
grant EXECUTE on function public.get_advisor_catalog(bigint) to "service_role";
grant EXECUTE on function public.current_user_is_admin() to "anon";
grant EXECUTE on function public.current_user_is_admin() to "authenticated";
grant EXECUTE on function public.current_user_is_admin() to "service_role";
grant EXECUTE on function public.prevent_self_profile_role_change() to PUBLIC;
grant EXECUTE on function public.prevent_self_profile_role_change() to "anon";
grant EXECUTE on function public.prevent_self_profile_role_change() to "authenticated";
grant EXECUTE on function public.prevent_self_profile_role_change() to "service_role";
grant EXECUTE on function public.get_property_publisher_contact(uuid) to PUBLIC;
grant EXECUTE on function public.get_property_publisher_contact(uuid) to "anon";
grant EXECUTE on function public.get_property_publisher_contact(uuid) to "authenticated";
grant EXECUTE on function public.get_property_publisher_contact(uuid) to "service_role";
grant EXECUTE on function public.audit_property_created() to PUBLIC;
grant EXECUTE on function public.audit_property_created() to "anon";
grant EXECUTE on function public.audit_property_created() to "authenticated";
grant EXECUTE on function public.audit_property_created() to "service_role";
grant EXECUTE on function public.audit_property_resubmission() to PUBLIC;
grant EXECUTE on function public.audit_property_resubmission() to "anon";
grant EXECUTE on function public.audit_property_resubmission() to "authenticated";
grant EXECUTE on function public.audit_property_resubmission() to "service_role";
grant EXECUTE on function public.notify_property_rejected(uuid,text) to PUBLIC;
grant EXECUTE on function public.notify_property_rejected(uuid,text) to "anon";
grant EXECUTE on function public.notify_property_rejected(uuid,text) to "authenticated";
grant EXECUTE on function public.notify_property_rejected(uuid,text) to "service_role";
grant EXECUTE on function public.admin_set_profile_account_status(uuid,text,text) to "anon";
grant EXECUTE on function public.admin_set_profile_account_status(uuid,text,text) to "authenticated";
grant EXECUTE on function public.admin_set_profile_account_status(uuid,text,text) to "service_role";
commit;

