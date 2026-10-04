begin;

create or replace function public.audit_property_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists audit_property_created_trigger
on public.properties;

create trigger audit_property_created_trigger
after insert on public.properties
for each row
execute function public.audit_property_created();

commit;
