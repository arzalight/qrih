begin;

create or replace function public.audit_property_resubmission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists audit_property_resubmission_trigger
on public.properties;

create trigger audit_property_resubmission_trigger
after update on public.properties
for each row
execute function public.audit_property_resubmission();

commit;
