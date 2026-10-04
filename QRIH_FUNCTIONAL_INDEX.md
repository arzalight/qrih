# QRIH FUNCTIONAL INDEX — Índice maestro tipo SIGMA

**Corte actualizado:** 2026-10-04. IDs existentes conservados. **NO-GO**: Supabase staging Free activo, baseline + 044–049 y property-images privado; qrih-staging publicado en Netlify Free con secretos protegidos y callback exacto. Build, escaneo de secretos y 15 pruebas HTTP sin sesión pasan. Nueve chunks públicos no contienen patrón de secreto ni referencia al proyecto actual. Matriz autenticada, correo/confirmación, recuperación y corte real pendientes. AUD-019 validado SQL; AUD-020 corregido en build remoto. Proyecto actual intacto.

| ID | Funcionalidad | Estado | Frontend / API / servidor | BD / RLS / migraciones | Prueba / auditoría |
|---|---|---|---|---|---|
| AUTH-001 | Registro email/password | LOCAL; EXTERNO PENDIENTE | app/registro/page.tsx | Auth/profiles; 001/004/026/046 | Humo 200; AUD-001/010; alta/email real pendiente |
| AUTH-002 | Login y sesión SSR | IMPLEMENTADO; EXTERNO PENDIENTE | app/login/page.tsx; lib/supabase-server.ts | Auth/cookies | Humo sin sesión; sesión real pendiente |
| AUTH-003 | Callback confirmación | LOCAL; EXTERNO PENDIENTE | app/auth/callback/route.ts | INSERT propio sin upsert, defaults de perfil; 046 | AUD-001/010; deployment pendiente |
| AUTH-004 | Redirección post-login | CORREGIDO LOCAL | lib/safe-navigation.ts; login/registro | N/A | security-inputs.test.mjs; AUD-004 |
| PROF-001 | Perfil editable | IMPLEMENTADO; RLS PENDIENTE | app/perfil; ProfileInfoForm/ProfileSocialForm | profiles; 021/026/031/046 | Roles/locks SQL; prueba cuenta real pendiente |
| PROF-002 | Rol, plan, verificación/suspensión | LOCAL; MIGRACIÓN PENDIENTE | app/admin/asesores/** | 022/025–027/031/043/046/048; current_user_is_admin activo | AUD-010/013; pruebas SQL / ACL |
| PROF-003 | Avatar | CORREGIDO LOCAL; MIGRACIÓN PENDIENTE | ProfileAvatarForm; POST /api/imagenes; verified-media-server | profile-images público/procedencia privada; 020/047 | Bytes/SQL; AUD-005 |
| PROP-001 | Inventario/ficha pública | ADAPTADO LOCAL | app/page.tsx, inventario, bodegas/[slug]; supabase-public-server/property-image-urls | properties_public sólo SELECT; 044–047 | aud002-images/rls; AUD-002/012 |
| PROP-002 | Crear propiedad | ADAPTADO LOCAL | app/publicar; POST /api/imagenes | Borrador → galería → pending; main_image_path; 035/038/044/046/047/048 | AUD-002/013/017; UI real pendiente |
| PROP-003 | Editar borrador/rechazada | CORREGIDO LOCAL; MIGRACIÓN PENDIENTE | mis-propiedades/[id]/editar; POST /api/editar-propiedad | qrih_update_property_with_images, optimistic version; 034/039/040/044/046–048 | Rollback/ownership SQL; AUD-014/017 |
| PROP-004 | Eliminar propiedad | CORREGIDO LOCAL; MIGRACIÓN PENDIENTE | POST /api/eliminar-propiedad | qrih_delete_own_property; cleanup Storage API posterior; 032/033/048 | SQL delete; humo 401; AUD-007/014 |
| PROP-005 | Moderación admin | CORREGIDO LOCAL; MIGRACIÓN PENDIENTE | app/admin/[id] Server Actions, firmas admin/portada de galería | qrih_moderate_property; audit+notification; 002/041/042/046/048 | Admin activo/estado/doble acción SQL; AUD-014 |
| CONT-001 | Contacto/autorización | CORREGIDO LOCAL; MIGRACIÓN PENDIENTE | POST contactar-propiedad y autorizacion; formularios/notificaciones | qrih_request_property_contact, respond RPC, contact RPC; 032/046/048 | Idempotencia/autorización/PII/atomicidad SQL; AUD-011/012 |
| DEM-001 | Demanda/interés/oportunidad | CORREGIDO LOCAL; MIGRACIÓN PENDIENTE | busco-bodega; POST requerimientos/interes/registrar-oportunidad | Actor JWT, cuota servidor, trigger notificación, índices únicos; 046–048 | Input/cuota/ownership SQL; AUD-003/014 |
| IMG-001 | Galería de propiedad | STAGING VALIDADO PARCIAL; AUD-002 NO CERRADO EN ACTUAL | publicar/editar/ficha/admin; property-image-urls; tests/staging-live | Paths; autorización actor → firma servidor; 044–049 | JWT real A/B/admin/público; galería/firmas/descarga/estados; TTL vencido/UI integral pendientes |
| IMG-002 | WebP / máximo siete | VALIDADO EN STAGING; CASOS LÍMITE PENDIENTES | image-optimizer, verified-media-server, /api/imagenes; tests/staging-live | Procedencia/bytes/ruta/cantidad en BD; 044/046/047/048 | Siete uploads HTTP; corrupto/octava rechazados; original 20 MB/optimizado 3 MB; carga/cold-start pendientes |
| PDF-001 | Ficha PDF pública | VALIDADO EN STAGING; CORTE ACTUAL PENDIENTE | GET /api/bodegas/[slug]/pdf; pdf-images-server; tests/staging-live | Sólo published; TTL 300; conversión JPEG efímera | PDF real Netlify HTTP 200 con siete WebP distintos incrustados; límites/carga pendientes; AUD-006/016 |
| ADM-001 | Asesores/bitácora/configuración/catálogo | LOCAL; EXTERNO PENDIENTE | app/admin/**, app/asesor/[public_id]; notificaciones | 036/041–043/045–048; admin activo, catálogo sin contacto | SQL / humo parcial; UI real pendiente |
| OPS-001 | Build producción | VALIDADO LOCAL | package.json; Next 16.3.6 | N/A | Build/types/lint pasan; AUD-008/015 |
| OPS-002 | Deploy Netlify | STAGING FREE PUBLICADO; NO-GO REAL | netlify.toml, scripts/deployment-preflight.mjs, scripts/netlify-next-build.mjs | OpenNext actual explícito; secreto de staging sólo en Netlify; callback exacto | READY normal 6ac2b00f96ae02e0c1a8b626; 15 HTTP sin sesión, 24 autenticados en versión compatible; cierre integral pendiente |
| OPS-003 | Pruebas automatizadas | LOCAL + SQL + HTTP STAGING PARCIALES | tests/aud002-images, security-inputs, aud002-rls, staging-baseline, http-smoke, staging-live; supabase/checks/staging_security_smoke.sql | Fixture + baseline/044–049; SQL rollback; HTTP sintético de ejecución única | 14 unit, 27 SQL internos/baseline, 14 SQL remotos, 15 HTTP sin sesión y 24 autenticados; correo/contactos/UI integral pendientes |

## Controles y referencias comunes

OPS-002/003 — GitHub `arzalight/qrih` privado, `main`/`develop` subidos. Staging enlazado sólo a `develop`; otras ramas/previews desactivados y logs privados. READY/publicado `6ac2be07ce110e3b94a50a2c`, commit `ee4d465`; 15 HTTP sin sesión repetidos y nueve chunks inspeccionados. Producción no conectada. Trazabilidad: `.gitignore`, `scripts/git-secrets-check.mjs`, `docs/PRE_GITHUB_REVIEW.md`, `supabase/staging/git-deployment-verification-2026-10-04.md`. Este nuevo corte documental local requiere subir su commit.

Último deployment normal READY: `6ac2b00f96ae02e0c1a8b626`; sin prueba mutante automática. Se suman **24 comprobaciones HTTP/RPC autenticadas** en staging a los 15 casos sin sesión y 14 SQL remotos: JWT/cookies, siete WebP, aislamiento, estados/suspensión, galería y PDF real. Limpieza independiente: cero cuentas/propiedades/procedencias/objetos. Referencias IMG-001/002 y PDF-001 pasan a **VALIDADO PARCIAL EN STAGING**, nunca a resuelto en el proyecto actual. Evidencia: `tests/staging-live.test.mjs` y `supabase/staging/deployment-verification-2026-10-04.md`. Correo, contactos completos, TTL real, UI integral y recuperación siguen pendientes.

- Fuente de severidad/evidencia: QRIH_AUDIT.md (sección vigente; histórico colapsado).
- Estado maestro: PROJECT_STATUS.md. Acciones posteriores: NEXT_STEPS.md.
- Antes de migrar: supabase/checks/aud002_preflight.sql y soft_launch_preflight.sql, sólo lectura.
- Migraciones nuevas 044–049: **aplicadas sólo en staging**, no en el proyecto actual. Conservar historial, no replay automático.
- main_image legado preservado; main_image_path/property_images.storage_path son persistentes. Firmas nunca en BD.
- Tests SQL requieren PGlite externo y variable QRIH_PGLITE_MODULE; test:http requiere next start local, sin cookies/datos reales.
- Mantener estos IDs; actualizar estado sólo con evidencia y entorno indicado. No crear funcionalidades durante el congelamiento.
