# QRIH — Auditoría técnica pre-Soft-Launch

## Corte vigente — correcciones y staging autorizados, actualizado 2026-10-04

**Control pre-GitHub:** `docs/PRE_GITHUB_REVIEW.md`: índice de 159 archivos sin patrones de secreto detectados; `.env`, builds/dependencias, temporales Supabase y respaldos excluidos. 49 migraciones activas conservadas; ninguna ejecutada en esta revisión. Git local verificado, commit inicial `55b7737`, `main`/`develop`; lint/tipos/14 tests pasan. GitHub `arzalight/qrih` creado privado, vacío; subida/conexión pendiente de autorización Git local. Este control no cierra AUD-002 ni cambia el NO-GO. Producción permanece desconectada.

**Dictamen: NO-GO para abrir a usuarios reales.** Supabase staging Free recibió baseline + 044–049; `property-images` es privado. **Staging publicado en Netlify Free**: https://qrih-staging.netlify.app, deployment `6ac2a97f4287162e063306eb`. Credencial de staging protegida como secreto en Netlify, sin copia local; variables públicas del mismo staging. Auth Site URL y callback exacto configurados, sin wildcard. Pasan 15 pruebas HTTP sin sesión y la inspección de nueve chunks públicos. Faltan matriz autenticada completa, email/confirmación, restauración y corte del proyecto actual, cuyo esquema y Storage público siguen intactos.

### Avance remoto comprobado — staging gratuito

- Organización: QRO INDUSTRIAL HUB (Free). Staging: `mcyxunymhuxyiwklyfpy`, us-west-1, PostgreSQL 17.11, activo; costo de creación confirmado por el proveedor: $0/mes. Actual: `dmtvnwsuhehxfftddsap`, us-west-2, PostgreSQL 17.6; sólo se consultó estructura/configuración.
- Se capturaron 13 tablas, enums, columnas/defaults, constraints/FKs, índices, funciones, triggers, políticas y grants del catálogo activo. Hay cambios implementados cuyo número no figura en el historial remoto (éste termina en 036). Por eso staging usa `supabase/staging/baseline-2026-10-03.sql`, no un replay ciego de 001–043. El baseline requiere `public` vacío y no contiene filas, usuarios Auth, fotos, claves ni configuración Auth.
- Se probó baseline + 044–049 en PostgreSQL aislado y luego se aplicó en staging. Verificación remota: 15 tablas públicas, `main_image_path` presente, helper Storage de operaciones presente y 0 usuarios Auth. La reconstrucción de estructura **no es una prueba de restauración de BD + Storage**.
- Buckets creados por panel/API del proveedor: property-images privado, MIME image/webp, 20 MiB; profile-images público según diseño existente, MIME image/webp, 5 MiB. No se escribieron metadatos de Storage mediante SQL. No hay objetos de prueba aún.
- Netlify: Free, 300 créditos incluidos, sin tarjeta/recargas automáticas. Proyecto qrih-staging creado el 2026-10-04, ID bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859. OAuth y transferencia de clave de staging autorizados por el usuario. Deployment `6ac2a97f4287162e063306eb` READY; compilación Linux, lint/tipos, 14 tests y escaneo de secretos pasan. HTTP redirige 301 a HTTPS. Nueve chunks públicos no contienen patrón de clave privada ni referencia al Supabase actual; rutas probadas `.env`, servidor Next y caché devuelven 404.
- Auth staging: Site URL `https://qrih-staging.netlify.app`; única Redirect URL `https://qrih-staging.netlify.app/auth/callback`. No se habilitó wildcard, se desactivó confirmación ni se configuró SMTP de pago. Entrega/confirmación por correo pendiente.
- AUD-020 detectado en primer build, no publicado: Turbopack guardó la credencial en `.next/cache`, aunque el bundle público no la contenía. El wrapper de build excluye la credencial del subproceso Next; Netlify la conserva para runtime. Escaneo de secretos sigue activo. Adaptador OpenNext oficial declarado explícitamente, sin fijar versión, porque el ZIP inicial no lo activó. Segundo build publicado tras superar escaneo. No se omitieron claves/rutas del detector ni se desactivó protección.
- **24 comprobaciones autenticadas PASS** en Netlify: Auth/JWT/cookies reales, siete uploads WebP, aislamiento público/A/B/admin, firma nativa denegada, octava foto y corrupto rechazados, published/galería/dirección oculta, descarga firmada, URL pública antigua de objeto existente denegada, PDF con siete imágenes, estados privados y suspensión con JWT previo. Firma previa sigue válida hasta TTL por diseño. Limpieza PASS; consulta independiente confirmó cero cuentas, propiedades, procedencias y objetos. Sólo bitácora sintética sin actor y dos marcas privadas de repetición. Configuración normal sin ejecución automática ni flag persistente. Evidencia: `supabase/staging/deployment-verification-2026-10-04.md`.
- Primer ensayo autenticado incompleto, sin diagnóstico suficiente para confirmar causa; limpieza retenida por FK de auditoría. Se retiró sólo la cuenta sintética identificada preservando su bitácora sin actor y se corrigió el fixture. Siguiente ejecución pasó sin cambio funcional de API. Repetir cold-start/red antes del piloto; no atribuir causa sin evidencia.
- **Deployment normal vigente `6ac2b00f96ae02e0c1a8b626` READY**, sin orden de prueba temporal. Correo/callback completo, contactos/demanda/notificaciones HTTP autenticados, expiración real, avatar, concurrencia, UI móvil y recuperación siguen pendientes. NO-GO para el piloto; AUD-002 no está cerrado en el proyecto actual.
- **AUD-019 corregido en staging con 049**: revocación explícita de PUBLIC/anon/authenticated y lista de RPC/helpers necesarios, restricciones de privilegios futuros, retirada de policy heredada de contacto directo y filtro de ownership. 27 casos SQL internos locales y prueba del baseline pasan. `supabase/checks/staging_security_smoke.sql` pasó 14 comprobaciones SQL en Supabase real, con rollback: aislamiento, estados, dirección oculta, ACL, ownership, roles, contacto, moderación/auditoría y suspensión. Se verificaron cero usuarios/propiedades/procedencias persistidos después. No demuestra emisión JWT/Auth ni endpoints Storage HTTP.
- Advisors mantiene avisos revisados: 3 tablas RLS sin policies (sin lectura cliente), 8 helpers definer accesibles a anon y 18 funciones/helpers autorizados a authenticated; `properties_public` sigue definer intencional con filtro explícito + proyección sin PII sobre tabla privada. No declarar cero avisos ni cambiar a invoker sin evaluar ruptura del inventario. Evidencia: `supabase/staging/verification-2026-10-03.json`.

AUD-002 continúa **ALTO / EN REVISIÓN — NO CORREGIDO EN EL ENTORNO ACTUAL**. Privatización de staging por sí sola no cierra el hallazgo ni acredita firmas, PDF o aislamiento HTTP.

La autorización vigente permite resolver los hallazgos en este workspace sin pedir confirmación por cada edición. La regla histórica de detener cada cambio corresponde al flujo de chat/copiar-pegar. Se conserva congelamiento de funcionalidades: cambios sólo de seguridad, integridad y compatibilidad de flujos existentes. Esta sección reemplaza estados/propuestas históricos que aparecen al final.

### Hallazgos y estado real

| ID | Severidad | Problema identificado antes de corregir | Corrección / evidencia local | Estado externo |
|---|---|---|---|---|
| AUD-001 | CRÍTICO | Callback de registro fijado a localhost. | Origen del navegador; callback crea perfil sin sobrescribir perfil existente. Registro deja de hacer upsert de campos gestionados. | Configurar y probar email/confirmación/login en deployment; NO CERRADO. |
| AUD-002 | ALTO | Bucket público y URLs persistentes ignoran despublicación. | Opción B: main_image_path transitorio; main_image conservado, excluido de presentación pública. Firmas efímeras autorizadas en servidor; 044/045/047/048. | **ALTO / EN REVISIÓN — NO CORREGIDO EN EL ENTORNO.** Implementación local preparada; bucket real no cambiado. |
| AUD-002-SIGN | ALTO | SELECT de Storage permitía firma nativa con TTL arbitrario fuera de QRIH. | 045 exige helper de operaciones; lista permitida excluye sign/sign_many/list. Autorización por RPC del actor antes de firmar con cliente privado. Pruebas anon/A/B/admin rechazan firma directa. | Repetir contra API Storage real y versión instalada; NO CERRADO. |
| AUD-003 | MEDIO | Inserciones directas anónimas de demanda/vistas y notificaciones usadas para spam. | 047 bloquea altas directas; rutas validadas y cuotas atómicas de servidor; contactos idempotentes y limitados en 046. | Mitigación local; validar cuotas/costos en beta. No reemplaza controles de abuso del proveedor. |
| AUD-004 | MEDIO | next externo/protocol-relative tras login/registro. | safeInternalPath; tests de URL absoluta, codificación, barras invertidas y controles. | Corregido en código; comprobar navegador/deployment. |
| AUD-005 | MEDIO | Avatar público con upload/overwrite sin validar contenido real en servidor. | Ingesta autorizada, decodificación/re-encode WebP, ruta aleatoria propia, sin overwrite; referencia con procedencia servidor. Limpieza anterior propia. | Bucket avatar sigue público por su uso en catálogo; políticas/API pendientes de aplicar. |
| AUD-006 | MEDIO | PDF podía descargar URLs externas persistidas. | Sólo firmas de bucket/origen exactos; sin redirects, descarga acotada/timeout; no fallback externo. | Render sintético pasa; HTTP Storage real pendiente. |
| AUD-007 | BAJO | Limpieza Storage no atómica con tablas. | Borrado BD transaccional; objetos se eliminan por API después. Fallo de limpieza visible/código de log. No borrar objetos si respuesta de edición se perdió tras posible commit. | Riesgo residual de huérfanos privados; conciliación/manual de sólo lectura, no borrado masivo automático. |
| AUD-008 | BAJO | next lint inexistente; sin controles de despliegue. | ESLint de errores, typecheck, tests, netlify.toml y preflight sin valores secretos. | Sin CI remoto ni deploy probado; límite de cobertura detallado abajo. |
| AUD-009 | COSMÉTICO | Respaldos/legado y documentación contradictoria. | Documentos maestros sincronizados; historia identificada como tal. | No se borraron .bak/.backup ni legado. Limpieza diferida. |
| AUD-010 | ALTO | Protección de role/plan sólo en UPDATE; INSERT y otros campos gestionados/identidad elegibles por cliente. | Trigger 046 en INSERT/UPDATE, ID público/created_at asignados en servidor; roles/plan/verificación/suspensión/bloqueos protegidos. Tests directos. | Migración pendiente. No prueba de intrusión real. |
| AUD-011 | ALTO | Autorizaciones/contactos insertables fuera del flujo; solicitud/notificación podían quedar separadas. | Alta directa bloqueada; RPC JWT activo deriva autoaprobación de BD y guarda contacto/autorización/notificación juntos, con bloqueo y cuota. RPCs de spam retirados. | Migración y cuatro cuentas reales pendientes. |
| AUD-012 | ALTO | SELECT de properties podía entregar address oculto y previous_data; catálogo entregaba teléfono/WhatsApp sin autorización. | Tabla privada dueño/admin; vista pública SELECT-only, dirección condicionada, sin URL legado ni moderación. RPC catálogo suprime teléfono/WhatsApp; contacto sólo autorizado y actor activo. Tests incluyen DEFAULT PRIVILEGES permisivos. | Migración pendiente; validar HTML/JSON/PDF y compatibilidad con notificaciones. |
| AUD-013 | ALTO | Reglas de fotos y moderación eludibles mediante escrituras directas; portada adicional podía superar siete. | Triggers de estado/ownership/ruta/cantidad; conjunto portada+galería validado al commit, portada debe estar en galería cuando existe; ingesta directa cerrada. | Pendiente de pruebas multi-sesión/Storage reales. |
| AUD-014 | ALTO | Edición, moderación y borrado repartidos en operaciones independientes; potencial pérdida/inconsistencia parcial. | 048: edición+galería con versión y bloqueo, moderación+bitácora+notificación, borrado de dependencias+propiedad en transacción. Índices únicos interés/oportunidad abortan si hay duplicados. | Migración y fallos de red reales pendientes. |
| AUD-015 | CRÍTICO potencial de dependencia | npm audit señaló Next 16.3.5 afectado por GHSA-vcvr-r3jv-pc5j. | Actualizado a 16.3.6; audit actual sin vulnerabilidades. No se encontró uso de next/og/ImageResponse: **no se confirmó explotabilidad en QRIH**. | Repetir audit al deploy. [Advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j). |
| AUD-016 | ALTO | React-PDF instalado soporta PNG/JPEG, no WebP: fotos podían omitirse del PDF. | Conversión sólo en memoria a JPEG, secuencial y acotada. Test renderiza siete fotos sintéticas y comprueba objeto Image incrustado. | PDF real de hasta siete fotos/Netlify pendiente. |
| AUD-017 | ALTO de compatibilidad | Upload servidor de siete fotos en un request puede superar payload de Netlify. | Publicar/editar suben individualmente; máximo siete persistentes. Original hasta 20 MB, optimizado máximo 3 MB/request. Avatar original hasta 5 MB optimizado con utilidad existente. | Validar imágenes reales y PDF/tamaño/tiempo en Netlify. [Límites](https://docs.netlify.com/build/functions/overview/). |
| AUD-018 | ALTO de verificación | Bootstrap versionado incompleto respecto a tablas/columnas usadas por migraciones y aplicación. | Confirmado en archivos: 001 no define varias tablas de contactos/notificaciones/oportunidades ni previous_data/price_value/price_unit/zone_general. Fixture lo declara expresamente; inventario read-only preparado. | **Bloqueante**: reconciliar/exportar esquema real y ensayar restauración en staging. No inventar definición activa. |
| AUD-019 | ALTO | Default privileges de Supabase conceden EXECUTE explícito a anon/authenticated; retirar sólo PUBLIC deja RPCs internos accesibles y un helper puede revelar ownership de imágenes privadas. | Confirmado por pg_default_acl/has_function_privilege y advisors después de 044–048 en staging; sin evidencia de explotación en el proyecto actual. | CORREGIDO Y VALIDADO SQL EN STAGING con 049; HTTP pendiente. No aplicado al proyecto actual. |
| AUD-020 | ALTO | Primer build remoto registró la clave de servidor en caché de Turbopack; Netlify bloqueó publicación. No hay evidencia de exposición pública. | scripts/netlify-next-build.mjs retira clave sólo del proceso compilador; runtime conserva secreto protegido. Adaptador OpenNext explícito para ZIP; detector de secretos sigue activo. | Segundo build READY y escaneo pasa; 9 chunks sin patrón de secreto; archivos privados probados devuelven 404. No implica cierre de todos los flujos. |

Los hallazgos de código son confirmados por inspección o ejecución sintética; **ninguno acredita explotación real ni configuración activa del proveedor**. Los cierres externos siguen pendientes.

### Cambio técnico acotado y fuentes de verdad

La ingesta se mueve al servidor porque RLS no puede comprobar bytes/MIME/decodificación. El único cambio de infraestructura requerido es una credencial privada de Supabase, nunca NEXT_PUBLIC_. Se mantiene Next.js/Supabase, optimización WebP, propiedad/moderación, galería, inventario, catálogo, perfiles, PDF y máximo siete; no se añade producto nuevo.

- Persistencia: property_images.storage_path y properties.main_image_path; main_image legado se preserva para reversibilidad, no se transforma en una firma ni se utiliza como fallback público.
- Subida: UI optimiza → /api/imagenes con sesión activa → cuota+decodificación+re-encode → Storage API sin upsert → procedencia servidor (qrih_verified_uploads) → referencia BD validada. Storage no asigna owner_id a service-role uploads; la procedencia privada cubre ese caso, no un dato elegido por cliente.
- Publicación: crea borrador, registra galería y después envía pending. Si falla, informa que existe borrador; no anuncia publicación completa.
- Edición: fotos individuales → galería y campos en RPC transaccional con updated_at esperado; fallo conserva edición anterior. Si se pierde la respuesta tras posible commit, no borrar fotos potencialmente referenciadas.
- Presentación: Server Components/ruta PDF seleccionan propiedades/rutas → RPC con identidad original autoriza conjunto → firmador privado emite TTL fijo → componente recibe sólo URL temporal. No hay endpoint de firma arbitraria ni firma cliente.
- Vista pública usa cliente anon sin cookies (también navegando como admin/dueño), force-dynamic/no-store. APIs y PDF evitan caché persistente; no publicar PII en logs: sólo códigos de eventos.
- No se modifica Storage mediante SQL de objetos/buckets: corte de bucket y archivos se hace por API del proveedor.
- DELETE de fotos todavía referenciadas en portada/galería se deniega incluso al dueño: primero desvincular en BD y después limpiar huérfanos propios. Evita romper inventario/fichas mediante borrado directo de una imagen en uso; pendiente repetir con Storage HTTP real.

| Superficie | TTL | Emisor / permiso |
|---|---|---|
| Tarjetas/portada/inventario/catálogo | 600 s | Servidor; sólo published+cuenta activa+publications_enabled. |
| Ficha/galería | 900 s | Servidor público; mismas reglas. |
| Editor/admin | 900 s | Dueño propio / admin activo; rutas elegidas desde BD. |
| PDF | 300 s | Servidor público; firmas descargadas justo antes de convertir/renderizar. |

Las firmas son credenciales bearer y siguen utilizables hasta vencer (máximo 900 s) aunque cambie el estado; una nueva firma debe negarse al ocultar/suspender. No se promete revocación instantánea de firmas ni de archivos ya descargados. Un asesor con contacto autorizado **no** obtiene fotos privadas de estados no publicados.

| Estado / actor | Público / asesor ajeno | Dueño | Admin activo |
|---|---|---|---|
| published, cuenta activa y publicaciones habilitadas | Sí | Sí | Sí |
| draft/pending/rejected/paused/expired/pending_update | No | Sí, propio historial | Sí, referencias asociadas |
| Cuenta dueña suspendida / publicaciones deshabilitadas | No | Historial propio; sin upload/editar/borrar si suspendida | Sí según referencia |
| Admin suspendido | Como público, sin privilegio admin | Sólo su propio historial si aplica | No privilegios |

Transiciones UI preservadas: dueño activo draft/rejected → draft/pending; admin activo pending → published/rejected; retirada published → rejected con motivo. No se añadieron automatismos de paused/expired/pending_update ni reglas nuevas de negocio para esos estados.

### Archivos y trazabilidad de corrección

| Grupo | Archivos principales | Migración / prueba |
|---|---|---|
| Auth / navegación | app/registro/page.tsx, app/login/page.tsx, app/auth/callback/route.ts, lib/safe-navigation.ts | 046; security-inputs.test.mjs; flujo email externo pendiente |
| Lectura/firma | lib/property-image-urls.ts, lib/supabase-public-server.ts, lib/supabase-privileged-server.ts; portada/inventario/ficha/asesor/editor/admin | 044–047; aud002-images.test.mjs, aud002-rls.test.mjs |
| Upload / avatar | app/api/imagenes/route.ts, lib/verified-media-server.ts, lib/image-optimizer.ts, components/ProfileAvatarForm.tsx | 047; pruebas de bytes/formato/cuotas/procedencia |
| Crear / editar / eliminar / moderar | app/publicar/page.tsx; editar form y API; eliminar API; app/admin/[id]/page.tsx | 044/046/048; transacciones y ataques SQL |
| Contactos / demandas / intereses | APIs contactar/autorizacion/requerimientos/interes/registrar-oportunidad; busco-bodega y notificaciones | 046/047/048; permisos, idempotencia, integridad |
| PDF | app/api/bodegas/[slug]/pdf/route.tsx, lib/pdf-images-server.ts | AUD-002/006/016; render sintético / SSRF negativo |
| Controles operativos | .gitignore, .env.example, package.json/lock, eslint.config.mjs, netlify.toml, scripts/deployment-preflight.mjs | Build/lint/tipos/audit; preflight |
| Inventario externo | supabase/checks/aud002_preflight.sql, supabase/checks/soft_launch_preflight.sql | Sólo lectura; fixture ejecutado, entorno real pendiente |

Sin refactor funcional de PropertyCard, PropertyImageGallery, PropertyImageEditor, ImageUploader ni matching/zonas. Migraciones 001–043 intactas; no borrar respaldos/legado. Algunos archivos adicionales sólo cambian logs a códigos sin PII o revalidan admin activo.

### Verificación ejecutada

- npm run build / npm run typecheck / npm run lint: **PASAN**. ESLint comprueba errores comunes, no es auditoría formal ni cobertura total de reglas React.
- npm test: **14 casos pasan**, SDK de firma simulado; bytes WebP reales sintéticos, decoder Sharp real, PDF con fotos incrustadas.
- npm run test:rls: **26 casos internos pasan** en PostgreSQL PGlite aislado (**27 contando contenedor**). Usa migraciones reales relevantes y 044–048; cuatro roles/identidades, esquema Storage sintético, helper de operaciones simulado.
- npm run test:http: **15 casos locales sin sesión**; login/registro disponibles, admin redirige, perfil/mis-propiedades/notificaciones sólo muestran aviso de login, APIs sensibles 401 y demanda inválida 400. No se enviaron operaciones válidas ni se probaron cuentas reales.
- Total: **55 casos locales** (56 pruebas informadas incluyendo contenedor SQL).
- npm audit (completo y producción): **0 vulnerabilidades informadas en este corte**, no garantía de seguridad completa.
- npm run preflight: **RECHAZA despliegue por falta de SUPABASE_SERVICE_ROLE_KEY**; resultado esperado. Variables públicas presentes, bundle inspeccionado sin referencia a la clave privada. No se imprimieron valores ni se modificó .env.
- Esta carpeta no es repositorio Git: no es posible verificar historial/tracking. .gitignore evita nuevas inclusiones de .env, pero antes de subir hay que comprobar historial/repo de destino. Sin clave privada real no se afirma que se verificó su valor en bundle real.
- Node advierte detección de módulo en tests TS; no rompe tests/build. ESLint 9 instalado avisó de fin de soporte: deuda baja de tooling; audit actual no reporta vulnerabilidad.
- PGlite es dependencia temporal de pruebas fuera del producto; reproducir con QRIH_PGLITE_MODULE=/ruta/al/dist/index.js de @electric-sql/pglite. Fixture no sustituye Auth/Storage HTTP, cachés/CDN, archivos físicos, concurrencia multi-sesión, esquema completo ni Netlify.

### Secuencia mínima de corte (no ejecutada)

1. Crear staging separado de Supabase y Netlify, sin datos personales reales. Exportar/reconciliar esquema activo y control de versiones 001–043; validar backup BD y backup independiente de archivos Storage. No ensayar por primera vez en real.
2. Ejecutar checks de sólo lectura. Para 044 fijar app.qrih_storage_origin al origen HTTPS exacto del **staging**. Revisar convertibles/NULL/excepciones/rutas/ownership/duplicados y helper storage.allow_any_operation. Toda excepción requiere decisión explícita; no convertir URLs de demo/exteriores ni eliminar datos automáticamente.
3. En staging cerrado aplicar, en orden: 044_add_property_main_image_path.sql → 045_make_property_images_private.sql → 046_soft_launch_authorization_boundaries.sql → 047_verified_media_ingestion.sql → 048_atomic_property_writes.sql. Las nuevas policies dependen del esquema reconciliado; no ejecutar cadena a ciegas.
4. Configurar credencial privada por contexto Netlify (Build para preflight y Functions para runtime), públicas del mismo staging; desplegar código compatible dentro de ventana cerrada. Ningún preview usa secreto/BD real ni dominios wildcard sin revisar.
5. **Por Storage API**, convertir property-images a privado (045 no actualiza storage.buckets por SQL). Mantener WebP únicamente y límite anterior si más restrictivo (máximo 20 MB del objeto; transporte optimizado 3 MB). Preservar carpeta usuario/archivos. Avatar sigue público; WebP/tamaño se restringen también en bucket. Verificar public=false por lectura.
6. Ejecutar matriz siguiente, incluidos URL pública antigua, firma nativa denegada, expiración/CDN y pruebas de cuatro cuentas reales. Permitir dominios exactos en Supabase Site URL/Redirect URLs, HTTPS, confirmar email.
7. Sólo si todo bloqueante pasa: respaldar, programar corte equivalente en real y repetir humo en **deployment exacto** antes de abrir piloto. Rollback conserva main_image; mantener bucket privado incluso al revertir código, nunca reabrir privacidad como recuperación. Restaurar BD/archivos de forma coordinada y conservar cambios legítimos.

### Matriz de validación externa — resultados parciales de staging

| Caso | Resultado requerido | Evidencia local / pendiente |
|---|---|---|
| Registro → correo → callback → login/logout; sesión expirada | Usuario propio; callback deployment; sin sobrescritura; APIs 401 | Código + humo sin sesión; email/sesión reales pendientes |
| A/B/admin/público; IDs/rutas/owner/advisor/demand alterados | Sin lectura/escritura/PII ajena; sin admin/plan/locks por cliente | SQL y humo parcial; HTTP autenticado pendiente |
| Tablas profiles/properties/images/contacts/demands/auths/notificaciones/opportunities/interests/audit/settings | Acceso mínimo de cada rol; configuración no escribible por usuario; notificación sólo read_at | SQL parcial; inventario activo completo pendiente |
| Security definer / grants / schema public | JWT/rol/estado y búsqueda fija; sin CREATE cliente ni RPCs internos expuestos | SQL; revisar funciones adicionales activas |
| Todos los estados y suspensión/reactivación | Público sólo published+activo+habilitado; privados sin firma nueva | Seis estados privados: HTTP 404 y RPC sin rutas. Suspensión con JWT previo oculta ficha y deniega upload. Reactivación integral/CDN/cold-start pendientes |
| URL pública antigua / sign individual-lote arbitrario / listado | Pública deja de funcionar tras corte; firmas nativas cliente denegadas | URL pública de objeto existente y firma nativa individual del dueño denegadas en staging; lote/listado adicional pendiente |
| Firma válida / TTL / despublicación / navegación lenta | URL expira; no nueva firma oculta; recarga autorizada repone | SDK TTL simulado; interacción real/expiración pendiente |
| Upload real WebP / corrupto / MIME falso / SVG / grande / overwrite / rutas / cuotas | Servidor rechaza; propiedad no cambia; bucket refuerza límites | Bytes y SQL; HTTP real pendiente |
| Galería hasta siete + portada / octava / duplicados / race | Siete totales, sin portada extra; triggers y RPC lo impiden | Siete uploads WebP HTTP, galería y octava rechazada mediante RPC/JWT reales; concurrencia multi-sesión pendiente |
| Publicar/editar/rechazo/moderar/borrar; fallos intermedios | Estado correcto; edición/bitácora/notificación completas o rollback; borrador informado | SQL y código; navegador/red reales pendientes |
| Doble submit e interés/oportunidad duplicados | No duplicados; idempotencia/conflicto; cuotas | SQL; índices/datos activos por verificar |
| Inventario/ficha/catálogo/admin/editor/notificaciones | Fotos/links/títulos siguen; ocultos no entregan dirección/contacto | Build/contrato; UI real pendiente |
| PDF hasta siete WebP / NULL / fallo firma / archivo grande | Fotos incrustadas; no PII oculta ni fetch externo; tiempo/payload válidos | PDF real Netlify 200 con siete WebP distintos convertidos e incrustados; casos límite/tamaños máximos pendientes |
| Avatar propio / ajeno / sustituir / suspendido | Sólo upload propio validado; público por diseño; limpieza segura | Bytes/SQL; Storage real pendiente |
| Chrome/Safari, escritorio/móvil real, lightbox | Flujos críticos completos; sin rondas cosméticas | NO verificado |
| Secrets / previews / logs / backup y restauración | Ningún secreto/PII expuesto; previews aislados; recuperación comprobada | Inspección local; historial/proveedor/restore pendientes |
| Smoke final integral | Registro → publicación → moderación → inventario → contacto → autorización → notificación → PDF → editar/rechazo → suspensión/reactivación | BLOQUEANTE, pendiente deployment real |

Recuperación/cambio de contraseña no se ofrece en las rutas inspeccionadas; no se agrega como nueva funcionalidad. Textos legales siguen provisionales: revisión antes de lanzamiento público; evaluación fuera del alcance técnico, no afirmar cumplimiento legal.

<details>
<summary>Registro histórico de diagnóstico/diseño anteriores (no instrucciones ni estado vigente)</summary>

## Estado vigente de implementación de AUD-002 — 2026-10-03

**ALTO / EN REVISIÓN — NO CORREGIDO. NO desplegar este corte ni aplicar 044/045 todavía.**

El usuario autorizó implementar la opción B y después reforzar pertenencia de rutas y lectura pública sin abrir perfiles. Se completó la adaptación local de las superficies y las pruebas descritas abajo. El trabajo se detuvo al descubrir un riesgo adicional del diseño de firma, conforme a la regla expresa del usuario. No se ejecutó SQL contra Supabase, no se privatizó el bucket ni se modificaron datos reales. La implementación depende de una columna que aún no está aplicada en ese entorno.

### Nuevo bloqueo: AUD-002-SIGN — ALTO — emisión directa fuera del servidor

**Confirmado en el diseño local y en código fuente del proveedor; NO reproducido en Supabase activo.**

- Archivo: `supabase/migrations/045_make_property_images_private.sql`, policy `public can read published property images` y función `qrih_can_read_property_image`.
- El borrador permite SELECT para imágenes publicadas con cuenta activa, mediante la clave pública/rol anónimo. La policy no distingue lectura de operación de firma ni limita el parámetro de expiración.
- La utilidad `lib/property-image-urls.ts` es server-only y limita sus llamadas a 300/600/900 segundos. Eso limita al código de QRIH, **no al endpoint nativo de Storage**. Un cliente puede saltarse la utilidad y pedir firmas de una ruta actualmente pública.
- El SDK instalado envía `expiresIn` proporcionado por el llamador. El código fuente público de Storage comprueba acceso al objeto y firma con ese plazo; no impone el TTL de QRIH. La URL firmada conserva su autorización hasta vencimiento. Por tanto la ventana posterior a pausa/rechazo/suspensión podría superar los 15 minutos previstos.
- Esto no permite firmar una imagen que ya sea privada al solicitarla ni es prueba de una intrusión real; invalida la garantía de emisión exclusivamente en servidor/TTL controlado del diseño actual.
- Fuentes primarias consultadas: [rutas de firma individual](https://github.com/supabase/storage/blob/master/src/http/routes/object/getSignedURL.ts), [firma en lote](https://github.com/supabase/storage/blob/master/src/http/routes/object/getSignedURLs.ts), [autorización y firma del objeto](https://github.com/supabase/storage/blob/master/src/storage/object.ts), [validación de expiración](https://github.com/supabase/storage/blob/master/src/internal/auth/jwt.ts). La versión desplegada del proveedor no fue verificada.

**Propuesta pendiente de autorización:** separar permiso de lectura de permiso de emisión. Evaluar bloqueo de `object.sign`/`object.sign_many` (nombres exactos por verificar) para clientes públicos y sesiones mediante helpers de operación soportados en el entorno, y emitir sólo en servidor con credencial privada. Antes de usar una credencial que omite RLS, comprobar propiedad/actor/estado con el cliente no privilegiado, seleccionar rutas desde BD, verificar pertenencia y firmar sólo ese conjunto con TTL fijo. No crear un endpoint que acepte rutas arbitrarias. Preservar SELECT necesario para limpieza y lectura propia de historial. Esta alternativa añade una credencial exclusivamente de servidor y **no se implementó**. Requiere comprobar helpers disponibles, aislamiento del secreto y volver a probar permisos. No guardar el secreto ni firmas en documentos.

### Ajustes previamente autorizados: implementados y comprobados localmente

1. `044_add_property_main_image_path.sql` añade el campo transitorio, conserva `main_image` y exige origen HTTPS exacto, ruta canónica, objeto real con `owner_id` coincidente y fila de galería correspondiente. Cualquier excepción aborta toda la transacción; NULL permanece NULL. URLs externas, codificadas, antiguas de otro origen o sin galería no se fuerzan.
2. Triggers de 044 cubren INSERT/UPDATE directos y RPC: validan pertenencia de portada/galería, objeto existente, duplicados y máximo de siete referencias; bloquean la fila de propiedad al escribir galería. La concurrencia real entre sesiones sigue pendiente de prueba.
3. 045 comprueba visibilidad mediante funciones booleanas SECURITY DEFINER de búsqueda fija, sin publicar perfiles. Reversiona las policies públicas 029/030 y el catálogo de asesores; incluye `main_image_path` en auditoría de reenvío.
4. Vistas públicas usan cliente anónimo sólo de servidor, sin cookies ni elevación por navegar como propietario/admin. Son dinámicas y no cachean consultas/firmas persistentemente.
5. Storage SELECT comprueba objeto/ruta/propiedad y actor; admin sólo referencias asociadas. El propietario conserva lectura de objetos propios, incluso huérfanos y estando suspendido, para historial y limpieza. Esta excepción es necesaria porque edición/borrado limpian archivos **después** de retirar referencias; no abre objetos ajenos. Suspensión sigue impidiendo upload/delete y modificación.
6. RLS restrictiva adicional limita lectura/borrado; no se habilita UPDATE/upsert/move. Upload existente 032 mantiene cuenta activa/carpeta/extensión. MIME y tamaño efectivos del bucket **NO VERIFICADOS**: el repositorio no demuestra sus valores activos. No se cambiaron optimizador ni restricciones actuales de UI/API.
7. Se eliminó `getPublicUrl` de los consumidores activos de `property-images`; `profile-images`, datos demo sin consumidores y respaldos históricos quedaron intactos. No hay fallback de presentación a URL pública/externa. `main_image` sigue existiendo; la prop homónima de tarjeta es sólo una URL efímera de presentación, nunca persistida.

### Archivos adaptados y trazabilidad

| Archivo | Cambio local | Validación |
|---|---|---|
| `app/publicar/page.tsx` | Upload igual; persiste `main_image_path`, sin construir URL pública. | Build; flujo real pendiente. |
| `app/api/editar-propiedad/route.ts` | Rutas persistentes para portada/galería; conserva validación de dueño/estado y limpieza API. | Build; RLS/RPC aisladas; HTTP real pendiente. |
| `app/page.tsx`, `app/inventario/page.tsx` | Cliente público sin sesión; firma portada en servidor. | Build; test de contrato estático. |
| `app/bodegas/[slug]/page.tsx` | Firma portada/galería, conserva títulos y deduplica. | Build; utilidad probada; navegador pendiente. |
| `app/asesor/[public_id]/page.tsx` | Catálogo devuelve ruta; servidor firma para tarjeta. | Build; RPC ejecutada en fixture. |
| `app/admin/[id]/page.tsx` | Firma de portada/galería; reemplaza URL libre por selección de imagen de galería, manteniendo reautenticación. | Build; roles BD aislados; UI pendiente. |
| `app/mis-propiedades/[id]/editar/page.tsx` | Firma galería propia; sólo editor autorizado recibe rutas para sus cambios. | Build; utilidad/RLS aisladas. |
| `app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx` | Retira únicamente el campo de tipo `main_image` no utilizado. | Types/build. |
| `app/api/bodegas/[slug]/pdf/route.tsx` | Firma justo antes de render; no recupera URLs externas persistidas; deduplica principal. | Build; generación PDF real pendiente. |
| `lib/property-image-urls.ts` | server-only, lote/deduplicación/TTL fijo; errores globales/parciales no recurren a URL pública ni exponen detalle privado. | 6 pruebas unitarias/de contrato. |
| `lib/supabase-public-server.ts` | Cliente anónimo server-only sin sesión ni cache persistente. | Build y contrato estático. |
| `supabase/migrations/044_add_property_main_image_path.sql` | Columna, backfill seguro y triggers de rutas/límite. | Ejecutada sobre fixtures PostgreSQL; no datos reales. |
| `supabase/migrations/045_make_property_images_private.sql` | RLS/booleans/catálogo/bitácora, **bloqueada por AUD-002-SIGN**. | Ejecutada en fixture; no satisface aún emisión exclusiva de servidor. |
| `supabase/checks/aud002_preflight.sql` | Conteos de sólo lectura, excepciones por ID, bucket y policies. | Ejecutado en fixture; conteos reales pendientes. |
| `tests/aud002-images.test.mjs`, `tests/aud002-rls.test.mjs` | Pruebas reproducibles sin credenciales reales. | Pasan; límites del fixture abajo. |

Sin modificación: `ImageUploader`, `PropertyImageEditor`, `PropertyImageGallery`, `PropertyCard`, `lib/image-optimizer.ts`, ruta de eliminar propiedad, listado admin y mis-propiedades (no consumen imágenes), avatares y migraciones 001–043. No se agregaron funcionalidades.

### Validación local ejecutada y límites

- `npm run build`: **PASA** después de todos los cambios funcionales de este corte; todas las superficies de firma son dinámicas.
- `npx --no-install tsc --noEmit`: **PASA**.
- `npm run lint`: **NO EJECUTABLE**. El script heredado llama `next lint`, inexistente en Next instalado. No se cambió package.json ni se añadió linter; no afirmar lint exitoso.
- `node --test tests/aud002-images.test.mjs`: **6/6 PASAN** (SDK simulado, no firmas reales).
- `tests/aud002-rls.test.mjs`: **11/11 casos internos PASAN** en PostgreSQL aislado PGlite (12 pruebas informadas contando el contenedor). Usa migraciones reales 001/002/014/023/029/030, secciones 1–4 de 032, 033/039/040 y 044/045; fixture mínimo para columnas/roles/esquema de Storage y policy de lectura admin. **No ejecuta toda la cadena 001–043 ni el servicio HTTP de Supabase Storage.**
- El motor de pruebas se instaló temporalmente fuera del proyecto de producto; no se cambiaron sus dependencias. Para reproducir, instalar PGlite en un directorio de pruebas y ejecutar `QRIH_PGLITE_MODULE=/ruta/a/@electric-sql/pglite/dist/index.js node --test tests/aud002-rls.test.mjs`.
- No se usó `.env` ni red en estas pruebas. Los registros de Storage de fixture son sintéticos en memoria, sin archivos reales ni llamadas al proveedor.
- No se comprobaron imagen descargada, expiración real, URL pública antigua, navegador, Netlify, PDF renderizado con fotos reales, MIME/tamaño del bucket, ni concurrencia entre sesiones.

### Matriz de pruebas — evidencia de este corte

| Caso | Evidencia actual | Prueba externa pendiente |
|---|---|---|
| `draft/pending/rejected/paused/expired/pending_update` público | SELECT denegado en fixture para todos los estados. | Storage HTTP y vistas. |
| `published` + cuenta activa | SELECT permitido y perfiles privados en fixture. | Firma/imagen visible en todas las superficies. |
| Suspendido/publicaciones deshabilitadas | Público denegado; dueño conserva lectura, no upload/delete en fixture. | UI/Storage y reactivación. |
| Admin/dueño/asesor ajeno | Lectura según permisos en fixture; contacto no amplía privacidad. | Sesiones reales y manipulación HTTP. |
| Rutas/IDs ajenos | INSERT/UPDATE de galería, portada y RPC rechazados en fixture. | Ataques vía cliente nativo/HTTP. |
| 7 fotos / octava / duplicada / objeto inexistente | Validación BD/RPC pasa en fixture. | UI, concurrencia y Storage real. |
| Upload WebP | Carpeta/extensión/cuenta cubiertas por RLS de fixture. | Archivo real, MIME/tamaño y optimización. |
| Editar/reordenar/portada | RPC y auditoría `main_image_path` probadas en fixture. | Formulario completo, reemplazo, cleanup/rollback. |
| Eliminar | Lectura/delete propios tras borrar referencias probados en fixture. | API de eliminación y fallos parciales. |
| Catálogo | Sólo published y ruta persistente; no main_image en JSON. | Tarjetas/imágenes reales. |
| Portada/inventario/ficha/galería/admin | Build y contrato; utilidad de firma probada con mock. | Navegador, móvil/lightbox, recarga tras TTL. |
| PDF | Compila; rutas externas ya no pasan a Image. | Generación real con hasta siete WebP y fallo de firma. |
| URL pública antigua | NO VERIFICADO; bucket activo sin cambios. | Debe fallar tras corte privado (considerar cachés previas). |
| Firma válida/expirada/revocación | Mock valida TTL de utilidad, no comportamiento remoto. | Descargar antes/después de TTL; ocultar/suspender impide nueva firma. |
| Firma directa con plazo arbitrario | **Bloqueo de diseño descubierto.** | Solicitud directa de larga duración debe quedar denegada tras solución autorizada. |
| Backfill/NULL/origen inesperado | Convertible y NULL correctos; excepción aborta sin perder legado en fixture. | Conteos y revisión de cada excepción real; no forzar. |

### Secuencia de corte prevista — suspendida hasta resolver AUD-002-SIGN

La última migración previa real es **043**; se crearon **044 y 045**, no las cuatro migraciones tentativas del diseño histórico. La descripción de 046/047 más abajo es histórica, no archivos nuevos.

1. Resolver/autorizar el bloqueo de emisión y repetir pruebas. No desplegar código que depende de columna inexistente.
2. En staging, inventariar configuración/policies y ejecutar preflight de sólo lectura con origen exacto; obtener los cinco conteos pedidos y revisar ownership/galerías. Cualquier excepción exige detenerse, conservar datos y decidir tratamiento.
3. Aplicar 044/045 revisadas sólo tras pasar esa puerta y comprobar que la cadena previa aplicada coincide con el repositorio.
4. Coordinar deploy de código completo y privatización usando **Storage API `getBucket/updateBucket`**, conservando explícitamente `allowedMimeTypes` y `fileSizeLimit` obtenidos antes. No ejecutar UPDATE/INSERT/DELETE SQL sobre tablas internas de Storage.
5. Ejecutar toda la matriz en staging y luego en el deployment exacto; comprobar URL antigua y firma expirada. Durante el corte no abrir acceso público hasta completar permisos/bucket/código.
6. Reversión de código/datos es posible porque main_image no se elimina; **no volver público el bucket como rollback automático**, pues reabre la exposición. Ante fallos mantener privado o en mantenimiento.

Fuentes: [esquema de Storage, tablas de sólo lectura](https://supabase.com/docs/guides/storage/schema/design), [RLS y separación por operación](https://supabase.com/docs/guides/storage/security/access-control), [ownership](https://supabase.com/docs/guides/storage/security/ownership).

**Dictamen vigente: NO-GO. AUD-002 no puede marcarse CORREGIDO — PENDIENTE DE VALIDACIÓN EXTERNA:** falta resolver una barrera local de seguridad, además de validación remota y lint no ejecutable. La sección anterior de detención por pertenencia/lectura pública queda reemplazada por este corte; el inventario y diseño históricos siguientes se conservan como registro y no demuestran el estado activo.

**Fecha:** 2026-10-03. **Alcance:** código, migraciones y configuración local. Se modificó código exclusivamente para AUD-002. Las migraciones sólo se ejecutaron en fixtures en memoria, no en Supabase/Netlify/datos reales.  
**Verificación ejecutada:** build, tipos y pruebas aisladas pasan; ver alcance y bloqueo vigente arriba. Lint no ejecutable con el script heredado.

## Dictamen: NO-GO condicionado

No abrir a usuarios reales hasta resolver AUD-001 y AUD-002 y comprobar el estado activo de Supabase/Netlify. Compilar correctamente no demuestra que el registro productivo, RLS y la privacidad de Storage estén operando como se espera.

## Hallazgos confirmados

| ID | Severidad | Área | Hallazgo e impacto | Corrección mínima requerida |
|---|---|---|---|---|
| AUD-001 | **CRÍTICO** | Auth / producción | **Código corregido, validación externa pendiente.** El callback ahora se construye desde `window.location.origin`; antes estaba fijado a localhost. Sin configurar los dominios de staging/producción en las Redirect URLs de Supabase Auth, el registro real aún puede fallar. | Configurar las Redirect URLs de Supabase Auth y probar alta+confirmación reales en staging y producción. |
| AUD-002 | **ALTO** | Storage / privacidad | La migración 001 crea `property-images` con `public = true`; el código emite `getPublicUrl`. RLS sobre `property_images` no revoca una URL pública ya entregada. Fotos de borradores, rechazadas, pausadas o suspendidas pueden permanecer accesibles con la URL. | Usar bucket privado y URLs firmadas sólo tras autorización, o un control equivalente. Probar publicación, despublicación, suspensión y borrador. |
| AUD-003 | **MEDIO** | Datos / abuso | `property_views` permite `INSERT` a `public` con `WITH CHECK (true)` (013); no se observan rate limits, deduplicación ni CAPTCHA para vistas, contactos o requerimientos. Permite inflar métricas y spam/costo operativo. | Aplicar limitación mínima en borde/backend o desactivar métricas no confiables; revisar límites y monitoreo. |
| AUD-004 | **MEDIO** | Auth / redirecciones | Login y registro toman `next` de query y redirigen sin allowlist (`app/login/page.tsx`, `app/registro/page.tsx`). Riesgo de redirección no deseada tras autenticación. | Aceptar sólo rutas internas que comiencen con una única `/`; rechazar URL absoluta/protocolo. |
| AUD-005 | **MEDIO** | Storage / avatares | `profile-images` es público (020) y su policy no valida extensión/MIME/tamaño; los controles del navegador no son una frontera de seguridad. Objetos arbitrarios propios pueden quedar expuestos y huérfanos. | Restringir tipo/tamaño en servidor/policy, definir privacidad explícita y limpiar avatar anterior de forma segura. |
| AUD-006 | **MEDIO** | PDF / servidor | **Mitigado en código local como parte de AUD-002; pendiente de validación externa.** El PDF ya no usa URLs externas de main_image; sólo firmas obtenidas de rutas autorizadas del bucket fijo. | Probar render real, fallos de firma y fuente interna después de resolver/aplicar AUD-002. |
| AUD-007 | **BAJO** | Consistencia | Borrado/edición distribuyen cambios entre Storage, tablas y propiedad; hay ramas que devuelven éxito con advertencia cuando no se limpian objetos. Posibles huérfanos. | Proceso recuperable de limpieza y registro/alerta de errores. |
| AUD-008 | **BAJO** | Calidad | Ya hay tests propios aislados para AUD-002; todavía no hay CI/configuración versionada de Netlify ni cobertura HTTP/UI completa. Build no demuestra permisos remotos. El script de lint heredado no funciona. | Matriz externa reproducible; resolver herramienta de lint en una tarea autorizada, no ampliar ahora AUD-002. |
| AUD-009 | **COSMÉTICO** | Higiene | Hay `.bak`/`.backup`, `app.js`/`index.html` de legado y documentación histórica contradictoria. | Inventariar y archivar después del lanzamiento, sin borrar artefactos sin identificar consumidores. |

## Controles positivos observados

- Rutas sensibles revisadas autentican con `supabase.auth.getUser()` en servidor.
- Server actions de moderación vuelven a comprobar el rol `admin`.
- Edición/eliminación validan dueño y estado; las migraciones también pretenden reforzarlo por RLS.
- Las funciones `SECURITY DEFINER` revisadas fijan `search_path` a `public` y varias comprueban usuario/rol/estado.
- La entrega de contacto requiere propiedad publicada, solicitante distinto y autorización aprobada.

Son controles **confirmados en código local**, no prueba de que sus definiciones activas en Supabase sean idénticas.

## No verificable desde el repositorio

| Tema | Evidencia necesaria |
|---|---|
| Policies, funciones, triggers y buckets activos | Consultas de sólo lectura/export de catálogo y comparación con migraciones 001–043. |
| Variables, dominio, logs y despliegue Netlify | Inventario sin valores de variables, contexto de deploy y logs del staging. |
| URLs permitidas de Auth / cookies | Site URL y Redirect URLs; alta, confirmación, login, refresh y logout reales. |
| Storage efectivo | Policies/buckets activos y prueba de URL directa antes/después de cambios de estado. |
| Límites, backup, alertas | Configuración operativa de los proveedores. |

## Matriz mínima antes de GO

| Actor | Casos mínimos |
|---|---|
| Público | Inventario/ficha/PDF, URL directa de imagen, contacto exige login. |
| Usuario nuevo | Registro, email, confirmación en dominio real, perfil y login. |
| Publicador | Borrador, pendiente, imágenes, rechazada, eliminación propia. |
| Asesor | Requerimiento, interés, oportunidad propia, contacto y autorización. |
| Propietario | Solicitudes propias y bloqueo de IDs ajenos. |
| Admin | Moderación, bitácora, verificar/suspender/reactivar. |
| Suspendido | Bloqueo de publicar/editar/eliminar/subir/autorizar/oportunidad y ocultamiento público. |

## Método y límites

- Se revisaron rutas, componentes relevantes, clientes Supabase y migraciones 001–043.
- El build fue la única ejecución productiva disponible y completó sin errores.
- Los hallazgos se sincronizan con `PROJECT_STATUS.md`, `QRIH_FUNCTIONAL_INDEX.md` y `NEXT_STEPS.md`.

---

## AUD-002 — Storage / privacidad: inventario técnico

**Estado: EN REVISIÓN — NO CORREGIDO TODAVÍA.**  
**Corte adicional:** 2026-10-03. Esta sección es sólo auditoría estática: no se modificaron bucket, RLS, migraciones, datos ni código funcional.

### Conclusión conceptual

**Sí. Si el bucket activo conserva la configuración versionada (`public = true`), una imagen de una propiedad no publicada puede ser accesible directamente por su URL pública de Storage.** Las políticas sobre la tabla `public.property_images` controlan la lectura de la referencia en PostgreSQL, no el acceso al objeto mediante una ruta pública ya conocida. Las rutas se almacenan con el patrón predecible `usuario-uuid/<timestamp>-<n>-<archivo>.webp`, y el código materializa esas rutas con `getPublicUrl`.

No se realizó una petición contra Storage: que la configuración desplegada sea idéntica al SQL local sigue siendo `NO VERIFICADO`.

### Hallazgo estructural: dos representaciones de la imagen principal

- `properties.main_image` guarda una **URL pública completa**. La asignan publicación y edición.
- `property_images.storage_path` guarda una **ruta relativa del objeto** y la galería vuelve a generar una URL pública al presentar.
- La primera imagen de `property_images` es además la imagen principal lógica (`position = 0`, `category = main`), pero `main_image` se presenta por separado. Esto implica que privatizar el bucket rompe ambos caminos y que una URL firmada no debe persistirse en `main_image`, porque expira.

### Inventario de referencias ejecutables

| Archivo y línea aprox. | Uso actual | ¿URL pública? | ¿Debe funcionar sin sesión? / estado permitido | Dependencia | Impacto al privatizar | Alternativa mínima para bucket privado |
|---|---|---|---|---|---|---|
| `app/publicar/page.tsx:196–210,259,281–286` | Sube WebP a `property-images`, llama `getPublicUrl`, guarda esa URL en `main_image` y rutas en RPC `replace_property_images`. | Sí, genera y persiste `main_image`. | No; creador autenticado. Aplica a `draft` y `pending` antes de moderación. | Ambos. | Alto: `getPublicUrl` deja de servir; no puede guardarse una URL firmada como dato permanente. | Mantener sólo `storage_path` estable y obtener URL firmada para previsualización; derivar principal desde la primera ruta. |
| `app/api/editar-propiedad/route.ts:297–355,358–436` | Limpia cargas fallidas, sube nuevos objetos, genera URL pública, reemplaza referencias y actualiza `main_image`; elimina objetos retirados. | Sí, líneas 331–355. | No; dueño activo de `draft`/`rejected`. | Ambos. | Alto: edición y la actualización de principal fallan visualmente/datos. | Conservar upload/remove; reemplazar persistencia de URL por ruta y crear URLs firmadas sólo para respuesta/vista autorizada. |
| `app/mis-propiedades/[id]/editar/page.tsx:71–88` | Lee `property_images`, transforma cada `storage_path` a URL para el editor. | Sí, línea 85. | No; dueño autenticado, cualquier estado propio. | `property_images`. | Alto: las miniaturas existentes no cargarán. | Firmar las rutas en servidor después de que RLS autorice la lectura. |
| `components/PropertyImageEditor.tsx:10–50,278–280` | Renderiza URLs recibidas de imágenes existentes y `blob:` de imágenes nuevas; no llama Storage. | No genera; consume URL. | No; formulario de edición. | Recibe `storage_path` y URL. | Medio: depende de que la página entregue URLs firmadas válidas. | No cambiar componente salvo recibir URL firmada efímera. |
| `app/bodegas/[slug]/page.tsx:79–94,160–163` | Ficha pública: lee galería y convierte rutas secundarias a URL; usa `main_image` como primera. | Sí, línea 92 y `main_image` ya pública. | Sí; sólo `published`, propietario activo y publicaciones habilitadas. | Ambos. | Crítico funcional: ficha/galería pública deja de mostrar imágenes. | Firmar en servidor las rutas tras consulta pública autorizada; construir también principal desde ruta, no desde URL persistida. |
| `app/api/bodegas/[slug]/pdf/route.tsx:445–485` | PDF público: lee galería, usa `main_image` y URLs públicas de secundarias como fuentes de `@react-pdf/renderer`. | Sí, línea 483 y `main_image`. | Sí; misma condición pública de propiedad publicada/activa/habilitada. | Ambos. | Crítico funcional: PDF pierde imágenes; las URLs firmadas deben durar durante la generación. | Firmar rutas en el Route Handler con TTL breve suficiente para renderizar; no guardar la firma. |
| `app/admin/[id]/page.tsx:461–465,640–663,1407–1412` | Admin ve `main_image`, galería con URL pública y puede editar manualmente la URL de `main_image`. | Sí, línea 661; consume URL en 642. | No; admin, todos los estados. | Ambos. | Alto: vista admin se rompe y el campo libre permite seguir guardando URLs externas/públicas. | Firmar rutas en servidor para galería/principal; tratar `main_image` como ruta derivada o restringirlo a una ruta validada en un cambio posterior explícito. |
| `components/PropertyImageGallery.tsx:5–8,54–62,102` | Galería reutilizable y lightbox; recibe URLs y las pinta. | No genera; consume URL. | Público o admin según quien entregue datos. | Agnóstico. | Medio: depende de firmas válidas durante la interacción. | Entregar URLs firmadas con TTL que cubra la sesión de visualización. |
| `components/PropertyCard.tsx:14,23–25` | Tarjeta usa `main_image` en `background-image`. | Consume URL pública persistida. | Sí para tarjetas públicas. | `main_image`. | Alto: portada, inventario y catálogo pierden miniatura. | Resolver URL firmada antes de pasar la propiedad a la tarjeta, o adoptar una representación estable de ruta principal. |
| `app/page.tsx:26–30` | Portada consulta propiedades publicadas y pasa `main_image` a tarjetas. | No genera; expone URL almacenada. | Sí; sólo `published`, activo y habilitado. | `main_image`. | Alto: portada sin imágenes. | Incluir/derivar ruta principal y firmar en servidor por cada propiedad publicada. |
| `app/inventario/page.tsx:29–34,107–116` | Inventario consulta propiedades publicadas y pasa `main_image` a tarjetas. | No genera; consume URL almacenada. | Sí; sólo `published`, activo y habilitado. | `main_image`. | Alto: inventario sin imágenes. | Igual que portada: firmar rutas tras lectura autorizada. |
| `app/asesor/[public_id]/page.tsx:57–59,200–204` | Catálogo público recibe `main_image` dentro de RPC `get_advisor_catalog` y lo entrega a tarjetas. | No genera; consume URL almacenada. | Sí; RPC limita a publicador activo/habilitado y propiedades publicadas según migración 028. | `main_image`. | Alto: catálogo público sin imágenes. | Hacer que la RPC/servidor entregue rutas, luego firmarlas por petición; no devolver firmas persistentes. |
| `supabase/migrations/024_add_verified_to_advisor_catalog.sql:20–39` y `028_hide_suspended_advisor_catalogs.sql:20–43` | Función `get_advisor_catalog` incluye `main_image` en JSON público. | No crea URL, pero distribuye la almacenada. | Sí; publicado, y en 028 perfil activo/habilitado. | `main_image`. | Alto: la RPC mantiene una representación incompatible si se guarda URL pública. | Devolver ruta principal estable o resolver la firma fuera de la RPC. |
| `app/api/eliminar-propiedad/route.ts:80–97,124–143` | Lee `storage_path` y elimina los objetos después de borrar propiedad. | No. | No; dueño activo. | `property_images`. | Bajo: `remove` sigue siendo válido si se mantienen policies de delete. | Mantener la ruta y policy de delete; verificar que el cambio de privacidad no altere autorización. |
| `lib/image-optimizer.ts`, `components/ImageUploader.tsx` | Valida/optimiza archivos y usa `blob:` sólo para preview local. | No. | No; antes de upload. | Ninguna URL remota. | Ninguno directo. | Sin cambio para privacidad del bucket. |
| `lib/data.ts:1–6` | Datos demo con `main_image` externo de Unsplash. | Sí, pero no es Supabase Storage. | Sólo fallback/demo. | `main_image`. | Bajo para bucket, pero no se beneficia de firmas. | Mantener explícitamente como demo o excluirlo del flujo real. |

### Referencias revisadas sin función de URL de Storage

- `app/admin/page.tsx` no materializa ni presenta imágenes de propiedad en la lista principal.
- No hay llamadas ejecutables a `createSignedUrl`, `createSignedUrls` o `.download()` en el proyecto; tampoco se detectó helper central de URLs de imágenes.
- `components/ProfileAvatarForm.tsx:52–75` usa upload y `getPublicUrl`, pero corresponde al bucket distinto `profile-images`; queda fuera del cambio de `property-images` y de AUD-002.
- Archivos `.bak`/`.backup` contienen copias históricas de algunos usos y no forman parte de la superficie ejecutable revisada.

### Migraciones y políticas relacionadas

| Migración | Efecto relevante |
|---|---|
| `001_qrih_schema.sql:25,31,38–39` | Crea `property_images`, activa RLS de tabla, crea bucket `property-images` con **`public = true`** y policy inicial de upload por carpeta de usuario. |
| `014_property_images_policies.sql:3–52` | Reemplaza upload por WebP/carpeta propia; crea lectura pública de referencias para propiedad `published`, manejo del dueño y manejo admin sobre `property_images`. No cambia privacidad del bucket. |
| `015_save_property_images_function.sql:4–64` | Crea RPC `replace_property_images` con `SECURITY DEFINER`: dueño, 1–7 rutas WebP con prefijo propio; guarda rutas, no URLs. |
| `016_fix_gallery_paths_and_titles.sql:2–66` | Añade título y sustituye la RPC; mantiene rutas. |
| `017_property_images_read_policies.sql:3–34` | Separa lecturas: público publicado, dueño propio, admin. No cambia Storage público. |
| `030_public_property_images_visibility.sql:3–20` | Endurece sólo la lectura de la tabla para exigir publicada + dueño activo + publicaciones habilitadas. No cambia Storage público. |
| `032_block_suspended_account_operations.sql:71–221` | Limita manejo/lectura de tabla para dueño suspendido, endurece upload Storage para cuenta activa y reversiona RPC. No crea policy de lectura de `storage.objects` ni cambia `public = true`. |
| `033_allow_active_owner_property_cleanup.sql:35–51` | Añade delete de `storage.objects` por carpeta propia/cuenta activa. |
| `024_add_verified_to_advisor_catalog.sql` y `028_hide_suspended_advisor_catalogs.sql` | Exponen `main_image` mediante catálogo público; 028 incluye las condiciones de cuenta activa/publicaciones habilitadas. |
| `039_audit_property_resubmission.sql:91–92` | Sólo audita cambios a `main_image`. |

**Políticas finales previstas por el SQL local:**

- Tabla `property_images`: lectura pública sólo si la propiedad está publicada, el dueño activo y publicaciones habilitadas (030); dueño puede leer propias incluso suspendido (032); admin puede leer todas (017); manejo del dueño requiere cuenta activa (032); admin puede manejar todas (014).
- `storage.objects` para `property-images`: upload de WebP sólo en carpeta propia y con cuenta activa (032); delete sólo en carpeta propia y activa (033).
- No hay una policy versionada de lectura de `storage.objects` para este bucket porque el bucket fue creado público. Si se vuelve privado, habrá que diseñar explícitamente el mecanismo de lectura autorizado.

### Flujo actual de extremo a extremo

1. `ImageUploader`/`PropertyImageEditor` optimizan localmente a WebP y muestran `blob:` previews.
2. Publicar carga directamente desde navegador a `property-images/<user-id>/...webp`, obtiene `getPublicUrl`, guarda esa URL en `properties.main_image` y llama `replace_property_images` con rutas.
3. Editar carga por Route Handler, reconstruye la misma URL pública, reemplaza las rutas de galería y actualiza `main_image`; después intenta eliminar objetos retirados.
4. Portada, inventario y catálogo público muestran el `main_image` persistido mediante `PropertyCard`.
5. Ficha pública, PDF y admin leen `property_images.storage_path` y convierten rutas a `getPublicUrl`; ficha/PDF/admin también consumen `main_image` como primera imagen.
6. Eliminar propiedad lee rutas de `property_images`, borra DB y luego intenta borrar objetos Storage.

### Puntos que se romperían con bucket privado

1. Las llamadas a `getPublicUrl` no entregarían recursos accesibles: publicar, editar, edición de propietario, ficha pública, PDF y galería admin.
2. Todos los consumidores de `main_image` persistido dejarían de cargar: portada, inventario, catálogo público, ficha pública, PDF, admin y tarjetas.
3. La administración permite editar `main_image` como URL libre; conservar ese comportamiento impediría tratar la ruta de Storage como fuente confiable y estable.
4. Las URLs firmadas expiran: no se pueden almacenar en `main_image`, reutilizar desde registros existentes ni cachear como si fueran permanentes.
5. Un TTL demasiado corto puede romper lightbox/PDF; uno demasiado largo reduce el beneficio de privacidad.
6. Las URLs públicas históricas continuarán funcionando mientras el bucket siga público; cambiarlo a privado corta acceso a esas URLs, pero debe validarse en el bucket activo.

### Propuesta técnica mínima — no implementada

1. Cambiar `property-images` a privado mediante migración/operación explícita y comprobar primero el bucket activo.
2. Definir `property_images.storage_path` como fuente persistente; derivar la imagen principal de la fila con `position = 0` en vez de persistir una URL temporal en `main_image`.
3. Añadir una única utilidad de servidor para firmar rutas después de que cada consulta/RLS haya autorizado la propiedad; usarla para ficha pública, PDF, admin y edición del dueño. Las rutas públicas sólo deben firmarse cuando estado/rol lo permitan.
4. Adaptar publicar y editar para almacenar sólo rutas y obtener una URL firmada sólo para la respuesta o vista inmediata.
5. Mantener upload/remove y sus policies actuales, salvo los cambios estrictamente necesarios para lectura privada.

Esto no agrega funcionalidad de usuario ni cambia el modelo de negocio; reemplaza el mecanismo de entrega de imágenes para que la visibilidad de objetos coincida con las reglas ya previstas para las referencias.

### Pruebas obligatorias después del cambio

1. Público anónimo: ve imágenes de una propiedad `published`, activa y habilitada en portada, inventario, ficha, lightbox, catálogo y PDF.
2. Público anónimo: no puede consultar tabla ni abrir URL de objeto de propiedades `draft`, `pending`, `rejected`, `paused`, `expired`, suspendidas o con publicaciones deshabilitadas.
3. Propietario activo: puede previsualizar, subir, editar, reordenar y eliminar imágenes propias de borrador/rechazada; no puede hacerlo en propiedad ajena.
4. Admin: puede ver galería y principal de propiedades de todos los estados; moderación sigue funcionando.
5. Cuenta suspendida: conserva únicamente la lectura de historial prevista, no puede subir, reemplazar ni eliminar; sus imágenes no se entregan a público.
6. Firma: una URL firmada válida carga; después del TTL falla; una nueva vista autorizada recibe firma nueva.
7. Edición y eliminación: fallo de upload/reemplazo/delete no deja referencias u objetos inesperados; comprobar recuperación existente.
8. PDF: se genera con principal y galería, antes de que expiren firmas, sin incluir imágenes no autorizadas.
9. Regresión: build de producción, registro, tarjetas, galería móvil, y propiedades sin imágenes conservan sus estados de fallback.

---

## AUD-002 — Diseño de corrección: bucket privado + URLs firmadas

**Estado: ALTO / EN REVISIÓN — NO CORREGIDO TODAVÍA.**  
**Corte de diseño:** 2026-10-03. No se crearon ni ejecutaron migraciones; no se cambiaron Storage, RLS, datos, configuración ni código funcional.

### Principios no negociables

1. `storage_path` (una ruta relativa) es persistente; una URL firmada es una credencial temporal de transporte y **nunca** se guarda en PostgreSQL.
2. La autorización debe ocurrir antes de firmar y repetir las condiciones de visibilidad actuales: estado de la propiedad, estado de cuenta, publicaciones habilitadas y rol/propiedad.
3. El bucket privado impide el endpoint público de objetos; no sustituye las policies de tabla ni las policies de `storage.objects`.
4. Upload, optimización WebP, prefijo por usuario, límite de siete y limpieza de objetos conservan su comportamiento actual.
5. No se debe privatizar el bucket hasta que la versión que sabe obtener URLs firmadas esté desplegada y validada en staging.

### Decisión pendiente: tratamiento de `properties.main_image`

| Alternativa | Descripción | Ventaja | Costo y riesgo |
|---|---|---|---|
| **A. Reutilizar `main_image` como ruta relativa** | Convertir el contenido actual de URL pública a `storage_path` relativo y cambiar todos los lectores. | Cambio de esquema menor; conserva el nombre de columna. | Alto riesgo semántico: una columna llamada `main_image` ya no contiene una URL. Hay valores demo, externos, nulos o históricos que no necesariamente se pueden convertir. Requiere actualizar todos los consumidores en un solo corte. |
| **B. Añadir `main_image_path` y transición** | Mantener `main_image` temporalmente; escribir/leer la nueva ruta con fallback controlado; eliminar el campo antiguo después. | Reversión y migración de datos más seguras; permite inventariar excepciones sin cortar vistas. | Mayor complejidad temporal: doble lectura/escritura y riesgo de que el fallback público quede olvidado. Requiere disciplina para retirar el campo legado. |
| **C. Dejar de usar `main_image` y derivar la principal desde `property_images`** | La fila `position = 0` / `category = main` se vuelve única fuente de verdad; se firma esa ruta al presentar. | **La opción más limpia a largo plazo:** una fuente persistente, sin duplicación URL/ruta y alineada con el límite/orden de galería ya existente. | Requiere backfill de propiedades que sólo tienen `main_image`, fallback para registros sin galería y cambio de todas las tarjetas/PDF/admin. Debe comprobarse que el backfill pueda identificar cada objeto antes de retirar dependencia. |
| **D. Mantener URL pública para principal y privatizar sólo galería** | Excluir `main_image` del cambio. | Menor trabajo inmediato. | No resuelve AUD-002: la principal seguiría expuesta y es consumida por casi toda la superficie pública. No es aceptable como corrección. |

**Alternativa mínima si se prioriza reversibilidad:** B, con fecha de retiro explícita para `main_image`.  
**Alternativa más limpia a largo plazo:** C, una vez que el inventario/backfill demuestre que toda propiedad real con imagen tiene una ruta verificable.  
**Decisión requerida antes de implementación:** elegir B o C. Esta auditoría no selecciona una automáticamente.

### Diseño de URLs firmadas

| Caso | Lugar de firma recomendado | TTL inicial propuesto | Motivo |
|---|---|---:|---|
| Portada, inventario, ficha pública y catálogo | Server Component, después de consultar una propiedad públicamente visible | 10 minutos | Cubre render y navegación normal sin almacenar credenciales. La firma sólo se genera para `published` + cuenta activa + publicaciones habilitadas. |
| Galería/lightbox pública | Server Component de ficha; firmar el conjunto de hasta siete rutas | 15 minutos | Evita una llamada por clic y da margen para interacción. Debe renovarse al recargar la ficha. |
| Edición del propietario | Server Component de edición, tras comprobar propietario mediante RLS | 15 minutos | Permite ver/reordenar la galería propia; las previews de archivos nuevos siguen siendo `blob:` locales. |
| Administración | Server Component de detalle admin, después de comprobar rol | 15 minutos | Admin necesita ver todos los estados; plazo contenido reduce exposición accidental. |
| PDF | Route Handler de PDF, justo antes de `renderToBuffer` | 5 minutos | La firma existe sólo durante la generación servidor a servidor; no se entrega al navegador como enlace de imagen. |

Los TTL son punto de partida operacional, no una nueva regla de negocio. Deben validarse contra duración real de PDF/red y ajustarse sólo con evidencia. Si el render de PDF puede exceder cinco minutos, se aumenta el TTL de ese caso, no se persiste una URL.

#### Dónde no firmar

- No usar `createSignedUrl` ni `createSignedUrls` desde componentes cliente, tarjetas, galería, formularios, `ImageUploader` o `PropertyImageEditor`.
- No exponer una API genérica del tipo “firma cualquier `storage_path`”; permitiría enumeración/abuso. Una ruta debe llegar a la función de firma desde una consulta ya autorizada de la propiedad.
- No insertar una firma en `properties.main_image`, `property_images`, cache persistente, logs, notificaciones ni props reutilizadas fuera de la respuesta que la necesita.

#### Mecanismo propuesto

Crear una utilidad **sólo de servidor** que acepte las rutas ya autorizadas y llame `createSignedUrls` por lote (máximo siete). Las páginas/Route Handler mantienen su autorización actual y le pasan únicamente las rutas seleccionadas por su consulta. Esto evita duplicar la lógica de construcción de URL sin convertirla en un endpoint público de firmado.

La utilidad no debe aceptar un `propertyId` arbitrario de un cliente ni saltar RLS con una credencial de servicio. Si la policy de `storage.objects` es correcta, el cliente servidor con sesión/cookies puede firmar sólo los objetos que el actor ya puede leer. Si se necesitara una credencial privilegiada por limitaciones del proveedor, la autorización de propiedad debe ejecutarse primero en el servidor y la clave jamás llegar al navegador; esa necesidad es `NO VERIFICADA` y debe probarse en staging.

### Matriz de visibilidad derivada de reglas actuales

| Estado / actor | Público no autenticado | Propietario | Administrador | Asesor autorizado |
|---|---|---|---|---|
| `draft` | No | Sí, si es propia | Sí | No definido; hoy no tiene permiso especial. |
| `pending` | No | Sí, si es propia | Sí | No definido; hoy no tiene permiso especial. |
| `published` con cuenta activa y publicaciones habilitadas | Sí | Sí | Sí | Sí, pero por ser público; autorización de contacto no añade permiso de imagen. |
| `published` con cuenta suspendida o publicaciones deshabilitadas | No | **Decisión pendiente:** RLS de tabla local permite historial propio; mantenerlo preservaría comportamiento actual. | Sí | No definido; no debería derivarse de autorización de contacto. |
| `paused` | No | Sí, si es propia | Sí | No definido; hoy no tiene permiso especial. |
| `rejected` | No | Sí, si es propia | Sí | No definido; hoy no tiene permiso especial. |
| `expired` | No | Sí, si es propia | Sí | No definido; hoy no tiene permiso especial. |
| `pending_update` | No | Sí, si es propia | Sí | No definido; hoy no tiene permiso especial. |

La columna “propietario” conserva la intención de migración 032: una cuenta suspendida conserva lectura de historial pero no puede modificar. El acceso de un asesor autorizado a contacto sólo está definido para datos de contacto y una propiedad publicada; **no se debe ampliar a imágenes no públicas sin decisión expresa**.

### Diseño de policies de Storage

Al privatizar el bucket, `storage.objects` necesita autorizar la lectura que antes otorgaba implícitamente `public = true`:

- **Lectura pública:** objeto cuyo `name` coincide exactamente con `property_images.storage_path` de una propiedad `published`, dueño `active` y `publications_enabled = true`.
- **Lectura de propietario:** objeto vinculado a una `property_images` de propiedad propia. Debe confirmarse la decisión pendiente sobre dueño suspendido; la tabla local mantiene lectura de historial.
- **Lectura admin:** objeto vinculado a una propiedad, si `current_user_is_admin()` es verdadero.
- **Upload:** conservar la policy actual: autenticado, cuenta activa, carpeta inicial igual a `auth.uid()` y extensión WebP.
- **Delete:** conservar la policy actual: cuenta activa y carpeta propia.

La lectura debe comparar la ruta completa contra `storage.objects.name`, no sólo la carpeta, para que una ruta cargada pero no asociada a una propiedad no se firme/entregue como imagen de una propiedad. La formulación SQL exacta debe revisarse en staging por posibles interacciones de RLS entre `storage.objects`, `property_images` y `properties`.

### Secuencia propuesta de migraciones — no creadas

El último número local es 043. Los nombres siguientes reservados para el diseño serían:

1. `044_prepare_property_main_image_paths.sql` — **sólo si se elige B**: añade `main_image_path` nullable, índice/constraints mínimos y no cambia todavía los lectores. Si se elige C, esta migración se reemplaza por una migración de auditoría/backfill de referencias de galería, no por una nueva columna.
2. `045_backfill_property_image_paths.sql` — identifica URLs internas válidas de `main_image`, extrae la ruta relativa, verifica existencia/asociación y completa `main_image_path` (B) o crea/normaliza la fila `position = 0` (C). Debe producir un listado de excepciones, no convertir URLs externas o ambiguas a ciegas.
3. `046_make_property_images_private.sql` — cambia `storage.buckets.public` a `false` para `property-images`; incorpora las policies de `storage.objects` de lectura pública/propietario/admin alineadas con la matriz anterior, sin relajar upload/delete WebP/carpeta/estado activo.
4. `047_finalize_property_image_source.sql` — **sólo después de pruebas:** retira fallback de URL pública y, según la opción elegida, depreca `main_image` (C) o deja `main_image_path` como fuente estable y planifica retiro del campo legado (B).

La secuencia de despliegue debe ser: código compatible con rutas + firmado en staging → backfill verificado → policies de lectura privada → bucket privado → retiro de fallback. Ejecutar `046` antes de desplegar lectores firmados rompería las vistas.

### Migración de datos de `main_image` — análisis sin ejecución

Para cada fila no nula:

1. Aceptar sólo URLs cuyo host/path corresponda al proyecto Supabase esperado y al segmento `/storage/v1/object/public/property-images/` (o la forma exacta que confirme el proyecto activo).
2. Extraer y decodificar la porción posterior a `property-images/`; rechazar ruta vacía, ruta fuera del prefijo del dueño, extensión distinta de `.webp` o valor no asociado a un objeto/ruta de galería verificable.
3. Comparar con `property_images.storage_path`. Si existe una fila `position = 0`, usar esa ruta como fuente preferente y registrar diferencias; no confiar sólo en una URL textual.
4. Para una propiedad sin `property_images` pero con URL interna verificable, decidir antes de actuar si se inserta una fila principal o si se usa temporalmente `main_image_path` (B). Esa es parte de la elección B/C.
5. Mantener `NULL` como “sin imagen”. Registros demo con URLs externas (por ejemplo Unsplash) y valores externos/ilegibles quedan como excepciones de datos: no se convierten automáticamente, no se firman y requieren limpieza o sustitución manual decidida por el responsable.
6. Antes de cambiar el bucket, producir conteos: convertibles, ya alineados con galería, sin galería, externos, nulos y no verificables. No declarar éxito sin que esos conteos sean cero o tengan decisión explícita.

### Compatibilidad: archivos a modificar después de autorización

| Archivo | Función actual | Cambio necesario tras decisión B/C | Riesgo |
|---|---|---|---|
| `app/publicar/page.tsx` | Upload, `getPublicUrl`, persiste `main_image`. | Guardar ruta estable/usar fuente principal definida; obtener firma sólo para visualización inmediata si hace falta. | Alto. |
| `app/api/editar-propiedad/route.ts` | Upload/remove, firma pública y actualización de principal. | Eliminar persistencia de URL pública; devolver/usar ruta y firma efímera autorizada. | Alto. |
| `app/mis-propiedades/[id]/editar/page.tsx` | Convierte rutas existentes a URL pública. | Firmar rutas de propietario en servidor. | Alto. |
| `app/bodegas/[slug]/page.tsx` | Ficha/galería pública consume `main_image` y `getPublicUrl`. | Consultar fuente de ruta y firmar lote público. | Alto. |
| `app/api/bodegas/[slug]/pdf/route.tsx` | PDF consume principal/galería públicos. | Firmar en Route Handler inmediatamente antes de render. | Alto. |
| `app/admin/[id]/page.tsx` | Muestra/edita URL principal y galería pública. | Firmar rutas admin; adaptar o retirar campo de URL libre conforme a B/C. | Alto. |
| `app/page.tsx` | Portada entrega `main_image` a tarjeta. | Obtener ruta principal y firmar antes de render. | Medio. |
| `app/inventario/page.tsx` | Inventario entrega `main_image` a tarjeta. | Igual que portada. | Medio. |
| `app/asesor/[public_id]/page.tsx` y RPC `get_advisor_catalog` (024/028) | Catálogo público entrega `main_image`. | Retornar ruta estable o enriquecer en servidor con firmas; no retornar firma persistente de RPC. | Alto. |
| `components/PropertyCard.tsx` | Consume URL en `background-image`. | Puede permanecer igual si recibe una firma efímera; su tipo/nombre no debe inducir persistencia. | Bajo. |
| `components/PropertyImageGallery.tsx` | Consume URLs de galería/lightbox. | Puede permanecer igual si recibe firmas con TTL suficiente. | Bajo. |
| `components/PropertyImageEditor.tsx` | Consume URL existente / `blob:` nuevo. | Puede permanecer igual si la página le entrega firmas; no tocar previews `blob:`. | Bajo. |
| `components/ImageUploader.tsx`, `lib/image-optimizer.ts` | Optimización WebP, límite y previews locales. | **No deberían modificarse.** | Bajo. |
| `app/api/eliminar-propiedad/route.ts` | Borra rutas del bucket. | **No debería cambiar** salvo una verificación de policy en staging. | Bajo. |
| `lib/supabase.ts`, `lib/supabase-server.ts` | Clientes Supabase. | No cambiar para el diseño inicial; sólo añadir utilidad servidor separada si se aprueba. | Medio. |

### Matriz de pruebas previa a implementación

| Caso | Resultado esperado |
|---|---|
| Publicar propiedad | Upload WebP, máximo siete, rutas persistidas; vistas autorizadas obtienen firmas, no URLs guardadas. |
| Propiedad `pending` | No visible ni firmable para público; dueño/admin según matriz. |
| Rechazada | No visible ni firmable para público; dueño/admin según matriz. |
| Pausada | No visible ni firmable para público; dueño/admin según matriz. |
| Expirada | No visible ni firmable para público; dueño/admin según matriz. |
| `pending_update` | No visible ni firmable para público; dueño/admin según matriz. |
| Cuenta suspendida | No visible públicamente; confirmar lectura de historial del dueño y bloquear upload/replace/delete. |
| Admin | Puede ver principal/galería de cualquier estado sin usar URL pública. |
| Propietario | Puede ver propia galería autorizada; no puede firmar ni leer propiedad ajena. |
| Público + `published` | Portada, inventario, ficha, catálogo, galería/lightbox y PDF cargan imágenes. |
| Público + no publicada | No puede leer referencia ni abrir objeto por endpoint público, API o firma. |
| URL pública antigua | Devuelve fallo de acceso después de que el bucket sea privado; comprobar con URL capturada antes del cambio. |
| Firma expirada | Deja de cargar tras TTL; nueva página autorizada obtiene una nueva firma. |
| PDF | Se genera con principal y galería dentro del TTL, sin exponer firmas como datos persistentes. |
| Galería | Navegación, lightbox, móvil y hasta siete imágenes funcionan durante TTL. |
| Upload WebP | Sigue aceptando sólo WebP, cuenta activa y carpeta propia; JPG/PNG/origen no optimizado se rechaza. |
| Edición | Conserva, reordena, añade y elimina imágenes; principal derivada coincide con posición 0. |
| Máximo siete imágenes | Octava imagen se rechaza tanto en UI/RPC como en prueba directa. |
| Borrado de propiedad | Elimina referencias y objetos propios; fallo de limpieza queda visible/recuperable. |
| Propiedad sin imagen / `NULL` | No falla tarjeta, ficha, admin ni PDF; se muestra fallback actual. |
| Datos legado externos | URL de demo/externa no se convierte ni se firma silenciosamente; aparece en reporte de excepciones. |
| Manipulación de ruta | Un usuario no puede firmar una ruta de carpeta ajena, no vinculada o de propiedad no autorizada. |

</details>
