# Integración controlada de desarrollos recuperados — 2026-10-27

**Dictamen: GO CON CONDICIONES para la consolidación local. Publicación y modificación de ramas oficiales pendientes de autorización y comprobación remota de Netlify. No habilita STAGING ni producción.**

## Hechos verificados

- Repositorio único: arzalight/qrih.
- Directorio: /Users/fabianlira/Documents/ChatGPT/QRIH Inmobiliaria industrial/qrih.
- Rama local: integration/recovered-auth-dashboard-seo.
- Commit inicial y primer padre del merge: 6ce7cf440296ef64d7ea94319ad578acd435af4a.
- Segundo padre: 848f52cc42d8c8c17f8c1351a2fea6f0df6a2a44, cuyo padre directo es ab5e3fe80fb415ff0e7938cea3cf562054b87472. Ambos SHA originales se conservan; no se aplicó cherry-pick ni se reconstruyeron las funcionalidades.
- Se integró únicamente el tip SEO con merge no fast-forward. El SHA final se obtiene del commit que contiene este informe y de outputs/integration-validation-20261027/final-verification.json.
- GitHub consultado durante el cierre: feature/sprint-3-commercial-tools sigue en 6ce7cf440296ef64d7ea94319ad578acd435af4a, igual que la rama local oficial y su referencia origin.
- AGENTS.md, las cuatro migraciones de Sprint 3, todo supabase/, package-lock.json, configuración Netlify y preparación de backup permanecen iguales a la base oficial.
- No se ejecutaron migraciones, despliegues, push, PR, operaciones Supabase remotas ni cambios de Netlify. No se crearon clones ni repositorios alternativos.

## Resolución individual de los seis conflictos

| Archivo | Resolución |
| --- | --- |
| app/globals.css | Conservar estilos del selector privado de Sprint 3 y sumar el diálogo de autenticación recuperado. |
| app/login/page.tsx | Mantener interfaz, bloqueo de doble envío y retorno seguro de Sprint 2. Su contrato next existente ya admite volver a ambos formularios; contenido final idéntico a la base oficial. |
| app/publicar/PublicarForm.tsx | Reutilizar borrador/autenticación recuperados, montar selector privado sólo con identidad conocida y enviar datos privados mediante el RPC atómico vigente. |
| package.json | Unión sin duplicados de todas las suites oficiales y recuperadas; sin cambios de dependencias. |
| proxy.ts | Renovación de sesión para perfil (incluido propietarios), mis-propiedades, notificaciones y admin; caché privada y referrer conservados; política SEO global sin consultas Auth en cada página pública. Autorización sigue en páginas/API/RLS. |
| tests/prelaunch-ui.test.mjs | Conservar contrato del login oficial y adaptar comparación del editor para excluir el nuevo procesamiento privado; mantener pruebas previas y añadir las recuperadas. |

## Sprint 3, autorización y prevención de duplicados

El endpoint nuevo valida origen canónico, usuario real no anónimo, perfil activo, datos comerciales, consentimientos y selector privado. Las lecturas/reintentos se limitan a owner_id del actor. El UUID del borrador es estable y sirve de clave de idempotencia.

Con datos privados, preparar no crea ninguna fila. Las fotos verificadas se suben por el endpoint existente y el envío final llama qrih_create_property_with_owner con propiedad, galería, contacto/pendiente, estado y consentimientos en una única transacción existente. No hay fallback a INSERT/UPDATE si falla el contrato privado. Se confirma estado mediante lectura del registro del actor. Un reintento de un UUID ya confirmado no crea otra propiedad; el borrador existente se continúa en su editor. El cliente bloquea envíos simultáneos y reutiliza fotos ya subidas en el mismo intento.

Sin datos privados se conserva el flujo recuperado de reserva/adjunto/finalización comercial. No se modifica SQL, RLS ni Storage. Los requerimientos exigen usuario activo y mantienen estado new (revisión), cuota por actor y UUID estable. El formulario interpreta únicamente draft/pending confirmados como éxito y no publica directamente.

## Privacidad de borradores

Se sustituyó la captura genérica por una lista de campos permitidos en captura, restauración y ambos almacenes. Dirección, internal_name, owner_contact_id, pending_owner y demás controles privados quedan fuera de localStorage, sessionStorage e IndexedDB. En requerimientos también se excluyen nombre, correo, teléfono, empresa, giro y comentarios. Los snapshots anteriores válidos se filtran y reescriben al cargar; las claves desconocidas se descartan.

Persisten sólo descripción comercial permitida, UUID/metadatos técnicos del borrador y fotos seleccionadas (IndexedDB, máximo siete, TTL siete días). El identificador técnico de cuenta vincula el intento para impedir retomarlo con otra identidad; no es un contacto propietario. Los textos libres permitidos y fotografías pueden contener datos que el usuario decida introducir: la lista no es un clasificador de contenido.

El diálogo recuperado abre el acceso en otra pestaña para mantener DOM/memoria del formulario original. Al volver se exige revisar las opciones privadas antes de enviar. Tras recargar, cerrar la pestaña o continuar en otro dispositivo hay que volver a introducir dirección y contactos/propietarios; se comunica expresamente. No se inventó otro proveedor/modal de login. Se conservan callbacks de correo con next restringido a los dos formularios y retorno seguro.

## Indicadores y SEO

loadAdminMetrics vuelve a comprobar usuario, rol admin y cuenta activa antes de usar el cliente privilegiado. Usa conteos reales y muestra indisponible ante error; no inventa visitas. Usuarios significa perfiles; vinculaciones significa postulaciones, no cierres. El auto-refresh de Sprint 2 se conserva.

SEO usa proyecciones públicas, selección explícita de campos, JSON-LD escapado, sitemap y metadatos. Formularios/rutas privadas/STAGING quedan noindex. La indexación exige opt-in y contexto/origen productivo coherentes; noindex no sustituye autorización. No se cambió RLS para SEO.

## Pruebas y límites

- 314 PASS / 0 FAIL en todas las suites de npm test salvo local-environment, ejecutadas juntas.
- 7 PASS / 0 FAIL en local-environment por separado, red simulada y TMPDIR controlado dentro de outputs; se limpiaron únicamente los temporales propios.
- Total del script npm test: 321 PASS / 0 FAIL, sin suites eliminadas.
- npm run lint: PASS, cero advertencias. npm run typecheck: PASS.
- Nuevas pruebas mínimas: exclusión y limpieza de canarios privados en ambos almacenes/restauración; RPC atómico con galería/estado/UUID; errores privados sin fallback ni eliminación de fotos; respuesta perdida/reintento; rechazo de origen ausente e imágenes de otra cuenta. Pruebas Sprint 3 adaptadas al límite servidor conservan doble clic y reutilización de foto tras error.
- Navegador local con componentes reales y Auth/API simuladas, sin cargar .env ni acceder a servicios reales: propiedad visitante abre acceso al enviar, conserva campos/foto tras recarga, elimina dirección del borrador, vuelve desde acceso en otra pestaña, muestra selector privado y confirma pending; requerimiento restaura zonas/rangos, no restaura contactos y confirma revisión con sesión simulada. Evidencia JPG en outputs/integration-validation-20261027/.
- El empaquetador exclusivo de la prueba visual requirió target ES2022 para conservar aritmética BigInt existente; no se alteró código monetario ni configuración del proyecto por ese ajuste de fixture.
- Escaneo acotado de los 43 archivos de código/documentación recuperados o adaptados: sin coincidencias de claves privadas, tokens GitHub, claves AWS, secretos Supabase o JWT literales completos. No es garantía absoluta de ausencia de secretos.
- git diff --check sin errores; ningún marcador de conflicto restante.
- No se ejecutó build Next completo ni pruebas live/RLS que ejecutan SQL. Las pruebas locales y mocks no validan RLS/Storage remotos, correo real ni datos/volumen de STAGING.

## Preservación

Los dos archivos locales permanecen sin seguimiento y fuera del commit:

- scripts/check-staging-direct.mjs — SHA256 736acc6b3a9456d502a1fa3f63bb099feb518cada27af4cea6629bfcfef69981.
- tests/staging-direct-check.test.mjs — SHA256 2809033d8b9afaf227334b023b033af51d59f14ef1f2b879fbe6f09a4de266e2.

Los bundles originales permanecen ignorados y sin cambios:

- ab5e3fe-original.bundle — SHA256 b66ebe1e6bb33c81e7388a74e8e01b828449f4807db9b29b05886f69c08db64b.
- 848f52c-recovered-complete.bundle — SHA256 c66683cdaa50d2a1f60f93766cc6ea227ad1661feda88633a0487e9450819495.

## Pendientes y riesgos

1. Confirmación real por correo/PKCE, regreso al formulario y sesión entre pestañas requieren prueba autorizada de STAGING. El dispositivo nuevo no recupera un borrador local.
2. Validar las cuatro migraciones/RPC privados ya existentes y pruebas RLS/Storage en entorno autorizado; no ejecutadas aquí. Conservar bloqueos previos de backup/conexión/administración de STAGING.
3. Medir costo de quince conteos exactos del panel con auto-refresh de treinta segundos; inferencia de posible costo, no regresión de acceso demostrada.
4. Una subida previa al guardado atómico puede quedar huérfana si se abandona el envío. Ante respuesta incierta no se borra una imagen potencialmente confirmada; la reutilización evita duplicarla durante el mismo intento en memoria.
5. Validar build completo, dominio/aliases/canonical, opt-in de indexación y comportamiento real del adaptador de Netlify antes de desplegar.
6. Antes de publicar: nueva autorización y consulta del estado remoto real de builds de qrih-staging según AGENTS.md. Ni este informe ni [skip netlify] sustituyen esa consulta. La integración todavía no está sincronizada con GitHub.

## Archivos cambiados frente a la rama oficial

- app/admin/page.tsx
- app/api/imagenes/route.ts
- app/api/publicar-propiedad/route.ts
- app/api/requerimientos/route.ts
- app/auth/callback/route.ts
- app/bodegas/[slug]/page.tsx
- app/busco-bodega/page.tsx
- app/globals.css
- app/inventario/page.tsx
- app/layout.tsx
- app/page.tsx
- app/privacidad/page.tsx
- app/publicar/PublicarForm.tsx
- app/registro/page.tsx
- app/robots.ts
- app/sitemap.ts
- app/terminos/page.tsx
- components/AdminStatistics.tsx
- components/DeferredAuthNotice.tsx
- components/ImageUploader.tsx
- components/PropertyImageGallery.tsx
- components/useFormDraft.ts
- docs/ADMIN_DASHBOARD_SEO_2026-10-27.md
- docs/ADMIN_SEO_REMOTE_AUDIT_2026-10-27.json
- docs/DEFERRED_AUTH_2026-10-27.md
- lib/admin-metrics.ts
- lib/form-draft.ts
- lib/property-submission.ts
- lib/seo.ts
- package.json
- proxy.ts
- scripts/audit-public-seo.py
- scripts/verify-deferred-browser.mjs
- tests/admin-seo.test.mjs
- tests/auth-navigation.test.mjs
- tests/auth-profile.test.mjs
- tests/commercial-properties.test.mjs
- tests/deferred-auth.test.mjs
- tests/deferred-draft.test.mjs
- tests/prelaunch-ui.test.mjs
- tests/seo-server-render.test.mjs
- tests/sprint3-commercial.test.mjs
- tests/ssr-session.test.mjs
- docs/RECOVERED_INTEGRATION_2026-10-27.md (este informe).
