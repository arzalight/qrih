-- Sólo lectura. Ejecutar primero en staging, antes y después del corte.
-- No exportar filas de personas ni secretos; estas consultas son inventarios.
begin transaction read only;
select expected.name, to_regclass('public.'||expected.name) is not null as exists
from unnest(array['profiles','properties','property_images','property_contacts','demand_requests',
  'notifications','property_contact_authorizations','opportunity_property_registrations',
  'property_interest_requests','property_views','audit_logs','platform_settings']) expected(name);
select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns where table_schema='public' and table_name in (
  'profiles','properties','property_images','demand_requests','notifications','property_contact_authorizations',
  'opportunity_property_registrations','property_interest_requests') order by table_name,ordinal_position;
select c.relname,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by c.relname;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies
where schemaname in ('public','storage') order by schemaname,tablename,policyname;
select p.oid::regprocedure as signature,p.prosecdef,p.proconfig,p.proacl
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' order by p.oid::regprocedure::text;
select event_object_table,trigger_name,action_timing,event_manipulation,action_statement
from information_schema.triggers where trigger_schema='public' order by event_object_table,trigger_name;
select conrelid::regclass as table_name,conname,pg_get_constraintdef(oid) as definition
from pg_constraint where connamespace='public'::regnamespace order by conrelid,conname;
select id,public,allowed_mime_types,file_size_limit from storage.buckets where id in ('property-images','profile-images');
select to_regprocedure('storage.allow_any_operation(text[])') is not null as operation_helper_available;
select status,count(*) from public.properties group by status order by status;
select count(*) as gallery_duplicate_groups from (
  select property_id,storage_path from public.property_images group by property_id,storage_path having count(*)>1
) duplicate_groups;
select count(*) as galleries_over_seven from (
  select property_id from public.property_images group by property_id having count(*)>7
) excessive;
select count(*) as duplicate_interests from (
  select demand_request_id,property_id from public.property_interest_requests group by demand_request_id,property_id having count(*)>1
) duplicate_groups;
select count(*) as duplicate_opportunities from (
  select demand_request_id,property_id from public.opportunity_property_registrations group by demand_request_id,property_id having count(*)>1
) duplicate_groups;
rollback;
