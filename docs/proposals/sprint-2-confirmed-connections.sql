-- PROPOSAL v1 / Sprint2. NOT an installed migration. No remote execution authorized.
-- No backfill. Future manual acceptances only; autoapprovals and declines excluded.
-- On approval, generate the real migration with `supabase migration new` and review ACL/advisors.
begin;
create schema qrih_metrics;
revoke all on schema qrih_metrics from public, anon, authenticated;
create table qrih_metrics.confirmed_connections (
  authorization_id uuid primary key,
  confirmed_at timestamptz not null default now()
);
alter table qrih_metrics.confirmed_connections enable row level security;
revoke all on qrih_metrics.confirmed_connections from public, anon, authenticated, service_role;

create function qrih_metrics.record_confirmed_connection()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'pending' and new.status = 'authorized'
    and new.responded_at is not null and auth.uid() is not null
    and exists (select 1 from public.properties p join public.profiles pr on pr.id=p.owner_id
      where p.id=new.property_id and p.owner_id=auth.uid() and pr.account_status='active') then
    insert into qrih_metrics.confirmed_connections(authorization_id) values(new.id)
      on conflict (authorization_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function qrih_metrics.record_confirmed_connection() from public, anon, authenticated, service_role;
create trigger qrih_record_confirmed_connection after update of status on public.property_contact_authorizations
  for each row execute function qrih_metrics.record_confirmed_connection();

-- Fixed numeric aggregate. No IDs, user/owner/contact data or selectable records exposed.
create function public.qrih_confirmed_connections_count()
returns bigint language sql stable security definer set search_path = '' as $$
  select count(*) from qrih_metrics.confirmed_connections;
$$;
revoke all on function public.qrih_confirmed_connections_count() from public, anon, authenticated;
grant execute on function public.qrih_confirmed_connections_count() to service_role;
commit;
