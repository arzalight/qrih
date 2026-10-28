# QRIH — Corrección de cuatro hallazgos de auditoría

## Alcance y estado

Repositorio arzalight/qrih, directorio /Users/fabianlira/Documents/ChatGPT/QRIH Inmobiliaria industrial/qrih, rama local integration/recovered-auth-dashboard-seo. Base inicial verificada: 87aca3e90fd82f50126f63cb59b49ec8e5d770be. Sin cambios versionados pendientes al inicio; únicamente los dos archivos sin seguimiento conocidos. Se leyeron AGENTS.md, la auditoría final y las guías instaladas de Route Handlers/useRouter de Next.js 16.3.6. El commit final es el que contiene este informe; su SHA y verificaciones finales quedan en outputs/integration-validation-20261027/fixes-final-verification.json.

**GO CON CONDICIONES para revisión/publicación posterior del commit. Los cuatro hallazgos conocidos quedan corregidos en los contratos locales y sus pruebas. No constituye autorización de merge ni despliegue.**

## Correcciones implementadas — HECHOS VERIFICADOS

### F-01. Confirmación por estado real

PublicarForm comprueba que cada respuesta exitosa corresponde al mismo request_id local, tanto en preparación como al finalizar. Sólo pending produce confirmación de envío a revisión. draft mantiene la confirmación diferenciada de guardado o, si recover=true, lleva al editor del borrador existente.

rejected, published, paused, expired y pending_update muestran el estado existente y explican que no hubo nuevo envío ni modificación. Conservan formulario/borrador y no muestran éxito. Estados ausentes/desconocidos o un UUID ajeno dejan una advertencia de resultado incierto, también sin limpiar el intento. Una interrupción de red permite reintentar con el mismo UUID; el bloqueo de doble clic se conserva. El servidor no modifica automáticamente registros rechazados.

Pruebas ejecutan el submit real extraído del componente, no una copia de su lógica: respuesta perdida, dos clics simultáneos, mismo UUID al reintentar, draft/pending, cinco estados moderados, estado ausente y respuesta con otro ID. Además se verifica que el endpoint devuelve el estado existente sin repetir RPC/escritura.

### F-02. Usuarios Auth anónimos en imágenes

/api/imagenes ahora rechaza !user o user.is_anonymous con HTTP 401, antes de consultar perfil, leer el multipart o invocar ingestión/Storage. Se mantienen getUser, perfil activo, pertenencia de draft, tamaño/recodificación, procedencia de fotos, cuota, galería y reglas de limpieza ante resultados ambiguos.

La prueba usa una sesión anónima cuyo stub de perfil sería activo: no llega a esa consulta, ingestión, adjunto ni eliminación. También comprueba ausencia de sesión. No se modificó la configuración Auth de Supabase.

### F-03. Fotografías al crear una propiedad

En el formulario de alta, pending exige al menos una fotografía seleccionada/optimizada; el mensaje aparece antes de consultar Auth o abrir el diálogo. draft permite cero fotos.

/api/publicar-propiedad rechaza pending con image_count=0 en ambos caminos (privado atómico y heredado), antes de reserva/RPC. La finalización sigue comprobando cantidad real de galería o image_refs propios, y el RPC privado conserva su validación/procedencia originales. No se consideran válidas fotografías sólo por una cantidad declarada: la galería final debe verificarse con los controles existentes.

Pruebas nuevas verifican preparación y finalización sin fotos rechazadas sin mutación, y borrador sin fotos permitido en ambos caminos. Se conservan las pruebas de galería incompleta, rutas ajenas, límites y siete fotos. Las pruebas del formulario verifican rechazo previo a Auth y guardado explícito de draft sin imágenes. Se ajustó el fixture de envíos pending anterior para incluir la foto que exige ahora el contrato; no se eliminaron pruebas.

El alcance es el flujo de alta auditado y sus dos contratos de creación. El editor de registros existentes conserva las validaciones/RPC de Sprint 3, incluido su mínimo previo de galería para edición. No se amplió ese contrato SQL ni se modificó el esquema para permitir vaciar una galería existente. Los requerimientos y su API no se tocaron ni adquieren una obligación de fotos.

### F-04. Métricas generales cada cinco minutos y pendientes frecuentes

loadAdminMetrics conserva los quince conteos exactos en una muestra inicial: catorce generales y uno de pendientes. Las métricas generales exitosas se reutilizan por hasta 300,000 ms en memoria privada del proceso, separadas por ID de administrador. Pendientes se consulta en cada refresco. El panel mantiene su actualización segura de treinta segundos y sus pausas al editar/no estar visible; los otros catorce conteos no se repiten durante la vigencia de la muestra del mismo administrador y proceso.

Antes de leer cualquier muestra se vuelven a comprobar getUser, is_anonymous, perfil admin y cuenta activa. La reutilización no evita ni sustituye autorización. El módulo sigue server-only; no hay caché HTTP pública, persistencia en navegador ni caché compartida de Next. La memoria está acotada a cien administradores; se retiran muestras caducadas al guardar otras y se limita el tamaño. Se devuelve una copia para que otro render no pueda alterar la muestra. Fallos generales no se guardan como muestras válidas; cero real sigue siendo cero y visitas sin integración sigue siendo null.

La interfaz informa el intervalo de cinco minutos y que pendientes se actualiza con el panel. Las ventanas UTC de las métricas históricas pertenecen a la misma muestra; pendientes tiene un conteo actual separado.

Las pruebas verifican: quince consultas al inicio, una sola al refrescar treinta segundos después, vigencia justo antes de cinco minutos, recálculo al cumplir el plazo, pendientes con valor actualizado, retorno de copias, separación A/B, revocación de rol/suspensión/sesión anónima aun con caché, y recuperación tras fuente fallida. No se agrupó SQL porque requeriría otro contrato/RPC y migración; se reutilizaron las consultas exactas existentes.

## Pruebas de esta ejecución

| Validación | Resultado |
| --- | --- |
| Suites específicas deferred-auth, Sprint 3 y admin/SEO | 45 PASS, 0 FAIL en ejecución focalizada inicial; también incluidas en npm test final. |
| npm test | 329 PASS, 0 FAIL, 0 skipped; ocho pruebas nuevas respecto a las 321 anteriores. |
| npm run test:sprint3 | 17 PASS, 0 FAIL. |
| npm run lint | PASS, cero advertencias. |
| npm run typecheck | PASS. |
| npm run build | PASS; Node v24.21.0, Next.js 16.3.6/Turbopack, generación 34/34 y rutas/proxy reconocidos. |
| git diff --check | PASS. |

Se revisaron scripts y efectos antes de ejecutar. npm test utilizó TMPDIR bajo un directorio temporal propio dentro de outputs/integration-validation-20261027 y limpió únicamente ese recurso en finally. No se instalaron paquetes ni se conectaron pruebas de negocio a servicios remotos. El build utilizó npm run build con el launcher local protegido y configuración ya existente de STAGING; no se inventaron credenciales, no se habilitó red para compilar y no se ejecutó dev/start.

No se ejecutaron suites SQL/migraciones, test:rls ni pruebas live de STAGING/PRODUCCIÓN. Los contratos se validaron con stubs y ejecución del código real; no prueban las políticas de una base remota.

## Guardado atómico y privacidad preservados

/api/publicar-propiedad sigue utilizando qrih_create_property_with_owner con UUID estable, actor del servidor, p_private, galería, estado y consentimientos. Preparar el camino privado no crea fila comercial. Un error privado no deriva a INSERT/UPDATE ni elimina fotos potencialmente confirmadas. Las pruebas existentes de Sprint 3, equivalencia de propietario, respuesta incierta y reutilización de imágenes siguen pasando.

No se modificaron lib/private-commercial.ts, lib/property-save-server.ts, lib/form-draft.ts, el selector privado, los formularios/API de requerimientos, proxy/SEO, SQL/RLS/Storage, AGENTS.md, dependencias ni configuración Netlify. Los campos privados siguen excluidos de almacenamiento persistente del borrador.

## Archivos modificados

- app/api/imagenes/route.ts
- app/api/publicar-propiedad/route.ts
- app/publicar/PublicarForm.tsx
- components/AdminStatistics.tsx
- lib/admin-metrics.ts
- tests/admin-seo.test.mjs
- tests/deferred-auth.test.mjs
- tests/sprint3-commercial.test.mjs
- docs/AUDIT_FINDINGS_FIXES_2026-10-27.md

## Riesgos y pendientes

**INFERENCIA / LIMITACIÓN:** la prueba cuenta invocaciones de consultas, no mide latencia, CPU, costo monetario ni planes de PostgreSQL. La caché es por proceso: arranques fríos, distintas instancias, vencimiento/desalojo o solicitudes concurrentes sobre una muestra aún inexistente pueden repetir conteos. No se promete una reducción global exacta en Netlify. Si la fuente falla, se vuelve a intentar en un refresco posterior en lugar de congelar “Sin datos”. Los listados/firmas/coincidencias del panel siguen refrescándose con su frecuencia previa y requieren medición con volumen real. Las métricas generales pueden tener hasta cinco minutos de antigüedad, expresamente comunicados.

**PENDIENTE:** validación autorizada de STAGING (backup, conectividad/administración, cuatro migraciones existentes y funciones privadas), correo real/PKCE, RLS/Storage, rollback/concurrencia de PostgreSQL y adaptador OpenNext/Netlify con dominio real. No se declara resuelto ninguno de esos bloqueos históricos por un build local.

Los dos archivos sin seguimiento y los bundles originales conservan sus hashes. La rama oficial permanece en 6ce7cf440296ef64d7ea94319ad578acd435af4a; main/develop no se modifican. El nuevo commit existe sólo localmente; GitHub permanece en la base de integración 87aca3e hasta autorización de publicación. Antes de un eventual push debe consultarse nuevamente el estado remoto real de Netlify según AGENTS.md. No se ha hecho push, merge, PR, migración ni despliegue.

Logs ignorados de esta ejecución: outputs/integration-validation-20261027/fixes-focused-tests.log, fixes-all-tests.log, fixes-sprint3.log, fixes-lint.log, fixes-typecheck.log y fixes-build.log. El SHA y las comprobaciones finales se registran en fixes-final-verification.json.
