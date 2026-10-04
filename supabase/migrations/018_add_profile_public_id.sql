-- Public numeric identifier for advisor catalogs.
-- Stable across profile name/company changes.

create sequence if not exists public.profiles_public_id_seq
  start with 100001
  increment by 1;

alter table public.profiles
  add column if not exists public_id bigint;

-- Assign permanent public IDs to existing profiles.
with numbered_profiles as (
  select
    id,
    nextval('public.profiles_public_id_seq') as new_public_id
  from public.profiles
  where public_id is null
  order by created_at, id
)
update public.profiles p
set public_id = numbered_profiles.new_public_id
from numbered_profiles
where p.id = numbered_profiles.id;

-- Future profiles receive their ID automatically.
alter table public.profiles
  alter column public_id set default nextval('public.profiles_public_id_seq');

-- Every profile must have exactly one public ID.
alter table public.profiles
  alter column public_id set not null;

create unique index if not exists profiles_public_id_unique
  on public.profiles(public_id);
