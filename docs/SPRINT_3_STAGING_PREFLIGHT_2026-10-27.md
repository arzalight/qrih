# Sprint 3 — preflight de STAGING / 27 de octubre de 2026

**Vigencia del corte:** la mejora complementaria posterior de [selección y propietario pendiente](SPRINT_3_OWNER_PICKER_2026-10-27.md) modifica el código y añade una cuarta migración sin aplicar. Este documento conserva la evidencia histórica del preflight de tres migraciones, pero **no sirve como autorización ni como corte vigente de ese lote ampliado**. NO-GO de recuperación intacto; antes de ejecutar se necesita nuevo preflight con cuatro archivos y corte actualizado.

## Dictamen y límite de autorización

**NO-GO para ejecutar migraciones y para declarar Sprint 3 validado en STAGING.** Se completó la inspección y la regresión local. No se aplicó SQL remoto, no hubo despliegue, push, cambios en main, exportación nueva, restauración ni cambios estadísticos. No se inició Sprint 4.

El usuario exige presentar y autorizar este preflight antes de migrar. El respaldo histórico está íntegro como archivo cifrado, pero no se ha acreditado un punto de recuperación del estado actual ni una restauración funcional de esa generación. El conector administrativo de Supabase rechazó el acceso al proyecto correcto. Ninguno de estos bloqueos se resuelve suponiendo permisos o reutilizando autorizaciones antiguas.

## 1. Corte de código y documentación

- Rama local: `feature/sprint-3-commercial-tools`.
- HEAD: `841463390298f6e5d5236ebf05b8f5492a8c1640`, checkpoint de Sprint 2 del 27oct2026. **No es un commit de entrega de Sprint 3.** Sprint 3 y el ajuste de menú están sin commit; no se certifica todavía un commit desplegable del sprint.
- Referencias locales remotas conservadas: `origin/develop=ff89d57b49c7b85b892bc069b1798707e22802ae`; `origin/main=55b773756066cd3975b3964dc67f106cf15ead4c`. No se realizó fetch/push ni se modificaron esas ramas.
- Estado: cambios locales en aplicación, pruebas y documentación, más tres migraciones y componentes nuevos. Se conservaron todos los cambios anteriores.
- Huella del corte probado: **208 archivos**, SHA-256 `c9747720341f1f1976af10fac76811d54e5499860a30ddf83995a4da0159cda5`. Incluye archivos tracked y untracked no ignorados bajo `app/`, `components/`, `lib/`, `tests/`, `supabase/migrations/`, y `proxy.ts`, `package.json`, `package-lock.json`. Orden lexicográfico; digest de cada ruta seguida de NUL y SHA-256 de sus bytes seguido de salto de línea. Excluye documentación, configuración secreta, build y evidencia. Cualquier cambio en este alcance invalida el corte.
- Revisados: AGENTS.md, documentación instalada de navegación de Next, informe de Sprint 3, estado del proyecto, recibos de respaldo/preparación y procedimiento histórico de recuperación; guías de Supabase/RLS/locks y Netlify.
- Ajuste pedido: enlace **Mis propietarios** en las pestañas del panel, dirigido a `/perfil/propietarios`, sin precarga. Conserva el acceso existente desde perfil. Evidencia local: `../../evidence/sprint3-preflight-menu.png`. No equivale a directorio operativo en la base remota.

## 2. Migraciones: orden y dependencias

| Orden | Archivo | SHA-256 |
|---|---|---|
| 1 | `20261027061535_sprint3_private_owners.sql` | `bb6199daa76295d96822493d0784d3b90c16e53d687f9cc0d53917cd94871dde` |
| 2 | `20261027061537_sprint3_atomic_private_property.sql` | `55c3dbc1342a075be65c18e9eccf9ed5a8346bb5c904167455e3434ca71f4634` |
| 3 | `20261027061538_sprint3_demand_urgency.sql` | `635c4aed109e9d6d5bc7598a20fbf6a6e995bc48d588d096ca351d7b6f5f3d73` |

Requieren baseline y 044–052. La segunda depende de las tablas/RPC de la primera y de los RPC atómicos anteriores; la tercera requiere los helpers y feed de oportunidades de 050 y el esquema vigente. El ledger propuesto de vinculaciones de Sprint 2 **no es dependencia** y no se incluye. Antes de ejecutar debe comprobarse el historial SQL remoto y las firmas/cuerpos de dependencias; la API REST no sustituye esa comprobación.

Cada archivo usa BEGIN/COMMIT. **El DDL no es idempotente para reejecución:** CREATE TABLE/FUNCTION/POLICY puede fallar si ya existe. Se debe aplicar exactamente una vez, cotejando historial y hashes, nunca mediante un push global de migraciones ni reparando historial a ciegas. Ante error: detener lote, comprobar rollback e historial antes de decidir. La idempotencia de reintentos de creación/duplicación/activación es una característica de los RPC, no una garantía de reejecución del DDL.

- Primera: contactos privados y detalles separados de `properties`, FK e índices, RLS, triggers de identidad/asociación y RPC parcial; no backfill ni cambios de valores comerciales. Asesor activo sólo lo propio; admin activo lectura ajena, no escritura. Archivo reversible, sin DELETE de contactos.
- Segunda: alta/edición/duplicación comercial, galería y privado en una transacción; allowlists y reintentos. RPC anteriores conservados.
- Tercera: PK por usuario y UNIQUE de requerimiento, intervalo exacto de 168 horas, sin escritura directa del cliente; lock transaccional por usuario antes de tomar el reloj. Feed mantiene elegibilidad y proyección sin datos de contacto. Expiración no cierra demandas.
- RLS/FK/rollback e invariantes se verificaron en PostgreSQL aislado (PGlite). **No se han inspeccionado estos objetos en STAGING ni probado contención multisesión real.**

## 3. Identidad e aislamiento

Único proyecto permitido: **`mcyxunymhuxyiwklyfpy`**, origen fijo `https://mcyxunymhuxyiwklyfpy.supabase.co`.

La configuración local existente fue cargada en memoria por el guard revisado, sin copiar archivos ni imprimir claves. Se validaron origen canónico y claves de aplicación, y ambas credenciales respondieron al origen fijo mediante lectura `properties_public` con límite cero. Las consultas adicionales se limitaron al mismo origen. **PASS para la vinculación de la aplicación a STAGING; no acredita credencial administrativa SQL ni recuperación.** No se usó conexión productiva.

El conector Supabase, al pedir metadatos de ese ID exacto, respondió «You do not have permission to perform this action». No se intentó otro proyecto ni SQL por ese conector. Una inspección REST de límite cero dio 404/PGRST205 para las tres tablas nuevas: ausentes de la API/schema cache. Esto es compatible con migraciones pendientes, **no prueba por sí solo su ausencia del catálogo ni el historial SQL**.

Netlify de STAGING identificado por lectura: `qrih-staging`, site `bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`, cuenta `6a0ce0bb6db9850cb304a1f0`; deploy publicado `6adff9c952c0d443c02f7840`, listo. No se ha autorizado ni iniciado un nuevo despliegue. Antes de uno futuro se deben reverificar variables efectivas/código/hash, cuota y guard de destino; la identidad del sitio no certifica por sí sola sus variables actuales.

## 4. Respaldo y procedimiento de recuperación

Recibo histórico: [verificación del 20oct](backup-verification-2026-10-20.json). Generación `capture-96ace78f-1472-4abb-ab05-778312f769ad`, origen STAGING correcto, captura 20oct2026 23:26:08–23:27:00 UTC. Reporta 51 tablas requeridas y 66 objetos Storage, 7,344,506 bytes de fotos; verificación cifrada local e independiente y readback de segunda copia privada en Drive. Son resultados históricos, no operaciones repetidas en este preflight.

**Reverificación actual sólo del ciphertext local:** `/Users/Shared/QRIH_Staging_Backups/capture-96ace78f-1472-4abb-ab05-778312f769ad/bundle.tar.age`, permisos 600, 8,071,288 bytes; SHA-256 `39a409ad231f09e4e89a9b43bde1d17cdb1606d2dfcc6f4d853ae1a25327ce55`, idéntico al recibo. No se leyó identidad privada, no se descifró/exportó ni se revalidó Drive en este turno.

**Gate no satisfecho:** la captura precede a 052 y a cambios posteriores; el recibo declara `restoreExecuted=false`. Los ensayos recuperados antiguos no prueban restauración de esta generación ni cobertura de las 26 propiedades actuales. No se certifica RTO ni recuperación actual sólo por coincidir hashes. Las autorizaciones de captura del 20oct eran de uso único/ventana limitada y no se reutilizan.

Procedimiento a autorizar y ejecutar antes de migrar:

1. Confirmar acceso administrativo al ID fijo de STAGING sin credenciales en chat, origen distinto de destino y responsable de custodia. No resetear contraseñas para facilitar la operación.
2. Acordar ventana sin escrituras/cargas y nueva captura cifrada del estado actual: esquema, datos, Auth, ACL/RLS, funciones, secuencias, historial, personalizaciones y **bytes** de ambos buckets. Inventario antes/después y consistencia del corte. Sin cambios de cuentas ni mantenimiento implícito.
3. Verificar descifrado por herramienta revisada bajo custodia humana, hashes y segunda copia independiente autorizada; nunca imprimir secretos o guardar plaintext en Git. El respaldo de BD por sí solo no contiene los bytes de Storage, según [Supabase](https://supabase.com/docs/guides/platform/backups).
4. Preparar **un destino nuevo, vacío, aislado y expresamente aprobado**, con versión compatible, correo/webhooks/integraciones bloqueados y sin salida a producción. No resetear ni reutilizar destructivamente los volúmenes recuperados existentes. Revalidar guard/red tras cada arranque.
5. Restaurar esquema/datos/historial y ACL de origen sin abrir permisos por defaults del destino. Subir bytes de Storage por API local conservando rutas/procedencia y privacidad; no simular objetos sólo con metadata SQL. Validar FK, secuencias, RLS y catálogo completo.
6. Comparar filas/huellas y todos los objetos con ese snapshot, probar Auth legítimo y lectura de galería/PDF, medir tiempos y documentar pérdida máxima. Datos privados sólo en evidencia cifrada. No prometer continuidad de sesiones antiguas.
7. Si ese ensayo pasa, presentar recibo y preflight actualizado para autorización del lote exacto. Ante incidente posterior: detener nuevas escrituras del alcance mediante acción aprobada; conservar evidencia; recuperar primero en destino aislado y validar antes de cualquier corte autorizado. **Nunca restaurar sobre STAGING vivo por ensayo.**

Referencia operativa histórica: [plan de recuperación](../supabase/staging/backup-recovery-plan-2026-10-06.md); sus gates/volúmenes previos no deben resetearse. Reversión de aplicación: cambio de código y nuevo build/deploy autorizado (fix-forward), no republicar automáticamente un deploy antiguo. Conservar tablas/datos nuevos bajo RLS; ningún DROP/DELETE automático.

## 5. Pruebas de este corte y alcance real

| Verificación repetida | Resultado | Entorno |
|---|---|---|
| `npm test` | 280/280 PASS | Local, fixtures |
| `npm run test:rls` con PGlite | 124/124 PASS | BD aislada; no dos conexiones reales |
| `npm run test:http` | 39/39 PASS | Build local, peticiones sin sesión y rutas inválidas |
| TypeScript / lint / build | PASS | Local; build sin clave privada |
| Preflight del bundle / diff whitespace | PASS | Local; no credencial privada examinada en cliente |
| Enlace Mis propietarios | Visible y destino correcto | Navegador local, sin abrir ficha pública real |
| Integridad de propiedades | 26/26 huellas idénticas, incluidas 24 originales; 22 públicas | STAGING, exclusivamente lectura |

**443 pruebas automatizadas aprobadas**, más controles de compilación. El primer intento HTTP fue bloqueado por permisos de red del sandbox (EPERM); se repitió con permiso de conexión local y pasó completo. No fue un fallo funcional ni se omitieron pruebas. Avisos de módulos/TypeScript experimentales de Node no provocaron errores; sin cambios de dependencias.

El script de integridad no escribió filas. No se consultaron contactos reales. El uso de la sesión existente para leer el panel no acredita las nuevas funciones remotas ni sustituye pruebas A/B. No se hicieron navegaciones adicionales a fichas públicas reales para evitar nuevas visitas.

## 6. Auditoría de la visita automática

Lectura exacta del evento conservado:

- `property_views.id=f22efbc1-98cc-4c26-8dbe-a4bc857056a6`.
- `property_id=219860d1-c672-46a5-b5a3-b8837085c6bc`.
- `created_at=2026-10-27T07:03:33.082133+00:00`.
- Procedencia: navegación visual previa desde localhost a una ficha real; la ruta ejecutó el limitador `qrih_take_server_limit` y luego INSERT de visita. No es una solicitud comercial. El registro no se borró ni editó; tampoco se alteró el limitador para ocultarlo.

Impacto comprobado por el código: suma una visita en la ventana de 28 días de su propiedad/asesor y semana correspondiente; entra en `totalViews`, contador de tarjeta y denominador `totalContacts/totalViews`. Puede alterar esa conversión cuando hay contactos. No crea contacto, aceptación ni vinculación; los indicadores públicos de propiedades publicadas y vinculaciones confirmadas no consultan `property_views`.

**Propuesta, no aplicada:** registro de clasificación separado y auditable por UUID exacto, propiedad, fecha, motivo «revisión visual», ejecución de prueba, responsable y aprobación. Conservar eventos crudos y ofrecer agregados brutos/depurados distinguibles; no reescribir el histórico ni marcar todas las visitas cercanas por inferencia. Requiere revisión y autorización propia, no una cuarta migración añadida a este lote.

Para pruebas futuras: modo de prueba controlado por servidor exclusivamente en entorno local/STAGING confirmado, cuenta/propiedad sintéticas y run ID verificable. Eludir ambos pasos de tracking sólo cuando esa regla se cumpla y dejar evidencia separada del run. No confiar en User-Agent, IP, query string o cabecera cliente sin validar como regla de exclusión. Probar positivos/negativos: navegador normal sigue contando; test autorizado no cuenta; marcador falsificado y producción jamás obtienen exclusión. No se implementó esta propuesta ni se alteraron estadísticas actuales.

## 7. Matriz integrada preparada — pendiente de autorización

Tras recuperación acreditada y preflight aprobado:

1. Congelar commit/corte, repetir guard de destino e inspeccionar historial/dependencias, respaldo y conteos. Aplicar **sólo los tres hashes anteriores**, en orden, registrar versión/transacción/resultado sin secretos. Verificar tablas, PK/FK/checks, índices, triggers, firmas, grants y todas las políticas RLS con catálogo real.
2. Separadamente, con autorización expresa de despliegue, revisar cuota/variables y publicar sólo en el site STAGING identificado. Registrar commit, build y deploy exactos. No desplegar main/producción ni permitir gasto implícito.
3. Cuentas sintéticas activas A/B/admin y canarios privados sin contactos reales. A crea contacto/propiedad; B no puede listar, consultar por UUID, editar, asociar ni duplicar datos de A; admin sólo lectura autorizada. Verificar tanto API como RLS directa con JWT legítimos de cada cuenta, no service_role como prueba de aislamiento.
4. Alta/edición/duplicación/publicación/moderación/notificaciones en fixtures con identificadores de run, portada/galería, nombre interno privado, asociación/archivo/restauración; fallo de asociación revierte lo comercial y lo privado. Originales intactos. No dar por probadas notificaciones por comprobar sólo una respuesta HTTP.
5. **Concurrencia real:** dos conexiones/sesiones autenticadas independientes para A, dos demandas propias distintas, barrera de inicio y activación simultánea. Registrar ambas respuestas/tiempos y lectura final: exactamente una urgencia vigente; otra recibe conflicto. Repetir invirtiendo orden, no sustituir por Promise.all sobre una única conexión. Verificar usuarios distintos sin interferencia.
6. Vencimiento: probar límites de 168 h en reloj controlado de destino aislado, sin modificar reloj ni filas reales de STAGING. En STAGING usar fixtures sintéticos mediante mecanismo de prueba autorizado; si no existe, presentar permiso específico para envejecimiento del fixture o esperar expiración real. Renovar desde reloj BD, no acumular extensiones; slot liberado al vencer y demanda permanece activa. Dejar claro si la expiración real hospedada queda pendiente.
7. Galería móvil en viewport y dispositivo táctil, PDF binario generado/inspeccionado y fichas digitales anónimas con canarios privados en fixtures: buscar nombre interno, contacto, notas, IDs privados y metadatos en JSON/HTML/PDF; ninguno debe exponerse. No se certifica PDF sólo por un test de proyección.
8. Comparar al cierre todas las huellas de propiedades existentes con baseline de prevalidación; separar fixtures y escrituras analíticas previstas. Conservar trazabilidad y solicitar permiso antes de eliminar material; ninguna limpieza masiva de datos reales.

## 8. Estado de cierre

| Área | Implementado | Probado localmente | Validado integrado en STAGING |
|---|---|---|---|
| Galería, directorio, nombre interno, urgencias | Sí | Sí, alcance documentado | No |
| Migraciones y RLS | Preparadas | Sí, aislado | No, aplicadas 0/3 |
| Privacidad entre usuarios | Sí | A/B/admin/suspendido aislados | Pendiente |
| Dos activaciones simultáneas reales | Lock/PK implementados | Inspección y pruebas seriales | Pendiente |
| Vencimiento/renovación | Sí | Reloj/fixtures aislados | Pendiente |
| PDF y ficha compartida | Proyección pública conservada | HTML/canarios; PDF binario Sprint 3 pendiente | Pendiente |
| Propiedades existentes | Sin backfill | Regresiones | Integridad de 26 filas comprobada sólo en lectura |

**Autorización que falta:** preparar nueva captura cifrada de STAGING en ventana acordada y ensayo en destino nuevo aislado, con custodia segura y acceso administrativo correcto; o aportar evidencia equivalente recuperable y actual para verificarla. No enviar contraseñas/claves por chat. Después se deberá aprobar el preflight actualizado y el lote de migraciones; el deploy exige autorización expresa separada.

No se emite GO de cierre del Sprint 3 ni de producción. El informe final integrado se completará con resultados reales, no con casillas inferidas de los tests locales.
