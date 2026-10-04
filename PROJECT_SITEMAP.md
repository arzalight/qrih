# PROJECT SITEMAP — QRO INDUSTRIAL HUB / QRIH

> Generado el 2026-09-30 14:33:22 CST

## Rutas de la aplicación

- `/admin/[id]` → `app/admin/[id]/page.tsx`
- `/admin` → `app/admin/page.tsx`
- `/api/bodegas/[slug]/pdf` → `app/api/bodegas/[slug]/pdf/route.tsx`
- `/api/contactar-propiedad/autorizacion` → `app/api/contactar-propiedad/autorizacion/route.ts`
- `/api/contactar-propiedad` → `app/api/contactar-propiedad/route.ts`
- `/api/editar-propiedad` → `app/api/editar-propiedad/route.ts`
- `/api/interes-propiedad` → `app/api/interes-propiedad/route.ts`
- `/api/registrar-oportunidad` → `app/api/registrar-oportunidad/route.ts`
- `/auth/callback` → `app/auth/callback/route.ts`
- `/bodegas/[slug]` → `app/bodegas/[slug]/page.tsx`
- `/busco-bodega` → `app/busco-bodega/page.tsx`
- `/inventario` → `app/inventario/page.tsx`
- `/login` → `app/login/page.tsx`
- `/mis-propiedades/[id]/editar` → `app/mis-propiedades/[id]/editar/page.tsx`
- `/mis-propiedades/[id]/solicitudes` → `app/mis-propiedades/[id]/solicitudes/page.tsx`
- `/mis-propiedades` → `app/mis-propiedades/page.tsx`
- `/notificaciones` → `app/notificaciones/page.tsx`
- `/` → `app/page.tsx`
- `/panel` → `app/panel/page.tsx`
- `/perfil` → `app/perfil/page.tsx`
- `/privacidad` → `app/privacidad/page.tsx`
- `/publicar` → `app/publicar/page.tsx`
- `/registro` → `app/registro/page.tsx`
- `/terminos` → `app/terminos/page.tsx`

## Componentes principales

- `components/.DS_Store`
- `components/AdminPropertyFilters.tsx`
- `components/AuthorizationActions.tsx`
- `components/AutoApproveContactsToggle.tsx`
- `components/Footer.tsx`
- `components/Header.tsx`
- `components/ImageUploader.tsx`
- `components/InventoryFilters.tsx`
- `components/PropertyCard.tsx`
- `components/PropertyContactForm.tsx`
- `components/PropertyImageGallery.tsx`
- `components/ZoneSelectors.tsx`

## Librerías internas

- `lib/data.ts`
- `lib/image-optimizer.ts`
- `lib/matching.ts`
- `lib/supabase-server.ts`
- `lib/supabase.ts`
- `lib/zonas.ts`

## Supabase / migraciones

- `supabase/.DS_Store`
- `supabase/migrations/001_qrih_schema.sql`
- `supabase/migrations/002_admin_property_updates.sql`
- `supabase/migrations/003_protect_publisher_contact.sql`
- `supabase/migrations/004_protect_profile_roles.sql`
- `supabase/migrations/005_restrict_contact_requests.sql`
- `supabase/migrations/006_respond_contact_authorization.sql`
- `supabase/migrations/007_protect_profile_managed_fields.sql`
- `supabase/migrations/008_require_authorization_response_function.sql`
- `supabase/migrations/009_remove_live_contact_authorization_update_policy.sql`
- `supabase/migrations/010_remove_unused_interest_update_policies.sql`
- `supabase/migrations/011_restore_profile_managed_fields_protection.sql`
- `supabase/migrations/012_version_active_notification_functions.sql`
- `supabase/migrations/013_version_active_rls_policies.sql`
- `supabase/migrations/014_property_images_policies.sql`
- `supabase/migrations/015_save_property_images_function.sql`
- `supabase/migrations/016_fix_gallery_paths_and_titles.sql`
- `supabase/migrations/016_fix_image_path_validation_and_titles.sql`
- `supabase/migrations/017_property_images_read_policies.sql`

## Documentación

- `PROJECT_STATUS.md` → estado actual del proyecto
- `NEXT_STEPS.md` → hoja de ruta
- `PROJECT_SITEMAP.md` → mapa estructural del proyecto
