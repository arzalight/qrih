-- LOCAL/ISOLATED ONLY. Requires052 and Sprint3 private owners. Old RPCs unchanged.
begin;
create function public.qrih_save_property_with_private(p_mode text,p_property_id uuid,p_request_id uuid,
  p_expected_updated_at timestamptz,p_changes jsonb,p_images jsonb,p_private jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
  if p_mode='duplicate' then
    if auth.uid() is null or p_request_id is null then raise exception 'Invalid actor.' using errcode='42501';end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text||p_request_id::text,0));
    v_id:=public.qrih_duplicate_property(p_property_id,p_request_id,null,null);
    if v_id is not null then return v_id;end if;
    v_id:=public.qrih_duplicate_property(p_property_id,p_request_id,p_changes,p_images);
  elsif p_mode='update' then
    perform public.qrih_update_property_with_images(p_property_id,p_expected_updated_at,p_changes,p_images);
    v_id:=p_property_id;
  else raise exception 'Invalid save mode.';end if;
  -- Any invalid private association rolls back commercial change, gallery and audit.
  perform public.qrih_set_property_private_details(v_id,p_private);
  return v_id;
end $$;
revoke all on function public.qrih_save_property_with_private(text,uuid,uuid,timestamptz,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.qrih_save_property_with_private(text,uuid,uuid,timestamptz,jsonb,jsonb,jsonb) to authenticated;

create function public.qrih_create_property_with_private(p_id uuid,p_changes jsonb,p_images jsonb,p_private jsonb,
  p_status text,p_consents boolean)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v public.properties;v_existing uuid;
begin
  if auth.uid() is null or not public.qrih_actor_is_active() or p_id is null or p_consents is distinct from true
    or p_status is null or p_status not in ('draft','pending') then raise exception 'Invalid actor or consent.' using errcode='42501';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('qrih-create:'||auth.uid()::text||p_id::text,0));
  select id into v_existing from public.properties where id=p_id and owner_id=auth.uid();
  if found then return v_existing;end if;
  if p_changes is null or jsonb_typeof(p_changes)<>'object' or exists(select 1 from jsonb_object_keys(p_changes) k where k not in (
    'title','slug','operation','price_display','price_value','price_currency','price_unit','price_plus_vat','price_plus_maintenance','negotiable',
    'zone_general','zone','address','location_visibility','total_area','covered_area','exterior_area','offices_area','parking','docks','max_height','description','share_commission')) then
    raise exception 'Invalid commercial fields.';end if;
  v:=jsonb_populate_record(null::public.properties,p_changes);
  if v.price_value is null or v.price_value<=0 or v.price_value>1e12 or v.price_currency is null or v.price_currency not in ('MXN','USD')
    or v.operation is null or v.operation not in ('Renta','Venta') or v.total_area is null or v.total_area<=0
    or nullif(btrim(v.title),'') is null or nullif(btrim(v.zone_general),'') is null or nullif(btrim(v.zone),'') is null
    or length(v.slug) not between 1 and 300 or v.slug is null then raise exception 'Invalid property.';end if;
  if p_images is null or jsonb_typeof(p_images)<>'array' or jsonb_array_length(p_images) not between 0 and 7
    or (p_status='pending' and jsonb_array_length(p_images)=0) then raise exception 'Invalid gallery.';end if;
  insert into public.properties(id,owner_id,title,slug,operation,status,zone_general,zone,address,location_visibility,
    price_display,price_value,price_currency,price_unit,price_plus_vat,price_plus_maintenance,negotiable,
    total_area,covered_area,exterior_area,offices_area,parking,docks,max_height,description,share_commission,
    publication_authorized_at,terms_accepted_at)
    values(p_id,auth.uid(),v.title,v.slug,v.operation,'draft',v.zone_general,v.zone,v.address,v.location_visibility,
    v.price_display,v.price_value,v.price_currency,v.price_unit,coalesce(v.price_plus_vat,false),coalesce(v.price_plus_maintenance,false),coalesce(v.negotiable,false),
    v.total_area,v.covered_area,v.exterior_area,v.offices_area,v.parking,v.docks,v.max_height,v.description,coalesce(v.share_commission,false),
    case when p_status='pending' then clock_timestamp() end,case when p_status='pending' then clock_timestamp() end);
  if jsonb_array_length(p_images)>0 then
    perform public.replace_property_images(p_id,p_images);
    update public.properties set main_image_path=p_images->0->>'storage_path' where id=p_id;
  end if;
  perform public.qrih_set_property_private_details(p_id,p_private);
  if p_status='pending' then update public.properties set status='pending' where id=p_id;end if;
  return p_id;
end $$;
revoke all on function public.qrih_create_property_with_private(uuid,jsonb,jsonb,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.qrih_create_property_with_private(uuid,jsonb,jsonb,jsonb,text,boolean) to authenticated;

create function public.qrih_private_property_ready() returns boolean language sql stable security invoker set search_path='' as $$
  select auth.uid() is not null and public.qrih_actor_is_active();
$$;
revoke all on function public.qrih_private_property_ready() from public,anon,authenticated;
grant execute on function public.qrih_private_property_ready() to authenticated;
commit;
