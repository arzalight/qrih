-- LOCAL/ISOLATED ONLY. No hosted migration authorized. Requires044–052.
begin;
create table public.advisor_owners (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check(length(btrim(name)) between 1 and 160),
  company text check(length(company)<=200),
  phone text check(length(phone)<=40),
  email text check(length(email)<=254 and (email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')),
  notes text check(length(notes)<=3000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index advisor_owners_advisor_created on public.advisor_owners(advisor_id,created_at desc);
create table public.property_private_details (
  property_id uuid primary key references public.properties(id) on delete cascade,
  advisor_id uuid not null references public.profiles(id) on delete restrict,
  internal_name text check(length(internal_name)<=160),
  owner_contact_id uuid references public.advisor_owners(id) on delete restrict,
  updated_at timestamptz not null default now()
);
create index property_private_details_contact on public.property_private_details(owner_contact_id);
create index property_private_details_advisor on public.property_private_details(advisor_id);
alter table public.advisor_owners enable row level security;
alter table public.property_private_details enable row level security;
revoke all on public.advisor_owners,public.property_private_details from public,anon,authenticated;
grant select on public.advisor_owners,public.property_private_details to authenticated;
grant insert(id,advisor_id,name,company,phone,email,notes) on public.advisor_owners to authenticated;
grant update(name,company,phone,email,notes,archived_at) on public.advisor_owners to authenticated;
grant insert(property_id,advisor_id,internal_name,owner_contact_id) on public.property_private_details to authenticated;
grant update(internal_name,owner_contact_id) on public.property_private_details to authenticated;
create policy owners_private_read on public.advisor_owners for select to authenticated
  using ((advisor_id=(select auth.uid()) and public.qrih_actor_is_active()) or public.current_user_is_admin());
create policy owners_private_insert on public.advisor_owners for insert to authenticated
  with check(advisor_id=(select auth.uid()) and public.qrih_actor_is_active());
create policy owners_private_update on public.advisor_owners for update to authenticated
  using(advisor_id=(select auth.uid()) and public.qrih_actor_is_active())
  with check(advisor_id=(select auth.uid()) and public.qrih_actor_is_active());
create policy property_details_private_read on public.property_private_details for select to authenticated
  using ((advisor_id=(select auth.uid()) and public.qrih_actor_is_active()) or public.current_user_is_admin());
create policy property_details_private_insert on public.property_private_details for insert to authenticated
  with check(advisor_id=(select auth.uid()) and public.qrih_actor_is_active()
    and exists(select 1 from public.properties p where p.id=property_id and p.owner_id=auth.uid()));
create policy property_details_private_update on public.property_private_details for update to authenticated
  using(advisor_id=(select auth.uid()) and public.qrih_actor_is_active())
  with check(advisor_id=(select auth.uid()) and public.qrih_actor_is_active()
    and exists(select 1 from public.properties p where p.id=property_id and p.owner_id=auth.uid()));

create function qrih_private.validate_owner_contact()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.id<>old.id or new.advisor_id<>old.advisor_id or new.created_at<>old.created_at) then
    raise exception 'Immutable contact identity.' using errcode='42501';
  end if;
  new.name:=btrim(new.name);
  if tg_op='UPDATE' and new.archived_at is distinct from old.archived_at then
    new.archived_at:=case when new.archived_at is null then null else clock_timestamp() end;
  end if;
  new.updated_at:=clock_timestamp();
  return new;
end $$;
revoke all on function qrih_private.validate_owner_contact() from public,anon,authenticated;
create trigger qrih_validate_owner_contact before insert or update on public.advisor_owners
  for each row execute function qrih_private.validate_owner_contact();

create function qrih_private.validate_property_private_details()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.property_id<>old.property_id or new.advisor_id<>old.advisor_id) then
    raise exception 'Immutable private property identity.' using errcode='42501';
  end if;
  if not exists(select 1 from public.properties p where p.id=new.property_id and p.owner_id=new.advisor_id) then
    raise exception 'Invalid private property association.' using errcode='42501';
  end if;
  -- Archive is reversible history, not a destructive relationship invalidation.
  -- Same-account duplication may preserve an archived contact; new UI choices hide it.
  if new.owner_contact_id is not null and not exists(select 1 from public.advisor_owners c
    where c.id=new.owner_contact_id and c.advisor_id=new.advisor_id) then
    raise exception 'Invalid owner association.' using errcode='42501';
  end if;
  new.internal_name:=nullif(btrim(new.internal_name),'');
  new.updated_at:=clock_timestamp();
  return new;
end $$;
revoke all on function qrih_private.validate_property_private_details() from public,anon,authenticated;
create trigger qrih_validate_property_private_details before insert or update on public.property_private_details
  for each row execute function qrih_private.validate_property_private_details();

create function public.qrih_set_property_private_details(p_property_id uuid,p_details jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare v_previous public.property_private_details;v_name text;v_contact uuid;
begin
  if auth.uid() is null or not public.qrih_actor_is_active() or p_details is null or jsonb_typeof(p_details)<>'object'
    or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('internal_name','owner_contact_id')) then
    raise exception 'Invalid private fields.' using errcode='42501';
  end if;
  perform 1 from public.properties where id=p_property_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Property unavailable.' using errcode='42501';end if;
  select * into v_previous from public.property_private_details where property_id=p_property_id for update;
  v_name:=case when p_details?'internal_name' then nullif(btrim(p_details->>'internal_name'),'') else v_previous.internal_name end;
  v_contact:=case when p_details?'owner_contact_id' then (p_details->>'owner_contact_id')::uuid else v_previous.owner_contact_id end;
  if found then
    update public.property_private_details set internal_name=v_name,owner_contact_id=v_contact where property_id=p_property_id;
  else
    insert into public.property_private_details(property_id,advisor_id,internal_name,owner_contact_id)
      values(p_property_id,auth.uid(),v_name,v_contact);
  end if;
end $$;
revoke all on function public.qrih_set_property_private_details(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.qrih_set_property_private_details(uuid,jsonb) to authenticated;
commit;
