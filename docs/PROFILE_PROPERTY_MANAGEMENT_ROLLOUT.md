# Mis propiedades — integración controlada de051

Fecha:2026-10-19CDMX/20octUTC. **RESPALDO PREVIO LOCAL+DRIVE VERIFICADO;051 APLICADA Y VERIFICADA EN QRIH STAGING. ACEPTACIÓN DE FLUJOS NUEVOS PENDIENTE / NO-GO.**

Gate de copia y aplicación de BD concluidos: [respaldo](backup-verification-2026-10-19.json)/[recibo de051](profile-property-management-staging-migration-2026-10-19.json). Usuario autoriza aplicar pendientes; preflight vivo de24tablas/historial y catálogos igual al respaldo. Única nueva pendiente051; transacción con timeout3s/30s y comprobaciones previas/posteriores, historial nuevo en la misma transacción. Resultado051_APPLIED, nueve filas históricas/una051; lectura independiente11aserciones PASS a20oct03:20:48UTC. RLS/policies/ACL ajenas/datos de23tablas y ocho filas históricas sin cambios; bucket privado/WebP intactos.93SQL sintéticas reejecutadas PASS; wrapper sintético valida fuentes/ACL/catálogo/historial y rechazo de reejecución, con digest simulado sólo en ese ensayo.

### Conciliación de historial — no ejecutar un db push indiscriminado

La lista local no coincide literalmente con los identificadores alojados:001–043 están en baseline y044–050 ya aplicadas bajo los siguientes IDs. Verificado tanto en respaldo cifrado como en vivo; **no hay siete migraciones históricas pendientes ni corresponde reparar/rebaselinar**.

| Versión alojada | Nombre |
| --- | --- |
| 20261004051244 | qrih_staging_verified_schema_baseline |
| 20261004051331 | 044_add_property_main_image_path |
| 20261004051334 | 045_make_property_images_private |
| 20261004051336 | 046_soft_launch_authorization_boundaries |
| 20261004051338 | 047_verified_media_ingestion |
| 20261004051340 | 048_atomic_property_writes |
| 20261004053218 | 049_lockdown_function_privileges |
| 20261006201920 | 050_cross_account_opportunities |
| **20261019212016** | **051_profile_property_management — nueva, aplicada en este paso** |

Método: SQL Editor autenticado del proyecto correcto, no conector ajeno ni db push/repair. Wrapper fueraGit ejecuta exactamente el cuerpo canónico sin su BEGIN/COMMIT exterior, dentro de una transacción con guard de corte/esquema/funciones y comprobaciones posteriores; añade sólo la nueva fila de historial051 atómicamente. El text[] conserva un único elemento con el cuerpo y saltos de línea de sus delimitadores. Archivo canónico SHA256 intacto, sin reescribir comentarios iniciales históricos. El primer control independiente del hash de historial omitía esos saltos; se corrigió únicamente el esperado del verificador a partir del wrapper realmente ejecutado, no el SQL ni historial. Aviso heurístico de RLS al incluir DDL dentro de una cadena del verificador cancelado; comparación posterior por hashes, sin pulsar Run without RLS.

Advisor: dos avisos WARNING esperados por EXECUTE authenticated de los nuevos SECURITY DEFINER; permisos y controles internos revisados. No suprimirlos ni cambiar a invoker por inferencia. Vista properties_public mantiene CRITICAL conocido/excepción de proyección pública, security_barrier y filtro published+activo+habilitado verificados. Otros avisos preexistentes enumerados en recibo, no corregidos por esta migración; no afirmar cero hallazgos.

No retiros/duplicados ni uploads/borrados reales, cambios RLS/buckets, nuevas capturas/restores, commits/push/deploy/producción. Respaldo/release consumido no se repite. Los gates1–5 inferiores y frases de051 sin permiso son antecedentes; siguiente gate6 es aceptación localhost con sesión legítima/fixtures nuevos expresamente autorizados, no usar propiedades reales como desechables.

Este procedimiento continúa la [validación local](PROFILE_PROPERTY_MANAGEMENT.md). Su texto no es autorización de operaciones. El usuario confirma una nueva copia cifrada de datos reales, local y segunda copia Drive existente, con ventana sin escrituras. [Preparación](backup-preparation-2026-10-19.json): adaptador separado12tests+39checks sintéticos PASS; login, identidad/Free/cuota Supabase y Drive privado/capacidad verificados. Recibos privados cuota/corte/release único preparados, `--check-ready`PASS con consulta vacía; captura aún pendiente de terminal personal. No repetir login ni permiso de copia; aplicación SQL, cambios de servicio, Git y deploy siguen separados.

## Revisión y controles locales nuevos

- Rama `feature/profile-property-management`, HEAD/develop `a496790ecc4169cb291232923f0f746ffef45440`, main `55b773756066cd3975b3964dc67f106cf15ead4c`; sin nuevos commits, índice no preparado por este paso, cambios previos preservados.
- Revisión dirigida del SQL051, entradas de retiro/duplicación/portada, servicio compartido, formularios y tarjetas. Cuenta activa/propietario verificados en RPC; autorización de copia antes de Storage; URLs efímeras no persistidas; transacciones sin llamadas de red y resultado incierto sin limpieza automática. No nuevo hallazgo confirmado en este alcance; no equivale a auditoría exhaustiva ni aceptación remota.
- `npm run preflight`:PASS, configuración local dirigida a STAGING según guard y clave privada examinada ausente del bundle cliente existente. Sólo presencia/tipo/guard local; no valida pertenencia remota de claves opacas, permisos vigentes, cuotas ni SMTP.
- `node scripts/git-secrets-check.mjs`:206archivos del índice,0hallazgos. Revisión adicional del contenido de trabajo actual:237archivos Git/no ignorados,236textos,0hallazgos de los patrones de claves/JWT/URIs con credenciales examinados. Conteos de ese corte, antes de añadir este documento; no escaneo de historial, archivos ignorados, bóvedas o garantía universal de ausencia de secretos. No se imprimieron valores.
- Lockfile y migraciones anteriores sin cambios;051 sigue nueva y sin versionar. No dependencias nuevas. `git diff --check`PASS.
- Capturador anterior inspeccionado, NO ejecutado: `CAPTURE_RELEASED=false` intacto. No ejecutar `--capture`, ni `--check-ready` como si fuera offline; este último contacta STAGING. No quitar el bloqueo ni reutilizar recibos de cuota/corte antiguos como autorización.

La guía Supabase orientó permisos mínimos y separación entre respaldo de BD y archivos Storage. [Funciones](https://supabase.com/docs/guides/database/functions), [respaldos](https://supabase.com/docs/guides/platform/backups). No se usó el conector ajeno ni se consultó el proyecto alojado para estos controles.

## Qué modifica exactamente051

Archivo canónico: `supabase/migrations/20261019212016_051_profile_property_management.sql`, SHA256 `cdf2076a623d694a04c75036cae45ed6d54bb6dbc86d2888a5449c8b0ef1a549`.

| Objeto | Efecto previsto |
| --- | --- |
| `qrih_protect_property_fields()` | Reemplaza la función de guard046, preservando sus restricciones; añade sólo retiro published→draft del propietario activo, sin cambiar campos comerciales/administrativos; registra audit atómico |
| `qrih_withdraw_own_property(uuid)` | Nuevo RPC del propietario activo: bloqueo de fila, retiro explícito; repetición sobre draft no duplica evento |
| `qrih_duplicate_request_unique` | Nuevo índice único de audit_logs para acción property_duplicated por actor/request_id; su creación toma bloqueos y puede fallar ante conflictos existentes |
| `qrih_duplicate_property(uuid,uuid,jsonb,jsonb)` | Nuevo RPC: consulta sin escritura o creación de nuevo draft comercial con0–7rutas independientes, galería/portada/audit y serialización por intento |
| Privilegios de estas funciones | Guard sin EXECUTE público/anónimo/authenticated; los dos RPC sólo authenticated, con checks internos y search_path vacío |

No crea tablas/columnas/enums/policies ni cambia bucket/MIME/límite7; no reescribe registros existentes ni borra datos. Las funciones sólo producen cambios de negocio cuando se invocan, no por crearlas. Aplicar DDL sigue siendo una operación real con bloqueos: revisar antes, no inferir ausencia de impacto por falta de UPDATE masivo.

## Gates de preparación — historial del plan;1–5 completados,6–7 pendientes

1. **Permiso para nueva copia y ventana sin escrituras: CONFIRMADO.** Entorno QRIH STAGING `mcyxunymhuxyiwklyfpy`, BD/Auth/Storage cifrado, copia local y segunda copia cifrada Drive existente. Nunca producción, conector ajeno ni copia recuperada; no solicitar secretos en chat. La copia del08oct no es un respaldo fresco para051. No repetir este permiso.
2. **Adaptador separado preparado/probado y readiness PASS, sin liberar el antiguo.** `capture-staging-20261019.mjs` conserva lógica/formato revisados y añade recibos frescos/corte exacto/claim de uso único mediante `capture-release-20261019.mjs` fueraGit.12tests+39checks sintéticos PASS; identidad/QRIH Staging/Free/cuota actuales observadas. Recibos de cuota/release/corte preparados, sin consumo ni exportación. Espacio/permisos locales, clientes firmados y Drive privado/capacidad comprobados. Metadatos SQL del origen se verifican antes del dump y después dentro de captura; no cubiertos por readiness RESTlimit0. Corte final fijado tras documentos, sin ocultar cambios ni certificar RC por ese digest. Credenciales sólo en proceso previsto/prompt oculto del usuario.
3. **Captura autorizada y verificación.** Origen sólo lectura/TLS verificado; generación única, cifrada, sin sobrescribir anteriores ni crear paquetes con datos sin cifrar en Git/Drive/logs. Comprobar inventario, hashes, cobertura BD/Auth/bytes Storage, coherencia del corte antes/después y descifrado/verificación en el mecanismo privado ya revisado. No repetir restore funcional histórico ni borrar el destino para probar esta copia. Ante cambios de origen, cuota o error, conservar generación anterior y parar.
4. **Segunda copia con alcance autorizado.** Sólo paquete cifrado, carpeta Drive privada existente, capacidad/permisos y readback/tamaño/hash comprobados de nuevo. No leer ni trasladar clave privada con el paquete. No pagar ni retirar generaciones para liberar espacio por inferencia. Si esta transferencia no está autorizada o no puede verificarse, registrar la limitación y detener el gate de respaldo.
5. **Revisión previa a aplicación y permiso SQL separado.** Comparar estado vivo044–050/funciones/trigger/ACL/policies/índices y ausencia de051/conflictos; registrar sólo resultado/fingerprints sanitizados. Identidad del proyecto no se demuestra sólo con current_database=postgres. Mostrar diferencias y efectos exactos. No ejecutar reset, repair de historial, db push global ni migraciones pendientes adicionales. Fijar ejecución de051 y registro de historial coherentes con CLI revisada; transacción, lock_timeout/statement_timeout acotados y parada sin reintentos automáticos ante conflictos. Copia verificada no autoriza por sí sola aplicar051.
6. **Integración de código sólo local contra el STAGING autorizado.** Tras confirmar aplicación e historial: catálogo/privilegios/RLS, nuevas funciones y preservación de datos previos; probar las tres mejoras con fixtures nuevos explícitamente autorizados. No retirar ni editar una propiedad real existente como fixture por inferencia. Usar cuenta existente apropiada, sin crear tercera cuenta externa. Auth/Storage físicos y UI autenticada siguen siendo pruebas necesarias, no cubiertas por las93SQL sintéticas.
7. **Entrega Git y RC separados.** Revisión del diff/secretos, commits identificables y permisos de integración/push, nuevo manifiesto de entradas/SHA. Verificar builds Netlify detenidos antes de cualquier push; no reactivar deploy automático. Sin Netlify salvo autorización explícita de un RC con cuota Free vigente, READY y validación de plataforma. No utilizar manifiesto/READY antiguos ni afirmar que sólo falta desplegar.

## Aceptación mínima nueva, no repetir auditorías cerradas

- Propietario publisher activo: cancelar retiro conserva publicada; confirmar mismoID→draft, desaparece de nuevas lecturas públicas; edición→pending→moderación normal. Cuenta ajena/suspendida y anónimo no retiran ni duplican. Admin no hereda propiedad para estos RPC.
- Duplicar: visitar sólo precarga; guardar nuevoID/draft; original/relaciones conservados;0/7fotos y rechazo8ª; portada/orden correctos, bytes WebP/procedencia/rutas independientes. Borrar foto o duplicado no afecta original; cualquier borrado del fixture requiere alcance explícito.
- Repetición/doble envío y resultado incierto: una fila/intento; no eliminar fotos posiblemente confirmadas. Contención real multisesión pendiente, no sustituirla por pruebas secuenciales.
- Portadas1440/375/320px con sesión real, sin datos cruzados ni overflow; renovación/expiración900s y denegación tras pérdida de sesión. Firmas anteriores siguen su TTL; no prometer revocación retroactiva de PDFs o bytes descargados.

## Si falla la integración

No intentar DROP, restaurar backup sobre el origen, cambiar RLS/buckets, reparar historial ni republicar Netlify automáticamente. Conservar diagnóstico sanitizado y estado observado. Si la transacción DDL aborta, verificar rollback sin asumir que se aplicó; no reintentar ciegamente. Si051 ya confirmó, volver a código anterior no revierte datos ni DDL; revisar compatibilidad y autorizar cualquier corrección/inversa específica. El backup es contingencia, no permiso para sobrescribir.

**Siguiente gate actual:** aceptación nueva desde localhost contra QRIH STAGING, con sesión legítima y fixtures separados expresamente autorizados.051 ya aplicada/verificada: no volver a solicitar ese permiso ni repetir DDL/captura/restore. El permiso actual no autoriza retirar/duplicar datos reales para probar, borrar fixtures ni Git/Netlify. Operación diaria/RPO/RTO24h y aceptación integral siguen abiertos/NO-GO.
