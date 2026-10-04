-- QRIH Phase 1 schema. Future matching, billing and CRM tables can reference these UUID keys.
create type public.property_status as enum ('draft','pending','published','paused','rejected','expired','pending_update');
create type public.plan_code as enum ('trial','basic','intermediate','advanced');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null, phone text, company_name text, website text,
  role text not null default 'publisher' check (role in ('publisher','editor','admin')),
  plan plan_code not null default 'trial', trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.properties (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
  slug text unique not null, title text not null, operation text not null check(operation in ('Renta','Venta')),
  status property_status not null default 'draft', zone text not null, address text,
  location_visibility text not null default 'zone' check(location_visibility in ('zone','address')),
  price_display text not null, price_plus_vat boolean default false, price_plus_maintenance boolean default false,
  negotiable boolean default false, total_area numeric, covered_area numeric, exterior_area numeric,
  max_height text, offices_area numeric, parking integer, docks integer, description text,
  share_commission boolean default false, main_image text, featured boolean default false, featured_priority integer,
  publication_authorized_at timestamptz, terms_accepted_at timestamptz,
  last_verified_at timestamptz, verification_due_at timestamptz, rejection_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.property_images (id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade, storage_path text not null, category text default 'gallery', position integer default 0, created_at timestamptz default now());
create table public.property_contacts (id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id), name text not null, phone text, email text not null, company text, message text, source text, utm jsonb default '{}'::jsonb, created_at timestamptz default now());
create table public.demand_requests (id uuid primary key default gen_random_uuid(), name text not null, phone text not null, email text not null, company text, operation text, zone text, area_requirement text, budget text, notes text, status text not null default 'new', created_at timestamptz default now());
create table public.home_pool (property_id uuid primary key references public.properties(id) on delete cascade, active boolean default true, added_at timestamptz default now());
create table public.audit_logs (id bigint generated always as identity primary key, actor_id uuid references public.profiles(id), entity_type text not null, entity_id uuid, action text not null, metadata jsonb default '{}'::jsonb, created_at timestamptz default now());

alter table public.profiles enable row level security; alter table public.properties enable row level security; alter table public.property_images enable row level security; alter table public.property_contacts enable row level security; alter table public.demand_requests enable row level security;
create policy "public sees published properties" on public.properties for select using(status='published');
create policy "owners manage own properties" on public.properties for all using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
create policy "anyone can submit demand" on public.demand_requests for insert with check(true);
create policy "anyone can submit contacts" on public.property_contacts for insert with check(true);
create policy "users read own profile" on public.profiles for select using(auth.uid()=id);

insert into storage.buckets (id,name,public) values ('property-images','property-images',true) on conflict do nothing;
create policy "owners upload images" on storage.objects for insert to authenticated with check(bucket_id='property-images' and (storage.foldername(name))[1]=auth.uid()::text);
