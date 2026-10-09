# QRIH — Preparación del candidato local

2026-10-08. **CÓDIGO INTEGRADO EN DEVELOP Y COMPILADO LOCALMENTE; NO ES UN RC APROBADO/TAG NI UN GO DE LANZAMIENTO.** Usuario autoriza commits y después consolidar/compilar local. Main intacta, sin push/PR/deploy/producción ni reabrir descifrado/restore AUD-018 rechazado. Este corte superior sustituye las propuestas/permisos históricos inferiores.

## Corte vigente — integración local, compilación y servidor reabierto

Autorización posterior «ok, adelante»: árbol limpio/ancestry/worktree/hook scope revisados, develop54faaf1→4302feffc30413e23efb7179289b6bb6824df666 por fast-forward. Conserva19commits de la cadena034/035/036, historia documental018 y las tres correcciones/tests separados; no cherry-pick/merge commit/rebase/force ni rama nueva. Main55b773756066cd3975b3964dc67f106cf15ead4c intacta; cached origin/develop54faaf1, no consulta/push remoto. Migraciones/lock no cambian respecto al develop previo; versionar no ejecuta SQL. Documentación del corte posterior se guarda aparte y no cambia entradas compiladas.

| Control nuevo | Resultado / límite |
|---|---|
| Build local exacto | PASS de4302feffc30413e23efb7179289b6bb6824df666, Next16.3.6/28páginas/Proxy/BUILD_ID `BDbYKXtzF6xa9a_dDnnJm`. Sin cambio de fuentes durante/después. |
| Identidad de entradas |167entradas Git6efd78e/Git4302fef/trabajo/manifest iguales; agregado f9fc6cbb2f0d15a89943403650a2532cf93edddd050f5d04587fc86cd9494ca9. No hash de binario/garantía universal del proveedor. |
| Preflight | PASS: entorno STAGING fijo/roles de clave/clientbundle sin nombre/valor privado examinado; no verifica políticas/proveedores activos. |
| HTTP compilado localhost |25PASS/0fallos/0skips, sin sesión y sólo lecturas/peticiones inválidas. Cache privada/callbacks inválidos/recovery inválido, no alta/edición/borrado válido/correo. |
| Runtime | Anterior detenido por SIGINT normal antes de build;3107 libre. Nuevo start guardado/verificación de claves por proyección pública limit0/Ready; bind observado sólo[::1]:3107 y .next700. Sin valores/envs privados impresos ni artefacto distribuido. |
| Sesión legítima | Panel privado/publicación sintética conservados después de recarga sobre servidor nuevo. Sólo UI, no cookies/tokens inspeccionados/caducidad forzada/logout/datos mutados. **No prueba de refresh real**. |
| Pruebas conservadas |114unit/lint/tipos/43SQL de lotes previos sobre mismas entradas, no reejecutados ahora por mover la rama. No audit nuevo/deploy/restore ni query SQL de datos. |

Build compila sin heredar clave privada en el env del hijo; runtime sí usa la clave de servidor local con guardSTAGING. Next puede incluir entorno en caché: .next restringido/ignorado, no archivado/subido a Git. No se modificaron .env reales ni configuración Supabase/Netlify. Guía Supabase orientó aislamiento, separación entre identidad/autoridad y no convertir recarga/reinicio en aprobación de renovación prolongada.

**Siguiente:** sesión natural tras caducidad/callback positivo local delimitados; push Git separado con permiso/guard Netlify/Free/refs frescos y sin deploy de desarrollo; RC Netlify sólo autorizado/cuota/SHA READY/humo exactos. AUD-018 pausado/ALTO/NO CORREGIDO, originalAUD002/corte elegido pendientes: NO-GO Soft Launch. No reabrir respaldo ni repetir login/alta ya comprobados. Los cortes inferiores sin integración/build del SHA son históricos.

## Antecedente — commits separados y sesión inmediata antes de integrar

| Commit local | Alcance revisado |
|---|---|
| f55ab65ec3ef1df56421eec847fa64fb417e4f61 | AUD-037: dos componentes, suite14 y adición individual al comando test. |
| 0ca5a698c74f2d077814329ed41dab676dd3e80d | AUD-038: dos handlers, suite9 y adición individual al comando test. |
| 6efd78ece7c433f95ae6c5b40f17eaed8fc371f4 | AUD-036: cuatro pruebas adicionales SSR y fixture, sin nueva corrección funcional. |

Documentación/manifest en un cuarto commit separado. **Commit de código candidato local:6efd78ece7c433f95ae6c5b40f17eaed8fc371f4**, sin integración/tag/RC aprobado.167 entradas ya versionadas, huella f9fc6cbb2f0d15a89943403650a2532cf93edddd050f5d04587fc86cd9494ca9 igual en manifest, objetos Git y trabajo; ninguna diferencia funcional pendiente. `develop`54faaf1/main55b7737 intactos; no lectura remota nueva. Helper de cotejo sólo lectura fuera del checkout verifica alcance/bytes/modes/hash y refs, no env real/red/datos/secretos.

114unit/0fallos/0skips, lint completo/tipos sin emisión reejecutados PASS antes de versionar fuentes idénticas. Índice revisado antes de cada commit:0hallazgos. Build/preflight/25HTTP/43SQL anteriores se conservan; **no build certificado de este SHA**. No sustituir `.next` mientras el servidor del ensayo esté en uso; recompilar localmente al fijar RC/ventana, sin deploy.

Usuario inicia sesión personalmente; agente observa `/mis-propiedades` localhost3107 con panel privado/publicación sintética y lo conserva después de recarga completa. No extracción de cookies/tokens/contraseña, captura con PII, correo ni mutación de cuenta/propiedad. Runtime loopback/STAGING sigue activo. Esto valida acceso/persistencia inmediata, **no renovación tras caducidad ni callback positivo local**; no cambiar TTL/confirmación/SMTP ni repetir login/alta ya completados. Guía Supabase mantuvo separados estos niveles de evidencia.

Siguiente permiso distinto: integrar localmente develop por ancestry revisada; push necesita autorización propia y guard/refs/Free frescos, Netlify sólo RC explícito/cuota/READY exacto. No interpretar commits como esos permisos. AUD-018 pausado/ALTO/NO CORREGIDO y bloqueante, original AUD-002/corte/RC externo pendientes: **NO-GO Soft Launch**, sin waiver.

## Antecedente — AUD-037/038 antes de autorizar Git e iniciar sesión

Usuario pide continuar auditorías hasta necesitar su ayuda. Confirmadas por regresión previa y corregidas por separado: [AUD-037](AUD037_IMAGE_EDITOR_RACE.md) estado de fotos durante optimización; [AUD-038](AUD038_AMBIGUOUS_WRITES.md) resultado incierto de RPC/limpieza posterior. Cambian dos componentes y dos handlers, package.json añade suites, sin lock/migraciones/BD/RLS/Storage real ni arquitectura nueva. Los snapshots/huella y propuesta de dos commits inferiores son **históricos**, no candidato actual.

Manifest actualizado: **167 entradas**, incluidas exactamente dos suites nuevas aún sin seguimiento Git. Huella vigente **f9fc6cbb2f0d15a89943403650a2532cf93edddd050f5d04587fc86cd9494ca9**. Diferencias contra HEAD: dos handlers, ImageUploader, PropertyImageEditor, package.json, tests/ssr-session.test.mjs y las dos nuevas suites. HEADafab3b7/develop54faaf1/main55b7737 intactos; entradas versionadas HEAD/ac26f64 siguen iguales. No SHA RC commit/tag ni integración realizada.

**Verificación:**114unit PASS (14AUD037+9AUD038+91previas), lint completo/tipos sin emisión/build local/preflight y25HTTP compilado localhost sin sesión PASS. 43SQL PGlite del paso anterior conservadas, no nuevos SQL/rollout. Sandbox bloqueó start/verificación y HTTP con EPERM; ejecución guardada/same smoke fuera del bloqueo PASS, no cambio de código por esa restricción. Sólo última indentación tras build sin cambio de semántica; build del SHA RC futuro debe fijarse después de versionar, no atribuir este artefacto a un commit inexistente.

Runtime **http://localhost:3107** activo, guard fijo STAGING/puerto loopback; login abierto para intervención personal. Ayuda inmediata: usuario inicia sesión legítima existente y responde listo, sin contraseña/token/enlace compartidos. No alta/correo/modificación de cuenta automática ni tercera cuenta omitida. A partir de esa sesión se delimita renovación prolongada/callback positivo, no alterar TTL/confirmación para acelerar.

Comprobación final:167 rutas/hashes/agregado coinciden con manifest guardado; refs HEAD/develop/main intactas, diff check PASS. Scanner índice198/0 hallazgos y patrones secretos en19 archivos de trabajo modificados/nuevos/0 hallazgos; .next modo700. Controles acotados, no garantía universal ni escaneo nuevo de todo el historial. No cuerpo de credencial/env privado impreso ni archivo de respaldo/clave leído.

Integración futura mínima cambia a **cuatro commits separados propuestos**: AUD-037/componentes+suite, AUD-038/handlers+suite (cada uno su actualización de test), pruebas SSR AUD-036 pendientes, y documentación/manifest. Revisar hunks de package.json sin mezclar correcciones. Luego fast-forward local por ancestry revisada si se autoriza; sin inventar ramas/rebase/force ni perder historia. Preparar AUDs no autoriza Git/push/main/PR/Netlify; revalidar remoto/guard/cuota antes de acciones posteriores. AUD-018 pausado/NO-GO externo sigue igual.

## Corte anterior comprobado — antes de AUD-037/038

| Referencia local | SHA / alcance |
|---|---|
| develop y caché origin/develop | 54faaf1c079251a8cde8974c14b59e038488fc2b; incluye AUD-031. No lectura remota nueva. |
| Punta funcional fix/aud-036-ssr-session | ac26f643cd8393b1bb9097be4837dcf9d12db905; descendiente de develop, incluye AUD-034/035/036. |
| Checkout actual docs/aud-018-recovery-preparation | afab3b774159806f752f29ea59cbbf4dfd11496b; avances posteriores a ac26f64 sólo documentales. |
| main local | 55b773756066cd3975b3964dc67f106cf15ead4c, intacta. |
| Delta de código sin commit | Sólo tests/ssr-session.test.mjs: cuatro pruebas nuevas y extensión de fixture; aplicación/config/migraciones/lock sin cambios nuevos. Documentación local pendiente se conserva. |

No se creó rama/tag/PR ni se movió ninguna referencia. No se infiere que GitHub siga igual por tener una caché local origin/*. Antes de integrar/enviar se necesita lectura remota nueva y revisión de divergencias.

## Correcciones que deben acompañar al candidato

Cadena ya existente, orden comprobado desde develop hasta ac26f64:

| Commit | Auditoría | Función |
|---|---|---|
| 6da8465926f32bd8cfac7702decc4bd1ca98b2a3 | AUD-035 | Documenta builds detenidos; el commit no cambia configuración remota ni demuestra su estado actual. |
| 3d683acb424804e8a8e8ac0b8608ad5c3b87ef2c | AUD-034 | Aislamiento localhost/STAGING, guard de entorno/runtime/build y plantilla ignorando secretos. |
| 51b1ec81cd63847c05cab470c2e55b1426bc1ed5 | AUD-034 | Verificación de claves por proyección pública limit=0, no por catálogo reservado. |
| ac26f643cd8393b1bb9097be4837dcf9d12db905 | AUD-036 | Persistencia de renovación SSR privada request/response, pruebas y exclusiones callback/recovery. |

La huella actual incluye las cuatro pruebas aún sin commit. No introducir dependencias/features/migraciones nuevas para empaquetar. Lock AUD-031 y migraciones 001–050 son iguales a develop en este delta. **Versionar migraciones no autoriza ejecutarlas**: staging usa baseline+044–050, no aplicación consecutiva001–050. Original no recibe rollout por inferencia.

## Huella verificable del contenido

[rc-candidate-inputs-2026-10-08.json](rc-candidate-inputs-2026-10-08.json) inventaría **165 entradas versionadas**: aplicación/componentes/lib/public, scripts, tests, package/lock/config/proxy, plantilla/ignore, migraciones/checks y baseline SQL sintético. Para cada archivo registra ruta, modo Git, bytes y SHA256; agregado ordenado definido en el propio JSON.

- Entradas de HEAD y ac26f64: **9eff36742b9608eb606516ee4f0deb64900e66f19d95a3d8365a63471d988c59**, iguales.
- Entradas de trabajo, incluyendo nuevas pruebas: **70d60015af5f9831a463dd1a1b599fd09ed7c6f7f01593c9dd58eae8ff8f3a59**.
- Única diferencia seleccionada respecto a HEAD: tests/ssr-session.test.mjs.

Es una huella de entradas seleccionadas, **no** SHA de commit, build, archivo desplegable, dependencia instalada ni configuración activa de proveedor. Excluye documentación para evitar autorreferencia, .env reales/estado CLI/cachés/.next/node_modules y copias/claves/herramientas externas. No se archivaron ni copiaron secretos/PII/artefactos de build. Helper de inspección sólo lectura fuera de Git:15 controles de alcance/agregado PASS; referencia Git y sistema de archivos cotejados sin red. Una primera inspección granular emitió avisos confstr y excedió el primer intervalo de salida; se reemplazó por lectura de objetos por lote, sin mutar referencias ni contenido.

## Evidencia local y límites

| Control | Resultado vigente |
|---|---|
| Unidad/SSR del paso anterior sobre mismas entradas | 91 unit PASS,0 fallos/skips;14 SSR incluidos, no sumar como105. No reejecutados en esta preparación. |
| Lint completo | PASS,0 warnings, ejecutado ahora sin escribir fuentes. |
| Tipos | PASS,--noEmit/--incremental false, sin generar caché/reescribir fuentes. |
| SQL/RLS aislado | 43 PASS,0 fallos/skips; PGlite externo existente, fixtures en memoria, sin .env ni Supabase/BD local de recuperación. No certifica políticas remotas activas. |
| Cambios/identidad/secretos | diff check PASS; referencias intactas;165 rutas/hashes/agregado cotejados nuevamente con el manifest guardado y delta test único. Scanner índice198 archivos/0 hallazgos; patrones secretos en10 archivos de trabajo modificados/nuevos/0 hallazgos. Son controles de patrones, no garantía universal ni revisión nueva del historial completo. |
| Build/HTTP/audit/preflight conectado | Evidencia anterior conservada; no nuevos resultados ni compilación ahora. Para el SHA integrado se revalida proporcionalmente, no se reutiliza un build como si perteneciera a otro commit. |
| Proveedores/cuentas/datos | No reconsultados/modificados ahora. Guard Netlify, cuota y referencias GitHub necesitan estado fresco antes de operaciones posteriores. |

Supabase/PostgreSQL orientaron separar fixtures de permisos efectivos, identidad/cookies de autorización, mínimos privilegios y configuración externa de código. No se abrieron grants/RLS ni se usó service_role para fabricar sesiones. [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Integración mínima propuesta — no ejecutada

1. Preservar todos los cambios actuales e historia AUD-018; no reset/checkout forzado/stash/limpieza automática. Obtener permiso concreto para versionado/integración en develop, **excluyendo main y deploy**.
2. Fijar por separado un commit de pruebas AUD-036 y otro documental (incluye este plan/manifest, maestros y estado pausado AUD-018). No mezclar una nueva corrección funcional con recuperación.
3. Integración local propuesta sin nueva rama ni cherry-picks: adelantar develop primero hasta ac26f64 (cadena funcional revisada) y después hasta la punta de la rama documental con los dos commits nuevos. Ambos movimientos deben ser fast-forward, sin reescribir historia. Los commits intermedios AUD-018 sólo son documentación; no cambian aplicación dentro del alcance inventariado ni ejecutan recuperación. Así se conserva su historia y la separación entre correcciones, pruebas y documentos. Si develop deja de ser ancestro, parar y revisar: no merge forzado/rebase/reset automático.
4. Comprobar que el contenido seleccionado coincide con la huella, registrar SHA candidato real y revisar diff contra develop. Si cambian código/config/lock/migraciones o la referencia remota, parar para recalcular pruebas/alcance; no afirmar equivalencia sólo por nombre de rama.
5. Verificar builds detenidos/sitio/repo/develop/Free/recargas-overages off por lectura fresca **antes de push**. GitHub como fuente oficial del candidato; publicación Git requiere permiso distinto del versionado/integración local. Sin PR/commit/push/merge/force/tag automáticos por este plan. Integrar en develop sólo con permiso explícito y preservando main.
6. Validar sesión legítima prolongada y callback positivo localhost con cuenta existente en ensayo acotado, sin nuevas altas, contraseñas artificiales, correos repetidos ni tercera cuenta omitida. No bajar TTL/desactivar confirmación para terminar más rápido.
7. Un único deploy de RC en Netlify exige autorización distinta, guard/cuota vigente y SHA READY exacto/humo. Renovar créditos no autoriza deploy. No publicar ni conectar producción/main.

## Bloqueos y decisiones que esta preparación no resuelve

| Pendiente | Estado / efecto |
|---|---|
| AUD-018, ALTO | Usuario pausó análisis privado; respaldo cifrado y ciclo vacío verificados anteriormente, recuperación real no probada. Sigue bloqueante para GO externo; no waiver. |
| AUD-002 original, ALTO | Bucket público/URLs legadas según evidencia anterior, no reconsultado aquí. Corte original necesita autorización/backup/ventana/pruebas propias; staging no se convierte automáticamente en producción. |
| AUD-036, MEDIO | Corrección local y red/concurrencia ficticias aprobadas; sesión/navegador real prolongado y callback positivo pendientes, no bypass ni logout remoto nuevo demostrado. |
| AUD-031 / RC publicado | Parche ya en develop, no READY staging del código pendiente; revisar dentro del RC autorizado, no deploys de desarrollo. |
| Correo/costos AUD-023 | Evidencia de correo previa parcial; aptitud/cuotas y consumo Free no garantizados. Sin cambio SMTP/proveedor/plan. |
| Elección del piloto | No asumir staging como producción ni tocar original/main. Requiere decisión y autorización explícitas después del dictamen. |

**GO sólo para continuar preparación local/integración autorizada. NO-GO para Soft Launch; no deploy autorizado.** Único dictamen maestro: QRIH_AUDIT.md. No reabrir AUD-018 ni repetir UI histórica para completar esta lista documental.
