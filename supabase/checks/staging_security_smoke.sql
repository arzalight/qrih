-- Exclusivo para staging mcyxunymhuxyiwklyfpy vacío; ejecutar después de 049.
-- Prueba políticas/RPC con contextos SQL que simulan claims del proveedor.
-- No verifica emisión de JWT, cookies, Auth HTTP, bytes/URLs de Storage ni Netlify.
-- Datos sintéticos dentro de una transacción que termina en ROLLBACK.
-- Secuencias pueden avanzar aunque las filas se reviertan.
begin;
do $$ begin
  if exists(select 1 from auth.users) or exists(select 1 from public.properties) then
    raise exception 'Esta prueba requiere staging sin cuentas ni propiedades';
  end if;
end $$;
create temporary table qrih_smoke_results(case_name text,passed boolean) on commit drop;
create temporary table qrih_smoke_contact(result jsonb) on commit drop;
grant select,insert on qrih_smoke_results,qrih_smoke_contact to anon,authenticated;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333');
insert into public.profiles(id,full_name,role,phone) values
 ('11111111-1111-4111-8111-111111111111','Synthetic Owner A','publisher','1111111111'),
 ('22222222-2222-4222-8222-222222222222','Synthetic Owner B','publisher','2222222222'),
 ('33333333-3333-4333-8333-333333333333','Synthetic Admin','admin','3333333333');
insert into public.properties(id,owner_id,slug,title,operation,status,zone,price_display,address) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','synthetic-a','Synthetic A','Renta','draft','Synthetic zone','100','PRIVATE SYNTHETIC ADDRESS A'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','synthetic-b','Synthetic B','Renta','published','Synthetic zone','100','PRIVATE SYNTHETIC ADDRESS B');
insert into public.qrih_verified_uploads(bucket_id,storage_path,owner_id,mime_type,byte_size,sha256) values
 ('property-images','11111111-1111-4111-8111-111111111111/private.webp','11111111-1111-4111-8111-111111111111','image/webp',100,repeat('a',64));

-- Vista pública filtra todos los estados sin revelar dirección oculta.
do $$ declare v_status public.property_status; v_count integer; begin
  foreach v_status in array enum_range(null::public.property_status) loop
    update public.properties set status=v_status where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    perform set_config('request.jwt.claims','{"role":"anon"}',true);
    perform set_config('request.jwt.claim.sub','',true);
    set local role anon;
    select count(*) into v_count from public.properties_public where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    if v_count<>(case when v_status='published' then 1 else 0 end) then
      raise exception 'Estado público incorrecto: %',v_status;
    end if;
    if exists(select 1 from public.properties_public where address is not null) then
      raise exception 'La vista revela dirección oculta';
    end if;
    insert into qrih_smoke_results values('public state '||v_status,true);
    reset role;
    perform set_config('request.jwt.claims','{}',true);
  end loop;
  update public.properties set status='draft' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
end $$;

set local role anon;
do $$ begin
  if exists(select 1 from public.properties) or exists(select 1 from public.profiles) then
    raise exception 'Anon puede leer tablas privadas';
  end if;
  if public.qrih_verified_object_owner('property-images','11111111-1111-4111-8111-111111111111/private.webp') is not null then
    raise exception 'Anon puede consultar ownership privado';
  end if;
  if has_function_privilege(current_user,'public.qrih_valid_image_reference(uuid,text)','EXECUTE')
    or has_function_privilege(current_user,'public.qrih_moderate_property(uuid,text,text)','EXECUTE')
    or has_function_privilege(current_user,'public.qrih_take_server_limit(text,text)','EXECUTE') then
    raise exception 'Anon conserva RPC privilegiado';
  end if;
  insert into qrih_smoke_results values('anon private tables, ownership and RPC denied',true);
end $$;
reset role;

select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ declare v_denied boolean:=false; begin
  if (select count(*) from public.profiles)<>1 or (select count(*) from public.properties)<>1 then
    raise exception 'El dueño no está aislado de otras cuentas';
  end if;
  begin update public.profiles set role='admin' where id=auth.uid();
  exception when insufficient_privilege or raise_exception then v_denied:=true; end;
  if not v_denied then raise exception 'Escalamiento de rol permitido'; end if;
  v_denied:=false;
  begin update public.properties set status='published' where owner_id=auth.uid();
  exception when insufficient_privilege or raise_exception then v_denied:=true; end;
  if not v_denied then raise exception 'Publicación sin moderación permitida'; end if;
  update public.properties set status='pending' where owner_id=auth.uid();
  insert into qrih_smoke_results values('owner isolation, managed fields and pending submission',true);
end $$;
insert into qrih_smoke_contact select public.qrih_request_property_contact(
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Synthetic Contact','1111111111','synthetic@example.invalid',null,null);
do $$ begin
  if (select result->>'authorization_status' from qrih_smoke_contact)<>'pending'
    or exists(select 1 from public.get_property_publisher_contact('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')) then
    raise exception 'Contacto expuesto antes de autorización';
  end if;
  if (select result from qrih_smoke_contact) is distinct from public.qrih_request_property_contact(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Synthetic Contact','1111111111','synthetic@example.invalid',null,null) then
    raise exception 'Solicitud no idempotente';
  end if;
  insert into qrih_smoke_results values('contact pending, private and idempotent',true);
end $$;
reset role;

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
set local role authenticated;
select public.respond_property_contact_authorization((select (result->>'authorization_id')::uuid from qrih_smoke_contact),'authorized');
do $$ begin
  if public.qrih_verified_object_owner('property-images','11111111-1111-4111-8111-111111111111/private.webp') is not null then
    raise exception 'Asesor ajeno puede consultar ownership privado';
  end if;
  if (select count(*) from public.property_contacts)<>1
    or (select count(*) from public.notifications where type='property_contact_request')<>1 then
    raise exception 'Solicitud/notificación incompletas o duplicadas';
  end if;
  insert into qrih_smoke_results values('owner authorization and atomic notification',true);
end $$;
reset role;

select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.get_property_publisher_contact('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'))<>1 then
    raise exception 'Contacto autorizado no visible';
  end if;
  insert into qrih_smoke_results values('authorized contact visible to requester',true);
end $$;
reset role;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
set local role authenticated;
select public.qrih_moderate_property('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','publish',null);
do $$ begin
  if (select status from public.properties where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>'published'
    or not exists(select 1 from public.audit_logs where action='property_published') then
    raise exception 'Moderación/bitácora incompletas';
  end if;
  insert into qrih_smoke_results values('active admin moderation and audit',true);
end $$;
reset role;
select set_config('request.jwt.claims','{}',true);
select set_config('request.jwt.claim.sub','',true);
update public.profiles set account_status='suspended' where id='11111111-1111-4111-8111-111111111111';
set local role anon;
do $$ begin
  if exists(select 1 from public.properties_public where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Cuenta suspendida visible públicamente';
  end if;
  insert into qrih_smoke_results values('suspended owner hidden from public',true);
end $$;
reset role;
select jsonb_agg(to_jsonb(r) order by case_name) as results from qrih_smoke_results r;
rollback;
