begin;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type = any (
      array[
        'opportunity_property_registered'::text,
        'property_contact_request'::text,
        'property_contact_authorized'::text,
        'property_published'::text,
        'property_rejected'::text
      ]
    )
  );

commit;
