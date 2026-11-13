# QRIH — Dashboard administrativo y SEO técnico

Fecha: 27 de octubre de 2026, Ciudad de México.

**Dictamen: GO CON CONDICIONES para revisión local y preparación de pruebas. No constituye autorización de liberación.** No hubo push, merge, despliegue, migraciones, cambios de variables, secretos, políticas, roles ni buckets remotos.

## Estado y alcance verificados

- Repositorio local `arzalight/qrih`, árbol limpio al iniciar, rama inicial `feature/deferred-auth-forms`, commit `ab5e3fe`. Nueva rama: `feature/admin-metrics-seo`.
- Esta rama incluye como base la implementación previa de autenticación diferida, todavía local. Para integrar sólo este trabajo en otra base hay que revisar esa dependencia; no sustituir ni perder los cambios anteriores.
- Next.js instalado 16.3.6. Se consultaron las guías incluidas de metadata/sitemap y la documentación oficial de Supabase/Google/Schema.org. Se leyó el changelog de Supabase y los avisos recientes de TLS y PostgreSQL; no se cambió infraestructura.
- Se inspeccionaron baseline, migraciones hasta 052, páginas, middleware, APIs, roles, analítica y antecedentes de AUD-001/002. **El esquema versionado no acredita que todas esas migraciones estén aplicadas remotamente.**
- La conexión de Supabase sólo mostró un proyecto ajeno a QRIH. No se consultó su contenido ni se intentó usarlo como fuente. El fallo histórico de contraseña de PostgreSQL STAGING continúa sin confirmar.

## Auditoría SEO inicial

**HECHO VERIFICADO por HTTP anónimo sobre el despliegue existente** en https://qrih-staging.netlify.app. Evidencia: `ADMIN_SEO_REMOTE_AUDIT_2026-10-27.json`; reproducción: `python scripts/audit-public-seo.py`.

| Elemento | Estado observado antes de los cambios |
| --- | --- |
| Inicio e inventario | HTTP 200; contenido y un H1 en HTML servido |
| Ficha pública muestreada | HTTP 200; H1 con título de la propiedad en HTML |
| Titles/descriptions | Genéricos e iguales en inicio, inventario, filtros y ficha |
| Canonical | Ausente en todas esas páginas |
| Open Graph / JSON-LD | Ausentes en las páginas muestreadas |
| robots.txt / sitemap.xml | HTTP 404 ambos |
| STAGING | Sin robots meta ni X-Robots-Tag noindex en las páginas muestreadas: riesgo de indexación, sin prueba de indexación efectiva |
| Filtros | URLs responden 200 con metadatos genéricos, sin canonical |
| URL de propiedad inexistente | HTTP 404 |
| Imágenes | 6 en inicio, 22 en inventario, 5 en ficha; ninguna sin alt en la muestra |
| Login | HTTP 200; sin directiva noindex observada |
| Analítica pública | Sin marcadores GA4/GTM en la muestra HTML |

La lectura de una ficha puede incrementar el contador existente de vistas; ese contador no se usa para simular sesiones del sitio. No se enviaron formularios, correos ni acciones comerciales durante la auditoría.

**HECHO VERIFICADO en código:** fichas consultan la vista anónima `properties_public`; las tablas originales conservan límites de lectura. Requerimientos no tienen detalle público indexable autorizado: `demand_requests` restringe lectura al dueño/admin; el feed técnico exige sesión. Las rutas de ficha comercial `/ficha/` ya tenían noindex/no-referrer/no-store. No se encontraron GA4, GTM, API de Search Console ni instrumentación del embudo diferido en el código auditado.

**INFERENCIAS:** las URLs de filtros pueden producir duplicación y la ausencia de protección de STAGING puede facilitar su indexación. Ninguna implica que Google efectivamente las haya indexado.

**PENDIENTES:** inspección de URL y cobertura en Search Console, dominio productivo oficial, Core Web Vitals de campo/CrUX y mediciones Lighthouse, catálogo completo de redirecciones/aliases del proveedor, validación real de estados expirado/pausado/retirado con dos cuentas y permisos efectivos. No se atribuyen mejoras de ranking, tráfico ni conversiones a este cambio.

## Indicadores y definición de las fuentes

**Diagnóstico:** los indicadores anteriores utilizaban `properties.length` y filtros sobre esa respuesta; pueden quedar truncados por el límite de filas de PostgREST. Ahora las tarjetas usan `count: exact, head: true`; no descargan registros ni datos personales para contar. La tabla de gestión y el cálculo de coincidencias previos se conservan; su paginación/rendimiento preexistentes no se reconstruyeron en esta entrega.

| Sección / indicador | Fuente y significado | Comparación |
| --- | --- | --- |
| Principal: publicadas | `properties`, status `published`. Estado administrativo; puede incluir publicaciones cuyo dueño tenga visibilidad deshabilitada | Sin historia suficiente de saldos |
| Principal: expiradas | `properties`, status `expired` | Sin historia suficiente de saldos |
| Principal: usuarios registrados con perfil | `profiles`, PK única. Incluye perfiles suspendidos; no cuenta invitaciones ni altas Auth aún sin perfil | Total actual; altas por período en tarjeta secundaria |
| Principal: pendientes | `properties`, status `pending`; `pending_update` se cuenta por separado | Sin historia suficiente de saldos |
| Principal: vinculaciones 30 días | `opportunity_property_registrations.created_at`; cada fila es un par requerimiento–propiedad postulado | Conteo anterior y diferencia absoluta |
| Principal: visitas sitio 30 días | **No configurado**: no hay fuente de sesiones integrada | No disponible |
| Secundaria: solicitudes de contacto 30 días | `property_contacts`, filas por PK, fecha de creación | Conteo anterior y diferencia absoluta |
| Secundaria: próximas a expirar 7 días | `properties`, published y `verification_due_at` dentro de la ventana futura | No se inventa saldo histórico |
| Secundaria: borradores/pausadas/rechazadas/cambios pendientes | Estados correspondientes de `properties` | Sin historia suficiente |
| Secundaria: nuevos usuarios 30 días | `profiles.created_at` | Conteo anterior y diferencia absoluta |

Una **vinculación** es la postulación persistida, no una puntuación calculada por `matching.ts` ni una autorización de contacto. El esquema versionado tiene UNIQUE `(demand_request_id, property_id)`; las relaciones enlazan requerimiento, propiedad y registrante. El estado admite registered/presented/interested/visit/negotiation/closed/cancelled. El indicador mide creación, incluye cancelaciones posteriores y no equivale a éxito comercial. La definición/gestión verificable de “efectiva” sigue pendiente.

Las solicitudes de contacto se cuentan una vez por fila. Un reenvío puede ser otra fila de la misma persona: no se presentan como prospectos únicos ni como una suma de autorizaciones, intereses y contactos. El total de perfiles tampoco se presenta como censo completo de `auth.users`: conciliar altas sin perfil sigue pendiente y no se descargaron usuarios privados para simular ese total.

**Tiempo:** se captura un único instante por solicitud; períodos `[ahora−30×24h, ahora)` y `[ahora−60×24h, ahora−30×24h)` en UTC. Se utilizan `gte`/`lt`, sin solapamiento de límites ni fechas locales ambiguas. Próximas a expirar: `[ahora, ahora+7×24h)`. No se muestran porcentajes cuando el período anterior es cero; se ofrece diferencia absoluta. Conteos actuales son consultas independientes, no una transacción de snapshot global.

**Errores:** resultado fallido, configuración privada ausente o excepción => `Sin datos`; un conteo confirmado de cero => `0`. Visitas => `No configurado`. No se sustituyen fuentes por datos ficticios.

**No disponibles con fuente/definición verificadas:** requerimientos activos, vinculaciones efectivas, usuarios activos, promedio de aprobación, conversión y clics de Google. El feed de requerimientos usa new/45 días/cuenta activa/compatibilidad; contar simplemente `new` no reproduce esa definición. No se confundió `updated_at−created_at` con tiempo de aprobación ni último login con usuario activo.

## Autorización y costo

- `/admin` sigue restringido a admin activo. **Editor no tenía acceso al dashboard original y sigue sin tenerlo.** No se ampliaron permisos.
- El módulo de métricas lleva `server-only` y vuelve a validar usuario real con Auth, no anónimo, perfil/rol/estado antes de crear el cliente privilegiado existente. Es necesario porque las políticas de contactos y postulaciones no permiten al administrador leer automáticamente todas las filas con su sesión normal; contarlas así podría dar un cero parcial engañoso.
- El uso privilegiado es exclusivamente servidor y para devolver agregados HEAD; no se añaden APIs públicas de estadísticas, lecturas de contenido privado ni nuevos grants. Claves y SDK privados no llegan al navegador.
- Son 15 conteos en paralelo, sin joins multiplicadores ni recuperación de todas las filas. `COUNT exact` aún tiene costo PostgreSQL: **pendiente medir EXPLAIN/latencia y volumen real en STAGING**. El esquema revisado no acredita índices de fecha/estado adecuados para todas las tablas. Si se requiere escala, preparar índices de estado, fechas de creación y `(status, verification_due_at)` o un agregado seguro en una migración revisable; no ejecutar nada remotamente por esta entrega. No se incorporó cache global que mezcle sesiones.

## SEO implementado

1. Metadatos dinámicos por ficha pública: título existente, operación, superficie total y zona pública; descripción técnica con altura/andenes cuando existen. No se infiere municipio, tipo de inmueble, parque industrial ni moneda por texto ambiguo. Se evita usar dirección, contactos, descripción libre o rutas de Storage en los metadatos.
2. La ficha conserva SSR, H1, búsqueda y diseño. Un loader anónimo memoizado por render reutiliza la proyección pública para página y metadata. Ningún cambio abre la tabla privada.
3. Canonical absoluto, Open Graph y Twitter textual; no se publican imágenes con firmas caducables en OG. Imagen social estable requiere un mecanismo autorizado futuro.
4. JSON-LD `WebPage` mínimo, con datos públicos y escape de `<` contra cierre de script. Es un tipo válido y pertinente; no pretende habilitar un rich result inmobiliario ni inventa Product/ratings/ofertas.
5. Sitemap dinámico de inicio/inventario/legal y propiedades devueltas por `properties_public`, published. Paginación por PK de 500 filas evita el límite REST y deduplica URLs. No expone propietarios, direcciones, documentos, firmas ni requerimientos. Errores de catálogo no producen un sitemap parcial silencioso; más de 49,000 propiedades exige particionar antes de publicar. El recorrido de páginas no es snapshot transaccional; la autorización de cada URL y el 404 de detalle permanecen en la vista.
6. `robots.txt` permite leer las directivas noindex, excluye crawling de `/api/` y sólo anuncia sitemap si se habilita producción. Robots no sustituye Auth/RLS.
7. Root metadata conservadora con noindex; sólo páginas públicas permitidas lo levantan bajo la configuración explícita. Middleware aplica noindex a rutas privadas, formularios, autenticación, requerimientos, catálogos de asesor y entornos sin habilitar, incluyendo aliases cuyo origen no coincide con el dominio canónico. El refresco Auth sigue limitado a las rutas privadas originales.
8. Inventario con parámetros: noindex y canonical al inventario limpio; conserva filtros y navegación. No se generan miles de landings automáticas.
9. Primera foto de la galería con prioridad alta; se conservan dimensiones, lazy loading de las demás y alt existentes. Sin afirmar mejora cuantificada de LCP/CLS/INP.

### Configuración pendiente, sin efectuar cambios

La indexación está **deshabilitada por defecto**. Para una futura producción autorizada deben coincidir:

- `QRIH_PUBLIC_ORIGIN`: origen HTTPS oficial sin path, credenciales, query ni hash; nunca STAGING/preview/localhost.
- `QRIH_INDEXING_ENABLED=true`.
- `CONTEXT=production` y `URL` exactamente igual al origen oficial, variables del proveedor.
- La petición debe llegar por el origen canónico; los aliases siguen noindex por header.

No se configuraron esas variables ni se eligió un dominio productivo por suposición. En STAGING: mantener opt-in apagado; sitemap devuelve lista vacía, todas las páginas HTML reciben noindex. Un dominio recién habilitado debe comprobarse por HTTP después del build/despliegue autorizado: metadata se puede evaluar durante el build y middleware en ejecución.

### Propiedades fuera de disponibilidad

Comportamiento implementado conservador: sólo publicados públicamente visibles entran al sitemap o devuelven ficha. Ausentes/ocultos => notFound; errores de servicio => error, no falso 404. Se mantiene el 404 para estados no públicos; sin redirección automática al inicio.

Propuesta futura, requiere distinguir estados y motivos autorizados: temporalmente no disponible => conservar página 200/noindex sólo si la política permite una ficha pública sin contacto sensible; retirada => 404 o archivo público autorizado según motivo y duración; eliminada permanentemente => 410 si hay registro público/tombstone autorizado, de otro modo 404; sucesora equivalente real => 301 únicamente a esa ficha. No revelar existencia ni motivo privado desde metadatos. El modelo actual no permite clasificar de forma fiable todas esas causas.

### Arquitectura por ubicación

Evaluación: inventario filtrable ya ofrece navegación útil; aún falta tipo/municipio estructurado y validado para landings uniformes. Priorizar unas pocas páginas editoriales de ubicación/operación con inventario real, textos propios, canonical, enlaces internos y regla de inventario vacío. Preparar la taxonomía primero; evitar combinaciones automáticas de superficie/precio/zonas. No se añadieron páginas sin contenido auténtico.

## Analítica: propuesta preparada, sin introducir proveedor

| Métrica | Integración propuesta | Condición de exactitud |
| --- | --- | --- |
| Visitas | GA4 sessions mediante reporte agregado servidor | Validar propiedad, cobertura y consentimiento; definir zona de reporte |
| Clics orgánicos | Search Console API, agregado web | Verificar propiedad autorizada; datos tienen retraso y fecha diaria de su servicio |
| Usuarios activos | Definir actividad significativa y evento propio | Un login no acredita uso comercial |
| Conversión | Sesiones con acción comercial confirmada / sesiones elegibles | Misma fuente, ventana y deduplicación; no dividir solicitudes SQL entre vistas de fichas |
| Aprobación | Historial confiable de entrada a revisión y aprobación | Definir reenvíos y primera/última aprobación antes de calcular |
| Vinculación efectiva | Transición de negocio acordada y auditada | No inferir éxito desde una notificación ni coincidencia técnica |

No hay integración de lectura de Search Console en la app; **la existencia de una propiedad verificada fuera del código no fue comprobada**. Antes de implementar, comprobar acceso mediante conexión autorizada; no pedir archivos de cuenta de servicio ni guardar tokens en el navegador. Preferir OAuth y configuración del servidor ya aprobada. No modificar secretos para desbloquear esta entrega.

Embudo diferido propuesto: `form_started`, `form_validated`, `review_submit_clicked`, `auth_opened`, `auth_completed`, `review_submitted`, `contact_submitted`, `form_exit`. Parámetros permitidos: tipo de formulario, versión y código fijo de resultado. Excluir nombres, teléfono, correo, IDs de usuario/propiedad, título, dirección, búsqueda libre, contenido y archivos. Evitar que page_location/page_referrer del proveedor recojan query de callback OAuth/PKCE o formulario; no enviar eventos en rutas Auth ni transmitir query completa. Medir éxito tras confirmación del servidor, no sólo click. Salir no prueba abandono definitivo. GA4 y Search Console no comparten necesariamente la ventana móvil UTC exacta de las métricas SQL; mostrar sus fechas y latencia propias, sin presentar falsa equivalencia.

## Archivos modificados / añadidos

| Área | Archivos |
| --- | --- |
| Métricas | `lib/admin-metrics.ts`, `components/AdminStatistics.tsx`, `app/admin/page.tsx` |
| Política y metadatos | `lib/seo.ts`, `app/layout.tsx`, `app/page.tsx`, `app/inventario/page.tsx`, `app/bodegas/[slug]/page.tsx`, `app/privacidad/page.tsx`, `app/terminos/page.tsx` |
| Indexación | `app/sitemap.ts`, `app/robots.ts`, `proxy.ts` |
| Imagen | `components/PropertyImageGallery.tsx` |
| Pruebas | `tests/admin-seo.test.mjs`, `tests/seo-server-render.test.mjs`, `tests/ssr-session.test.mjs`, `package.json` |
| Evidencia | `scripts/audit-public-seo.py`, `docs/ADMIN_SEO_REMOTE_AUDIT_2026-10-27.json`, este informe |

## Pruebas realizadas y límites

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: **285 PASS, 0 fallos, 0 omitidas**. Incluye 13 pruebas nuevas y regresiones existentes; se actualizó el contrato del matcher por su nuevo alcance SEO, manteniendo los controles de sesión.
- Métricas con dependencias sintéticas: admin real activo vs editor/publisher/anónimo/suspendido, no inicializar acceso privilegiado antes de autorizar, COUNT HEAD exacto por encima de 1,000 filas, límites de períodos sin solapamiento, errores/configuración ausente vs cero.
- Sitemap con cliente sintético: 1,001 publicaciones, paginación por PK, URLs únicas, proyección pública, fallo cerrado por fuente no disponible y exclusión de STAGING.
- Render del código TSX real con SWC instalado y React SSR; límites de Supabase/Storage/UI de contacto sustituidos: H1, metadata, JSON-LD parseable y seguro, dirección oculta no publicada, no-publicado/notFound, fallo de servicio diferenciado, filtros noindex/canonical y tarjetas con cero/Sin datos/No configurado/diferencia previa.
- Middleware real con fixtures: indexación por entorno/dominio y regresiones de renovación, revocación y concurrencia de sesión. Las rutas públicas no hacen refresh Auth.
- Lectura HTTP de 8 URLs del despliegue anterior: evidencia inicial; **no certifica los cambios locales**.
- `npm run build`: **BLOQUEADO** por el guard existente: faltan origen y clave pública válidos de Supabase STAGING. No se desactivó, no se inventaron credenciales y no se ejecutó Next evitando el control.
- No hubo nuevas migraciones ni modificaciones SQL. No se declara validado RLS/Storage efectivo por el éxito de las pruebas sintéticas; esta ejecución no hizo consultas SQL contra QRIH.
- Pendientes: build real, dashboard autenticado con datos reales, comparación SQL independiente, latencia/planes, UI móvil/navegadores reales, sitemap/metadata/404/noindex del despliegue nuevo y CWV. El render sintético no sustituye Next/OpenNext ni prueba hidratación completa.

## Riesgos y recomendación para STAGING

**AUD-001:** no se modifican callbacks, return URLs ni permisos de Auth. Middleware amplía cobertura para SEO, conserva renovación sólo en privadas y no fabrica sesiones; regresiones pasan. Validar comportamiento en OpenNext y host real antes de liberar.

**AUD-002:** se mantienen Storage privado, ingestión/firma existentes y rutas persistentes. No hay URLs firmadas en sitemap/OG/JSON-LD ni cambios de bucket. No se declara cerrado el pendiente histórico del entorno.

Antes de autorizar liberación:

1. Completar configuración local por el mecanismo ya autorizado y ejecutar build sin saltar guards.
2. Confirmar proyecto QRIH, migraciones/constraint UNIQUE y perfiles actuales; conciliar Auth sin perfil. Resolver acceso PostgreSQL por un recorrido separado si sigue fallando.
3. Validar cifras contra agregados SQL de sólo lectura en el proyecto correcto; comprobar estados, reintentos, cancelaciones, bordes de 30 días y errores de fuente. Medir latencia y decidir índices/agregados antes de inventarios grandes.
4. Probar admin/editor/publisher/anónimo/suspendido y ausencia de métricas privadas en respuestas públicas. Comprobar que el acceso privilegiado sigue exclusivamente en servidor.
5. Desplegar sólo después de autorización expresa. En STAGING comprobar noindex global, sitemap vacío, ficha pendiente/rechazada/expirada/propietario suspendido no accesible, metadatos sin direcciones privadas y flujos diferidos intactos.
6. Revisar móvil, galería, contactos, moderación, login/callback y expiración de sesión en el despliegue nuevo.
7. Acordar dominio y habilitación de indexación productiva por separado. Con Search Console medir posteriormente cobertura, indexación, consultas y clics; registrar línea base y comparar períodos equivalentes.

Reversión: revertir exclusivamente este commit. No necesita rollback SQL ni cambios remotos para devolver el código al estado previo. La rama conserva la base de autenticación diferida.

Referencias primarias: [Sitemaps de Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [directivas robots/noindex](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [WebPage](https://schema.org/WebPage), [select y COUNT de Supabase](https://supabase.com/docs/reference/javascript/select). Las condiciones de publicación y los datos de QRIH se verificaron en su código/evidencias, no se dedujeron de esas guías.
