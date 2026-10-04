begin;

create or replace function public.get_advisor_catalog(advisor_public_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
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

commit;
