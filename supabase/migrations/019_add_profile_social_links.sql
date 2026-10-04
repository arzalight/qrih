alter table public.profiles
  add column if not exists whatsapp text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists linkedin_url text;
