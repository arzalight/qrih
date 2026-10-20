# Mis propiedades — alcance e inspección previa

## Cierre vigente20oct — GO condicionado del piloto

**GO CONDICIONADO para Soft Launch supervisado en el QRIH STAGING existente, con datos reales ya seleccionados.** [Dictamen y condiciones](SOFT_LAUNCH_GO_2026-10-20.md) / [RC y cierre AUD-040](aud040-deploy-verification-2026-10-20.json). Commit publicado `f803f35faba9cf871a81f93560112e20358230c2`, fuente `4c7d05057f2429306d8ed5ba6097d9b273eb292a`, deploy `6ad79257b59620a2a787e9a1` READY/SHA/publicación exactos.138unit remotas/31HTTP remotos PASS/0fallos/0skips y lint/tipos/build/preflight completos. Selector admin corregido, guardado autenticado de fixture con éxito, `m2` conservado y huellas comerciales/galerías de ambos fixtures iguales (sólo updated_at excluido). **AUD-040 MEDIO CORREGIDO, DESPLEGADO Y VERIFICADO.**

Aceptación crítica [gestionada](soft-launch-moderation-2026-10-20.json): owner/admin reales, ciclo publicado→retirado→editado→revisión→rechazo, privacidad/ficha/PDF/7WebP, duplicado y portada independientes. Fixtures finales rejected/draft,14objetos conservados; sin inmuebles reales alterados por el agente, eliminaciones, nueva migración ni producción/main. Free/saldo previo283,7créditos/sin pagos-recargas-overages, un único RC adicional autorizado y builds detenidos; no otro build por documentación.

**Límites operativos aceptados expresamente:** Fabián supervisa, respaldos cifrados manuales por día de uso/antes de cambios y pausa manual de nuevas altas si falla respaldo/correo/cuota. Recuperación completa24h y carga/concurrencia real NO medidas; renovación prolongada/all-actor-all-status y demás límites conservan su alcance, no son PASS inferidos. AUD-018 mantiene riesgo operativo residual aceptado, no «totalmente corregido». Sin SLA, GO de producción, invitaciones, publicación de registros adicionales ni acciones automáticas. Los NO-GO/pedidos de permiso o deploy de cortes inferiores son **antecedentes superados por este dictamen condicionado**, no tareas vigentes.

### Antecedentes de preparación y controles ya cerrados

**Corte20oct — aceptación crítica nueva PASS; AUD040 local bloquea el GO remoto hasta nueva entrega.** **Aceptación funcional crítica PASS, dentro de su alcance; límites operativos del piloto ACEPTADOS por el usuario; GO pendiente de entregar/verificar AUD-040.** [Ciclo gestionado y límites](soft-launch-moderation-2026-10-20.json): sesión publisher localhost y admin legítimo STAGING; original pending→published→draft→pending→rejected, Cancelar conserva publicada, un solo evento de retiro, edición/reenvío normales. Ficha/PDF y7WebP públicos200 sólo publicada; nuevas lecturas404 y autorización vacía al retirar/rechazar en ambos sitios. Admin no-owner recibe404 en editor/duplicación privados. Duplicado draft101m²,14rutas independientes/7fotos cada uno; visor admin1→2→1/EscapePASS. Cero borrados/tercer fixture/cambios de inmuebles reales/DDL/deploy en esta aceptación; ambos fixtures conservados sin publicar.

**AUD-040 MEDIO / CONFIRMADO / CORREGIDO LOCALMENTE / NO DESPLEGADO.** [Informe](AUD040_ADMIN_PRICE_UNIT.md): BD `m2` no correspondía a opción `m²` del editor admin; selector vacío podía enviarse comoNULL. Inconsistencia reproducida en BD+DOM, pérdida real no provocada. Dos líneas de corrección, cinco regresiones antesFAIL/despuésPASS y conteo hijo33→38.138unit/31HTTPlocal/lint/tipos/build/preflightPASS; tres entradas funcionales cambian y READY5c4970e anterior no contiene el fix. Sin migración/datos/configuración/producción cambiados. Falta entregar develop, único RC adicional con autorización explícita y comprobación de selector/guardado sobre fixture; no repetir ciclo completo, copias,051 o recuperación.

**Aceptación operativa explícita:** «Sí, acepto esos límites para el piloto»: piloto supervisado/Fabián, política de respaldos ya aprobada, pausa de nuevas altas si falla respaldo/correo/cuota; recuperación completa24h y carga/concurrencia real no medidas, sin SLA ni GO de producción. Copia cifrada local rehashPASS,12,82h de antigüedad al corte20oct15:45UTC; no nueva captura/restore ni readbackDrive actual. Renovación cronometrada/concurrencia y demás límites quedan declarados, no convertidos en PASS. No pedir nuevamente esa aceptación. **NO-GO vigente del artefacto remoto hasta AUD-040 entregado y verificado; después dictamen condicionado del piloto, nunca apertura/invitaciones automáticas.**

Los estados previos que piden sesión admin/aceptación del ciclo o permiso operativo son antecedentes ya superados. RC publicado5c4970e conserva su recibo y no acredita la corrección local nueva. No repetir trabajo cerrado.

## Estado vigente —051 integrada, aceptación real pendiente

19octCDMX/20oct03:20:48UTC. [Aplicación051 en QRIH STAGING](profile-property-management-staging-migration-2026-10-19.json) autorizada por el usuario y verificada: una versión nueva, nueve filas históricas totales; guard/dos RPC/índice y permisos mínimos correctos.23tablas de negocio/Storage y las ocho filas previas de historial iguales al respaldo, RLS/bucket/WebP intactos.93SQL sintéticas reejecutadas PASS y11aserciones vivas PASS; no reemplazan Auth/Storage físico/UI/concurrencia. No funciones de negocio invocadas para retirar/duplicar datos reales, sin nuevos cambios funcionales/Git/Netlify/producción. Próximo integración localhost con fixtures nuevos y sesión legítima bajo alcance propio; **NO-GO**. Secciones inferiores de «sólo en memoria/no aplicada» describen el corte anterior y quedan sustituidas por este recibo. Header del SQL canónico conserva el permiso sintético inicial como antecedente; no se reescribe una migración aplicada para cambiar comentarios.

Rama: `feature/profile-property-management`, desde develop/a496790. Trabajo previo documental y ensayo offline de respaldos conservados sin commit. No main, cloud, credenciales, datos reales ni Netlify modificados. Cambio de alcance solicitado expresamente por el usuario respecto a la congelación anterior.

## Arquitectura comprobada antes de implementar

- Panel: `app/mis-propiedades/page.tsx`, Server Component, consulta `owner_id=user.id`; conserva métricas, solicitudes, eliminación, requerimientos y oportunidades.
- Creación: `/publicar`, formulario cliente; crea draft antes de galería y revisión. Edición: `/mis-propiedades/[id]/editar` y POST `/api/editar-propiedad`; sólo draft/rejected. RPC048 bloquea fila y verifica updated_at; trigger046 protege moderación incluso por escritura directa.
- Estados reales: draft/pending/published/paused/rejected/expired/pending_update. Sólo published adquiere nueva transición voluntaria a draft. Los cuatro estados restantes no editables siguen bloqueados; duplicación de propiedad propia no cambia el origen.
- Storage privado: main_image_path + property_images.storage_path; firmas servidor autorizadas por RPC045/047; ingesta WebP y procedencia047; hasta7 asociaciones/048. Primera foto del editor es portada.
- Moderación: qrih_moderate_property/048 y auditoría038/039/045; no sustituir revisión ni heredar aprobaciones.

## Decisiones de implementación

Reutilizar el editor existente también como formulario de creación desde una propiedad propia, accesible mediante `/publicar?duplicar=UUID`; no insertar ni copiar archivos al visitar esa URL. Copiar sólo campos comerciales explícitos, y sólo al guardar crear rutas nuevas verificadas, propiedad draft nueva y galería atómica. No copiar contactos, intereses, autorizaciones, visitas, home_pool, notificaciones ni auditoría histórica. Evento nuevo de creación/duplicación sí procede. Identificador de intento estable y control transaccional previenen repetición del registro tras respuesta perdida. Conservar objetos ante resultado incierto, sin borrar rutas de origen.

Editar published requiere confirmación explícita seguida de POST autenticado y RPC de propietario activo, con bloqueo de fila y auditoría atómicos. GET nunca muta. El trigger admite exclusivamente cambio published→draft sin otros campos; ninguna RLS se deshabilita ni amplía. Las URLs firmadas ya emitidas conservan su TTL previo; no existe revocación instantánea. Nuevas lecturas públicas de ficha/PDF/firma deben quedar denegadas por estado.

Portadas del panel: main_image_path, firma autorizada servidor, placeholder16:9, renovación autenticada de corta duración y acciones independientes. Sin URLs firmadas persistidas.

## Migración generada y probada sólo en memoria — pendiente de STAGING

Generada mediante `supabase migration new`: `supabase/migrations/20261019212016_051_profile_property_management.sql`. El bloqueo de telemetría quedó resuelto con las opciones oficiales de desactivación, sin cambiar HOME ni configuración global. `docs/sql/profile-property-management.sql` queda como referencia a ese único SQL canónico, no una segunda copia ejecutable. Migración ejecutada correctamente sólo en una instancia nueva de PostgreSQL en memoria (PGlite), con esquema del repositorio y datos ficticios; instancia cerrada al terminar. No aplicada al STAGING alojado, copia recuperada ni producción. El backend falla cerrado si falta el RPC; no declarar la integración operativa en STAGING. NO-GO conservado.

## Estado de entrega — 19 de octubre

**IMPLEMENTADO EN CÓDIGO:** tres mejoras, endpoints y migración051. **VALIDADO LOCALMENTE:** `npm test`132/132PASS sin skips (114previas+18nuevas), `npm run test:rls`93/93PASS sin skips (43previas+50nuevas), TypeScript/lint/build PASS. SQL ejecutado en PostgreSQL en memoria con fixtures sintéticos; revisión visual estática con componentes reales en1440/375/320px. Cotejo previo byte a byte: PublicarForm conserva el formulario original. [Recibo y límites](profile-property-management-local-2026-10-19.json). **PENDIENTE DE VALIDACIÓN EN STAGING:** aplicación autorizada de051 y flujos reales Auth/Storage/UI, incluyendo bytes independientes y ciclo de moderación. No marcar VALIDADO EN STAGING ni inferir pruebas interactivas del render estático. Retirada/duplicación no funcionan contra una BD sin esos RPC. NO-GO conservado.

Se trasladó el formulario de creación original a `app/publicar/PublicarForm.tsx` sin cambiar su lógica. `app/publicar/page.tsx` ahora elige creación normal o precarga propia; el formulario de edición existente se reutiliza con modo duplicado. Se extrajo el handler de edición a `lib/property-save-server.ts` para compartir su validación, galería y tratamiento de resultados ambiguos, no se cambió de arquitectura ni de proveedor. Se conservaron las9regresiones AUD-038. No dependencias nuevas ni modificación del lockfile.

| Archivo | Cambio de este lote |
| --- | --- |
| `app/mis-propiedades/page.tsx` | Portada firmada, estado superior, superficie, acciones; solicitudes/métricas/eliminación/requerimientos/oportunidades preservados |
| `components/OwnPropertyCover.tsx` | Imagen16:9/carga diferida/placeholder, renovación privada14min y recuperación ante error con límite de reintento |
| `components/ManagePropertyActions.tsx` | Editar/duplicar; diálogo modal nativo accesible, Cancelar sin POST, ref contra doble confirmación |
| `app/api/mis-propiedades/[id]/portada/route.ts` | Renovación GET con sesión, propietario explícito y firma autorizada900s; private,no-store |
| `app/api/retirar-propiedad/route.ts` | POST, confirmación, origen, UUID, sesión y propietario; RPC atómico preparado |
| `app/publicar/page.tsx`, `PublicarForm.tsx` | Selector servidor y formulario original conservado; duplicado no se crea al abrir URL |
| `app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx` | Modo duplicado, precio numérico precargado, intento estable, ref de doble envío, reuso de uploads propios en reintento y guardado exclusivamente draft |
| `lib/property-save-server.ts` | Lógica previa de edición compartida; copia autorizada/re-encode/procedencia de fotos al guardar duplicado, validación comercial y de galería |
| `app/api/editar-propiedad/route.ts`, `app/api/duplicar-propiedad/route.ts` | Entradas pequeñas al servicio existente compartido |
| `app/globals.css` | Cubierta uniforme, modal, adaptación de ancho y acciones de tarjeta de altura mínima44px |
| `supabase/migrations/20261019212016_051_profile_property_management.sql` | Migración CLI transaccional; trigger/RPC/auditoría/idempotencia probados sólo en memoria |
| `docs/sql/profile-property-management.sql` | Referencia documental al SQL canónico; sin copia ejecutable |
| `tests/profile-property-management-rls.test.mjs` | 50pruebas SQL nuevas, incluidas compilación, policies/RLS sin cambios, autorizaciones, estados, galería y rollback; integrada en test:rls |
| `tests/profile-property-management.test.mjs`, `tests/property-write-errors.test.mjs`, `package.json` | Suite nueva incorporada en npm test; hook de ruta extraída actualizado; sin dependencia nueva |

## Cambios de BD en051 — probados en memoria, requieren permiso para STAGING

1. Reemplazar guard046 preservando controles existentes y añadiendo sólo transición published→draft del propietario activo, sin cambiar ningún otro campo salvo updated_at. Registrar `property_withdrawn_for_edit` en audit_logs dentro de la transacción.
2. RPC `qrih_withdraw_own_property`: sesión/propietario activo, bloqueo de fila, estado published esperado; reintento en draft no repite evento. No permiso de UPDATE directo nuevo al publisher ni cambios de RLS.
3. RPC `qrih_duplicate_property`: sólo propiedad propia/cuenta activa, campos comerciales explícitos, ID generado en BD y draft nuevo, galería opcional0–7, portada/galería/auditoría atómicos. Fotos comprobadas por procedencia, propias y aún no asociadas a otro inmueble. Sin copiar tablas relacionadas ni campos internos del origen.
4. Intento UUID por formulario, serialización por actor/intento y rutas, índice único de nuevo evento de duplicación. Consulta de resultado antes de copiar y comprobación final dentro de transacción. No segunda fila por doble envío del mismo intento.

051 no modifica enums, policies, metadatos Storage, permisos de lectura pública ni datos existentes; no elimina registros. Revoca EXECUTE público/anónimo de los nuevos RPC y concede sólo authenticated, con autorización dentro del definer y search_path vacío. Comparación del catálogo de policies y flags RLS antes/después PASS en PGlite. No se ejecutaron advisors ni consultas sobre Supabase alojado: el resultado sintético no demuestra equivalencia universal del entorno gestionado.

## Pruebas y límites de evidencia

La suite de aplicación añade18casos con handlers reales y dependencias sintéticas a114existentes (132en npm test). Incluye copia/nuevas rutas/draft, precio numérico, intento repetido, respuesta perdida, RPC ausente, ajena/anónimo/suspendido, ruta adulterada/octava, fallo total/parcial de copia, draft sin fotos, confirmación/cancelación/origen, portada propia/ajena/no-store y URLs GET sin escrituras. Ejecuta los callbacks reales de Cancelar y doble confirmación extraídos del componente.

La suite SQL añade50pruebas (49subcasos y prueba contenedora) a43existentes: baseline y044–051 en una instancia nueva de PGlite, roles/auth.uid sintéticos, transacciones con rollback y cierre final. Comprueba autorización owner/ajeno/anónimo/admin-no-owner/owner-suspendido, retiro atómico e idempotente, estados denegados, ocultación pública posterior, draft→pending→moderación admin, duplicación de los siete estados con ID nuevo, relaciones sensibles no heredadas, siete fotos y portada/orden, cero fotos, octava/rutas adulteradas/inyección denegadas, rollback por fallo tardío y borrado lógico del duplicado sin afectar origen. Un borrado RPC comprueba referencias y elegibilidad de limpieza de metadatos, NO eliminación física de archivos. El mismo intento repetido produce una sola fila/evento; no es una prueba de contención concurrente multisesión.

Visual estática: JSX de tarjetas y componentes reales renderizados con siete estados sintéticos, enlaces/router simulados y CSS real. En1440px tres columnas; en375/320px una, portada16:9, sin desbordamiento horizontal. Revisión detectó acciones menores de44px; ajuste CSS acotado y comprobación posterior móvil: altura mínima44px. Servidor efímero de sólo lectura cerrado y pestaña temporal cerrada; no quedó listener de esa prueba. No hubo hidratación/clics autenticados ni un E2E Next completo.

Límites pendientes: Auth/JWT reales, Storage físico/WebP/copia/eliminación y permisos del servicio gestionado, navegador autenticado, TTL900s real, concurrencia multisesión y advisors del proyecto correcto. No se usaron secretos, red de Supabase, Docker ni datos de recuperación para los ensayos SQL.

No servidor activo en3107 al compilar; no se interrumpió sesión en uso. Build de desarrollo nuevo no es RC certificado y no reutiliza READY anterior. Guard previo de167archivos queda obsoleto por cambios funcionales; no se relajó ni se falseó su manifiesto. Sin autorización de commits/push para este lote; cambios anteriores conservados.

### Riesgos y manejo de fallos

- Bloqueante de integración: SQL051 pasa en memoria, pero sigue sin instalarse ni validarse en STAGING. Antes de aplicarlo: revisión, respaldo reciente verificado, identidad del proyecto y permiso explícito. No desplegar estos cambios sin esa integración y prueba coordinada.
- Tras pérdida de respuesta RPC no borrar objetos posiblemente referenciados ni repetir automáticamente. Verificar Mis propiedades; podrían quedar objetos nuevos no asociados si hubo carreras/rollback. Sólo se intenta limpiar rutas generadas por el servidor en ese intento cuando falla antes del commit. No limpieza de recursos anteriores ni borrado automático sobre resultados inciertos.
- Los reintentos del mismo intento devuelven el resultado ya confirmado, no una nueva propiedad ni nuevas modificaciones a la fila confirmada. Para modificarla se debe entrar a su edición.
- Duplicación consume cuota de ingesta existente50imágenes/15min. No crear capacidad paga ni evadir límite. Se preserva formulario ante errores; el mínimo de fotos de edición/revisión existente no se cambia. Un borrador duplicado puede crearse sin fotos, como la creación original.
- Si una propiedad antigua no tiene precio numérico, el duplicado exige introducirlo; no adivinar unidades/importe desde texto. Precio nuevo mantiene price_value/price_unit/price_display consistentes; no cambiar retrospectivamente la edición anterior.
- Firma pública ya emitida puede durar600/900s según superficie; un PDF ya descargado no se revoca. Nuevas solicitudes públicas deben quedar denegadas al cambiar estado; no prometer retirada retroactiva de bytes.
- Guías Supabase/privilegios/transacciones orientaron permisos mínimos, autorización con sesión y no realizar llamadas Storage dentro de la transacción SQL. Referencias oficiales: [funciones](https://supabase.com/docs/guides/database/functions), [download](https://supabase.com/docs/reference/javascript/storage-from-download), [generar migración](https://supabase.com/docs/reference/cli/supabase-migration-new), [opciones oficiales de telemetría](https://github.com/supabase/cli/blob/develop/apps/cli/docs/analytics.md). El desbloqueo de CLI usó sólo opciones de proceso oficiales, sin configuración global ni conexión remota.

## Checklist antes de Netlify STAGING — no ejecutar por este documento

**Respaldo previo concluido19octCDMX/20octUTC:** [generación nueva local y Drive](backup-verification-2026-10-19.json) verificada,51tablas/52objetos; anterior preservada. No repetir captura/recuperación por este gate. Siguiente: autorización explícita para únicamente051 y controles vivos/ventana antes de DDL. El respaldo no autoriza aplicación ni integra las nuevas funciones por sí solo.

[Procedimiento preparado de integración051, controles y contingencia](PROFILE_PROPERTY_MANAGEMENT_ROLLOUT.md). Revisión posterior: preflight local y patrones de secretos PASS acotados; no nueva vulnerabilidad confirmada. No se ejecutó el capturador antiguo ni se retiró su bloqueo. El siguiente gate necesita alcance explícito de copia nueva/segunda copia y ventana sin escrituras; no autoriza aplicar051.

Generación CLI y ensayo SQL aislado terminados; no repetirlos como pendientes. Siguiente: revisar051 y preparar controles de identidad/esquema/cuota/corte y respaldo reciente verificado; captura/transferencia y aplicación al STAGING real requieren alcance y autorización propios. Nunca aplicar a la copia recuperada ni usar STAGING como desechable. Después probar los nuevos flujos reales con fixtures autorizados y preservando datos existentes; no repetir recuperación histórica. No usar el conector Supabase ajeno. Revisar código/Git/manifest/secretos y permisos de commit/push; Netlify sólo un RC autorizado con cuota Free vigente, no auto deploy.

| Caso posterior | Esperado | Estado actual |
| --- | --- | --- |
| Borrador/rechazada | Precarga y guardado/reenvío con ID e historial conservados | Regresiones locales; E2E nuevo pendiente |
| Published: abrir URL editar / cancelar diálogo | GET no muta / Cancelar sin POST, sigue pública | Inspección y callback/API sintéticos; BD/UI real pendientes |
| Published: confirmar | Mismo ID→draft + un audit; fuera de inventario/ficha/PDF/firma anónimos | SQL PASS: ID/audit/lecturas y paths públicos denegados; HTTP/ficha/PDF reales pendientes |
| Cambiar campos y enviar a revisión | Draft→pending; sólo moderación normal vuelve a publicar | Ciclo SQL PASS; nuevo ciclo E2E pendiente |
| Pending/paused/expired/pending_update | Editar deshabilitado; endpoint no permite saltar estado | SQL y render estático PASS; navegador autenticado pendiente |
| Duplicar draft/publicada | Sólo precarga al entrar; guardar crea otro ID draft | API y SQL de los siete estados PASS; integración real pendiente |
| Campos y relaciones | Datos comerciales propios; métricas/contactos/autorizaciones/aprobaciones no heredados | Consultas SQL sobre fixtures PASS; datos del entorno gestionado no probados |
| Fotos del duplicado | Nuevas rutas/WebP/hashes independientes, orden/portada; quitar una no afecta origen | Mocks y SQL de referencias/orden/borrado independiente PASS; bytes y Storage real pendientes |
| Sin foto / siete / octava | Placeholder y draft0fotos;7permitidas/8denegadas | SQL y placeholder estático PASS; interacción y Storage reales pendientes |
| Doble clic / respuesta perdida | Un registro/intento, sin borrar fotos posiblemente guardadas | Mocks/función UI y repetición SQL PASS; concurrencia multisesión pendiente |
| Fallo de copia parcial | No fila nueva; sólo cleanup de rutas nuevas conocidas; original intacto | Mock de segunda copia fallida; recuperación física pendiente |
| Cuenta ajena/suspendida/IDs adulterados | Sin edición ni duplicación privada ni firma ajena | API y roles/RLS SQL sintéticos PASS; Auth real pendiente |
| Tarjetas escritorio y móvil | 16:9, object-fit, sin saltos/overflow; acciones independientes y legibles | Render estático1440/375/320px PASS, acciones mínimo44px; E2E autenticado pendiente |
| Expiración/sesión cerrada | Renovación de portada propia, placeholder seguro al denegar; no-store | API mock; tiempo real/navegador pendientes |

Hasta completar BD/privacidad y RC autorizado, **NO-GO**; no se modificó Supabase, Storage, producción ni Netlify en este lote.
