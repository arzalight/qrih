begin;

create table if not exists public.platform_settings (
  id boolean primary key default true,
  support_email text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint platform_settings_single_row
    check (id = true)
);

alter table public.platform_settings enable row level security;

drop policy if exists "authenticated users can read platform settings"
  on public.platform_settings;

create policy "authenticated users can read platform settings"
  on public.platform_settings
  for select
  to authenticated
  using (true);

drop policy if exists "admins can insert platform settings"
  on public.platform_settings;

create policy "admins can insert platform settings"
  on public.platform_settings
  for insert
  to authenticated
  with check (
    public.current_user_is_admin()
  );

drop policy if exists "admins can update platform settings"
  on public.platform_settings;

create policy "admins can update platform settings"
  on public.platform_settings
  for update
  to authenticated
  using (
    public.current_user_is_admin()
  )
  with check (
    public.current_user_is_admin()
  );

insert into public.platform_settings (
  id,
  support_email
)
values (
  true,
  null
)
on conflict (id) do nothing;

commit;
