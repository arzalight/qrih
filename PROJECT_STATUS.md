## PROJECT STATUS — QRO INDUSTRIAL HUB / QRIH

## Actualización vigente — referencia recibida / implementación UX/UI por bloques

**21oct / bloque4:** FormField/publicación/edición/requerimiento/contacto con etiquetas asociadas; panel/perfil con tokens y saludo neutro; carga/éxito de publicación accesibles sin cambiar datos/handlers.32UI y157aplicación,lint/tipos PASS; publicación real1440 etiquetada/sin overflow, guardados nuevos y aceptación responsive integral pendientes. [Registro](docs/PRELAUNCH_UI_IMPLEMENTATION.md). NO-GO visual; sin push/deploy/BD.

**21oct / bloque3:** catálogo, detalle y galería implementados localmente; tarjetas con alt/lazy/dimensiones, filtros sin cambiar GET, detalle con precios/visibilidad existentes y visor con foco/Escape/Tab/flechas verificados.21UI y157aplicación PASS,lint/tiposPASS. UX-003 corregido localmente,UX-012 texto corregido; nueva pasada integral de cuatro anchos pendiente por timeout del control de viewport, no PASS inferido. [Evidencia y límites](docs/PRELAUNCH_UI_IMPLEMENTATION.md). Sin nuevo RC; NO-GO visual conservado.

**21oct / bloque2:** navegación/layouts implementados y verificados localmente en catálogo y `/admin` con sesión legítima:375/768/1024/1440 sin overflow,Escape/foco y estado activo. Variante admin sólo tras guards existentes; `/panel` redirige al panel real, filtros admin ya no desbordan en tableta.18UI/12regresionesAuth-notificaciones,lint/tiposPASS. No datos cambiados ni nuevoRC. [Registro por bloques](docs/PRELAUNCH_UI_IMPLEMENTATION.md); resto pendiente / NO-GO visual.

[Seguimiento de implementación](docs/PRELAUNCH_UI_IMPLEMENTATION.md): referencia AVIF740×528 recibida/inspeccionada, bloqueo gráfico superado. Bloque1 de tokens/base implementado y validado localmente (11UI,lint/tiposPASS; catálogo13precios sin clipping en375/768/1024/1440). Resto pendiente según tabla; NO-GO visual, sin nuevoRC ni deploy. No tocar Supabase/Auth/RLS/reglas de negocio. Los apartados siguientes conservan el diagnóstico y RC anteriores, no el estado de implementación actual.

### Corte anterior — diagnóstico inicial antes de recibir la imagen

## Estado vigente — 20oct2026 / auditoría UX/UI inicial, NO-GO del rediseño

[Inventario, hallazgos y plan visual](docs/PRELAUNCH_UI_AUDIT.md). Rama local `feature/prelaunch-ui-review`, base1992ca8/develop inicialmente limpio.25archivos de página inventariados/28entradas visuales;19vistas×4anchos=76mediciones locales.157pruebas de aplicación y31HTTP locales PASS,0fallos/0skips;lint/tiposPASS. Recorte de precio en tableta, labels/foco de galería, contraste y panel antiguo con métricas fijas identificados, NO corregidos todavía. Referencia gráfica mencionada en la solicitud aún no recibida; sólo llegó texto.

| Alcance | Implementado en código | Validado localmente | Pendiente de STAGING | Validado en STAGING |
| --- | --- | --- | --- | --- |
| Nuevo rediseño UX/UI | NO; sólo auditoría/documentación | Diagnóstico de base y pruebas existentes, no UI nueva | Todos los bloques y aceptación remota, sin deploy autorizado | NO |
| Editar/Duplicar/portada/Compartir/MXN-USD existentes | SÍ, confirmado en fuentes; no reconstruir | Render representativo y suite base; sin nuevo guardado | Regresión tras rediseño | RC anterior según dictamen comercial inferior, no transferible al rediseño |

**NO-GO para presentar el nuevo alcance visual como terminado/listo para Soft Launch.** El GO condicionado inferior sigue acotado al artefacto anterior5f7b8e2, no a un rediseño aún inexistente. Sin cambios funcionales, Supabase, RLS, migraciones, datos de negocio, producción/main o Netlify. Administración sólo mostró acceso restringido con la sesión local: interior pendiente de rol legítimo. No afirmar WCAGAA ni métricas de rendimiento certificadas.

### Corte previo — RC comercial anterior al nuevo alcance visual

## Estado vigente — 20oct2026 / GO CONDICIONADO del Soft Launch supervisado

**Estado de entrega:** autorización humana explícita recibida para subir a `arzalight/qrih` privado documentación con rutas locales de respaldos, referencias/IDs/enlaces de Drive y referencias de custodia, visibles a sus colaboradores; quedan excluidos claves, contraseñas y archivos de respaldo. Se reanuda el cierre documental tras la detención preventiva, sin eludir controles. La entrega no cambia fuentes funcionales, `main` ni el RC publicado `5f7b8e2`, y no autoriza otro deploy.

**GO CONDICIONADO para el piloto en el QRIH STAGING existente, con los límites operativos ya aceptados.** [Dictamen](docs/SOFT_LAUNCH_GO_2026-10-20.md) / [aceptación comercial](docs/COMMERCIAL_ACCEPTANCE_2026-10-20.md) / [recibo](docs/commercial-acceptance-2026-10-20.json). Sustituye el NO-GO por altaUSD/duplicación/revisión pendientes; no GO de producción ni invitaciones/publicaciones automáticas.

| Función | Estado comprobado |
| --- | --- |
| PROP-008 · compartir | IMPLEMENTADO / LOCAL VALIDADO / STAGING VALIDADO ACOTADO: copiar con sesión legítima, ficha anónima200, galería/6WebP/PDF y rechazo de no publicadas |
| PRICE-001 · MXN/USD | IMPLEMENTADO / LOCAL+STAGING VALIDADOS ACOTADOS: altaUSD7.50, copia completa independiente, revisión conservaUSD/m2; ediciónMXN→USD→MXN, filtros y cinco correcciones humanas sin conversión |
| PROP-003/006/007 · extensión | Nuevo original pending con1WebP y copia draft0fotos; origen/copia independientes por hashes. Anteriores rejected/draft con7fotos conservadas. No nueva duplicaciónUSD de7fotos declarada |
| PDF-001 · extensión | PDF real remoto3páginas/6fotos, anunciado6.50USD y total73,788USD, render revisado; AUD043MEDIO de enlace no canónico abierto |
| AUD-041 / AUD-042 | ALTO/CONFIRMADOS: datos reconciliados y verificados; formatter corregido/desplegado/verificado en el RC |

RC publicado `5f7b8e2a50c55ea1b4320746f1a7468e8e1ce623`, deploy `6ad82c6afc32e2d1cb980405`, READY/SHA exactos.157unit remotas/31HTTP PASS,0fallos/0skips;109SQL sintéticas, lint/tipos/build/preflight previos y scanner remoto276archivos PASS.187entradas funcionales/huella5f72e610… siguen iguales.052 aplicada una vez, respaldo previo local+Drive/tres generaciones y cinco preciosUSD ya comprobados, no repetidos.

Aceptación nueva sobre dos registros adicionales expresamente autorizados, términos/alta inicial por el usuario. Total4fixtures sin publicar; privacidad anónima de tabla/vista/ficha/detalle/PDF y Storage probada; otra sesión autenticada recibe404 en edición ajena. No contacto comercial/borrado/restore/producción/main ni nuevo deploy. Código/GitHub oficiales en develop; documentación posterior no es otro artefacto.

Sin bloqueante crítico/alto confirmado pendiente para este piloto en el alcance probado. AUD018 sigue con riesgo operativo aceptado, no totalmente corregido; RTO24h/carga/concurrencia/renovación prolongada y todos los roles/estados no medidos en vivo. Mantener Fabián supervisor, copia cifrada por día de uso/antes de cambios y pausa manual ante fallo de respaldo/correo/cuota. AUD043MEDIO/permalinkPDF actual200, corrección futura autorizada. Cortes inferiores históricos, no gates que deban repetirse.

### Integración anterior al RC publicado

**Continuación autorizada posterior:** usuario permite hasta dos registros sintéticos adicionales sin publicar para altaUSD/duplicación/revisión. Formulario de alta preparado en el propio RC STAGING con USD7.50/m²,100m² y título NO COMERCIAL; ningún registro nuevo guardado ni términos aceptados por el agente. Pausa de intervención humana en aceptación legal y Guardar como borrador; no solicitar el permiso de fixtures nuevamente. Documentación publicada en develop9096ffd, artefacto funcional sigue5f7b8e2; esta nota posterior es local y no produce otro build.

**NO-GO comercial hasta nuevo RC y aceptación remota.** [Control vigente y hallazgos](docs/COMMERCIAL_INTEGRATION_2026-10-20.md) / [recibo](docs/commercial-integration-verification-2026-10-20.json). Respaldo nuevo local+Drive verificado y tres generaciones conservadas;052 APLICADA UNA VEZ en QRIH STAGING, historial/huellas/ACL/RLS/Storage contrastados. No repetir captura ni migraciones cerradas.

| Función | Estado realmente comprobado | Pendiente |
| --- | --- | --- |
| PROP-008 · compartir | Menú/copiar con sesión real; ficha anónima200, seis WebP y rechazo draft/rejected/inexistente404 | RC remoto y resto de matriz |
| PRICE-001 · moneda | 052 integrada; cinco precios USD confirmados y corregidos sin conversión, cinco auditorías verificadas (AUD-041 ALTO) | RC y aceptación comercial restante |
| PDF-001 · extensión | PDF real localhost+STAGING,3páginas/6fotos, precio6.50USD y total73,788USD, texto y render revisados | Origen/ejecución Netlify |
| AUD-042 · unidad heredada | Corregido local+GitHub77cd680;157unit/109SQL PASS, lint/tipos/build/preflight PASS; anuncio original conservado sin inventar total | Despliegue/verificación del nuevo código |

Código en `feature/commercial-sharing-currency`,HEAD77cd680; develop/main todavía sin integrar. Localhost3107 activo contra STAGING. Ningún nuevo deploy iniciado. Advisors conserva excepción de vista pública y avisos documentados; no certificación universal. RTO24h/carga y límites operativos previamente aceptados conservados. Los cortes inferiores son históricos y no tareas pendientes vigentes.

### Antecedente comercial anterior a respaldo/052

## Estado anterior — 2026-10-20 / NO-GO por nuevo alcance comercial

El usuario añadió Compartir y MXN/USD como requisitos del Soft Launch. Confirmó que los importes históricos son MXN y que **sólo se comparten propiedades published**. El GO condicionado del artefacto previo no aprueba estas funciones. [Entrega, matriz y procedimiento](docs/COMMERCIAL_SHARING_CURRENCY.md).

| Función | Implementado en código | Validación local | STAGING nuevo |
| --- | --- | --- | --- |
| PROP-008 · Compartir/ficha comercial pública | Sí, sólo published y cuenta habilitada; sin tokens privados/contactos/captación | Helper/SSR/SQL, escritorio/375/320 y PDF sintético | Pendiente |
| PRICE-001 · MXN/USD | Sí: publicación/edición/duplicación, paneles, catálogo, ficha/PDF y filtro seguro | 156 pruebas de aplicación y 109 SQL temporales PASS, sin omisiones; lint/tipos/build/preflight locales PASS | 052 NO APLICADA / NO VALIDADO |

052 propuesta: columna price_currency limitada a MXN/USD, numeric/importes históricos sin reescribir, RPC/ACL/vista y lecturas exactas compatibles. Prueba en memoria autorizada y realizada. El usuario autorizó continuar hasta deploy el 20oct; aplicación cloud y RC siguen sujetos a controles previos, no son acciones ya realizadas. No publicar USD sobre el Netlify anterior. Presupuestos sin moneda no se comparan; firmas existentes duran su TTL. [Límites y riesgos](docs/COMMERCIAL_SHARING_CURRENCY.md#riesgos-y-límites).

Código y pruebas entregados en GitHub, rama `feature/commercial-sharing-currency`, commit `715e42acf27a515721229a7aab75c8c241640194` (41 archivos funcionales verificados). `develop` y `main` no se integraron. [Control previo al despliegue](docs/COMMERCIAL_DEPLOY_GATE_2026-10-20.md): Netlify Free con 268,5/300 créditos y builds detenidos. Falta respaldo nuevo: la copia íntegra anterior precede a 051 y a cambios posteriores, por lo que no sustituye una captura previa a 052. No nueva captura/transferencia, migración ni deploy en este control. Localhost sigue detenido para no servir código contra un esquema aún incompatible. **NO-GO comercial conservado.**

**Actualización20oct / autorización de respaldo recibida:** usuario confirma nuevo respaldo cifrado BD/Auth/fotos local+misma carpeta privada Drive. Adaptador separado de un uso preparado;15pruebas de controles+39checks sintéticos PASS, clientes PostgreSQL17.11 firmados/verificados. Identidad/QRIH Staging/Free, egreso0,06/5GB y Drive11,25/15GB observados; carpeta de copia sólo owner. [Preparación y siguiente intervención](docs/COMMERCIAL_BACKUP_PREPARATION_2026-10-20.md). Captura real pendiente de contraseña en terminal personal; no pedir secretos en chat. Copia anterior intacta;052/deploy aún no ejecutados.

### Antecedentes — el siguiente GO corresponde al alcance anterior

## Dictamen vigente — 2026-10-20 / GO CONDICIONADO

**GO CONDICIONADO para Soft Launch supervisado en el QRIH STAGING existente, con datos reales ya seleccionados.** [Dictamen y condiciones](docs/SOFT_LAUNCH_GO_2026-10-20.md) / [RC y cierre AUD-040](docs/aud040-deploy-verification-2026-10-20.json). Commit publicado `f803f35faba9cf871a81f93560112e20358230c2`, fuente `4c7d05057f2429306d8ed5ba6097d9b273eb292a`, deploy `6ad79257b59620a2a787e9a1` READY/SHA/publicación exactos.138unit remotas/31HTTP remotos PASS/0fallos/0skips y lint/tipos/build/preflight completos. Selector admin corregido, guardado autenticado de fixture con éxito, `m2` conservado y huellas comerciales/galerías de ambos fixtures iguales (sólo updated_at excluido). **AUD-040 MEDIO CORREGIDO, DESPLEGADO Y VERIFICADO.**

Aceptación crítica [gestionada](docs/soft-launch-moderation-2026-10-20.json): owner/admin reales, ciclo publicado→retirado→editado→revisión→rechazo, privacidad/ficha/PDF/7WebP, duplicado y portada independientes. Fixtures finales rejected/draft,14objetos conservados; sin inmuebles reales alterados por el agente, eliminaciones, nueva migración ni producción/main. Free/saldo previo283,7créditos/sin pagos-recargas-overages, un único RC adicional autorizado y builds detenidos; no otro build por documentación.

**Límites operativos aceptados expresamente:** Fabián supervisa, respaldos cifrados manuales por día de uso/antes de cambios y pausa manual de nuevas altas si falla respaldo/correo/cuota. Recuperación completa24h y carga/concurrencia real NO medidas; renovación prolongada/all-actor-all-status y demás límites conservan su alcance, no son PASS inferidos. AUD-018 mantiene riesgo operativo residual aceptado, no «totalmente corregido». Sin SLA, GO de producción, invitaciones, publicación de registros adicionales ni acciones automáticas. Los NO-GO/pedidos de permiso o deploy de cortes inferiores son **antecedentes superados por este dictamen condicionado**, no tareas vigentes.

### Antecedentes históricos — no dictámenes vigentes

## Estado maestro consolidado — 2026-10-19

**Vigente: RC corregido PUBLICADO EN STAGING / humo remoto PASS / NO-GO Soft Launch.**

[Resultado del RC](docs/rc-deploy-retry-2026-10-19.json): build `6ad6ea1852ec38abfbd9bb20`, deploy `6ad6ea1852ec38abfbd9bb22`, commit publicado `5c4970eb31e52b5af2cdfe41ecf1636839320da3`; READY y publicado comprobados por API y dashboard, 19oct22:12:54 CDMX / 20oct04:12:54 UTC. **133/133 pruebas unitarias remotas y 31/31 comprobaciones HTTP del sitio desplegado PASS, 0 fallos/0 omisiones**; lint, tipos, preflight y compilación completados por el pipeline. Huella de las180entradas igual al manifiesto corregido; fuente funcional sin cambios por este intento.

AUD-039 **MEDIO / CONFIRMADO / CORREGIDO Y VALIDADO EN CI REMOTA**: aislamiento de fixtures verificado en proveedor, sin debilitar el guard de origen. El primer intento fallido y su recibo se conservan como antecedentes. Segundo intento autorizado por «SI», un único POST nuevo/journal separado, sin tercer intento. Free/saldo previo299/300/sin recargas ni overages; `stop_builds=true` restituido y comprobado. Sin producción/main, pagos, cambios de configuración de Supabase, repetición051, respaldo/restore ni operaciones de negocio autenticadas. Las peticiones de humo fueron lecturas o solicitudes inválidas/no autenticadas; no verifican físicamente Storage/RLS con usuario real ni sustituyen la aceptación UI.

**GO técnico de despliegue del RC en STAGING; NO-GO para apertura del Soft Launch.** Pendientes: aceptación de los nuevos flujos Auth/Storage/UI con sesión legítima y fixtures expresamente autorizados, concurrencia/renovación de firmas según checklist, y cierre operativo/RPO-RTO24h/aceptación final. Los recibos sintéticos y la recuperación anterior conservan su alcance, sin repetir trabajo cerrado.

### Antecedentes y gates ya completados

Los cortes inferiores son históricos cuando difieren del estado vigente anterior; no reabrir permisos, migraciones, capturas o despliegues ya completados.

**Vigente — migración051 APLICADA Y VERIFICADA EN QRIH STAGING.** Autorización explícita del usuario ejecutada únicamente en `mcyxunymhuxyiwklyfpy`, verificación independiente20oct03:20:48UTC/19octCDMX. [Recibo de aplicación](docs/profile-property-management-staging-migration-2026-10-19.json). Historial reconciliado:001–043 representadas por baseline y044–050 registradas bajo sus identificadores originales; no repetirlas ni reparar historial.051 registrada una sola vez, nueve filas totales. Guard, dos RPC e índice instalados con transacción/timeout acotados;11aserciones posteriores PASS. Huellas de23tablas de negocio/Storage y ocho filas históricas iguales al respaldo; políticas/RLS/esquema sin cambios fuera del índice previsto, bucket privado/WebP conservado. Anónimo/PUBLIC sin EXECUTE y authenticated sólo los dos RPC, search_path vacío.93SQL sintéticas reejecutadas PASS; no nuevos retiros, duplicados, uploads o borrados reales.

**PROP-003/006/007: BD integrada; aceptación funcional real pendiente.** Siguiente: localhost + sesión legítima + fixtures nuevos expresamente autorizados, sin usar propiedades reales como pruebas destructivas. Advisors conserva excepción previa de vista pública y añade dos avisos esperados por RPC SECURITY DEFINER autenticados; revisión documentada, no afirmar cero avisos. Sin cambios funcionales adicionales, commit/push/deploy/producción ni repetición de respaldo/restore. **NO-GO global** por aceptación nueva/operación/RC. Esta actualización sustituye las afirmaciones inferiores de051 sin aplicar/sin autorización, que son cortes históricos.

**Respaldo nuevo LOCAL + DRIVE VERIFICADO:** captura humana del19octCDMX/20octUTC, generación `capture-b19dbe83-4d5c-4432-b910-f48b349080e3`,51tablas/52objetos Storage/7.188.486bytes de imágenes. Paquete cifrado7.866.424bytes, hashes/54miembros/partes y cortes origen iguales comprobados independientemente en memoria; carpeta700/archivos600. Segunda copia Drive en carpeta existente, único permiso owner, lectura de retorno byte a byte/tamaño/SHA256 iguales. [Evidencia](docs/backup-verification-2026-10-19.json). Dos generaciones conservadas08oct/19oct, no tres ni respaldo diario automático;81,152s de captura no es RTO. Clave separada/no subida, ninguna restauración ni cambios de datos/configuración de origen/producción. Release consumido: no repetir capturador.051 todavía SIN aplicar/autorizar; sin commits/push/deploy. NO-GO global conservado.

**Antecedente de la captura completada:** pase vencido rechazado antes de exportar, diagnóstico corregido y preparación renovada tras controles;15tests+39checks sintéticos PASS, límites2h/12h intactos. [Diagnóstico](docs/backup-expiry-diagnosis-2026-10-19.json)/[preparación](docs/backup-preparation-2026-10-19.json). Captura posterior completada y verificada arriba, no pedir otro login/contraseña ni repetirla. Código QRIH no cambió por este respaldo; copia recuperada intacta. Los cortes inferiores sin captura son históricos.

**Revisión previa a integración completada:** preflight local PASS y sin clave privada examinada en bundle;206archivos del índice y236textos de trabajo examinados sin hallazgos de patrones buscados. No comprobación remota ni garantía universal. [Procedimiento051](docs/PROFILE_PROPERTY_MANAGEMENT_ROLLOUT.md). Operación/RTO/aceptación/RC siguen abiertos; código funcional sin cambios adicionales por la preparación del respaldo.

**Verificación local del lote Mis propiedades:**132/132unitPASS (18nuevas+114regresión),93/93SQL PASS (50nuevas+43previas), sin skips, TypeScript/lint/build PASS. Migración051 generada con CLI oficial y ejecutada sólo en PostgreSQL en memoria con datos ficticios; policies/flags RLS sin cambios. Render estático de componentes reales1440/375/320px PASS: tres/una columnas, portada16:9, sin overflow y acciones mínimo44px. No Auth/Storage físico/E2E autenticado ni STAGING aceptados por esas pruebas. [Resultados y pendientes](docs/PROFILE_PROPERTY_MANAGEMENT.md) / [recibo](docs/profile-property-management-local-2026-10-19.json).

**Mis propiedades — IMPLEMENTADO EN CÓDIGO / VALIDADO LOCALMENTE CON ALCANCE SINTÉTICO / integración pendiente:** edición published con confirmación→POST→RPC de retiro, duplicación independiente sólo al guardar como draft, portadas privadas16:9/renovables y acciones existentes preservadas. [Informe, archivos y checklist](docs/PROFILE_PROPERTY_MANAGEMENT.md). Rama `feature/profile-property-management`, sin commits/push. Edición compartida en `lib/property-save-server.ts`, creación original conservada en `app/publicar/PublicarForm.tsx`; no dependencias nuevas. SQL canónico `supabase/migrations/20261019212016_051_profile_property_management.sql`; antiguo docs/sql sólo referencia. CLI desbloqueada con opciones oficiales de telemetría, sin configuración global. Compilación, transacciones/RLS/autorización con fixtures y render estático verificados, NO permisos Auth/Storage ni UI reales de STAGING. Antes de aplicar allí051: revisión, controles del proyecto correcto, respaldo reciente verificado y autorización específica. No declarar las nuevas funciones operativas en una BD sin esos RPC. Candidato/167hashes anteriores históricos, no READY vigente. Supabase alojado/copia recuperada/producción/Netlify intactos; NO-GO conservado. Cortes inferiores de código funcional intacto corresponden al trabajo previo, no al árbol actual.

**Preparación offline del respaldo — PASS acotado:** herramienta sintética y19tests nuevos, sintaxis/lint PASS; [evidencia](docs/aud018-backup-rehearsal-2026-10-19.json). Cifrado age/lectura de retorno, generaciones distintas, concurrencia y fallos simulados verificados, sin datos reales/credenciales/red/exportación/transferencia/restore. No es aún captura manual real ni respaldo diario operativo; adaptador/controles frescos pendientes. Código funcional existente intacto/167hashes iguales, pero dos archivos nuevos scripts/tests hacen fallar correctamente el control RC previo: no árbol idéntico ni nuevo READY; guard/manifiesto anteriores sin relajar. Sin commit/push/deploy. STAGING real/RTO objetivo24h confirmados, no RTO demostrado; AUD018 EN REVISIÓN / NO-GO.

**Decisión vigente del piloto:** usuario confirma STAGING actual con la información real que ya contiene y objetivo de recuperación de24h. [Alcance operativo](docs/SOFT_LAUNCH_OPERATIONS.md). Destino seleccionado, no preguntar nuevamente ni tratar sus datos como desechables. Objetivo aceptado, cumplimiento aún no medido; RPO depende de copias realmente verificadas, respaldo diario aún no activo. No autoriza apertura, invitaciones, deploy, exportación ni cambios remotos. Entorno original distinto excluido de este piloto: su AUD-002 histórico no se traslada como fallo confirmado del destino elegido. Siguen pendientes operación/controles actuales/aceptación integral/RC y GO explícito; AUD-018 EN REVISIÓN / NO-GO. Referencias inferiores a destino u objetivo sin decidir quedan supersedidas.

**Preparación operativa actual:** [procedimiento de futuras copias](docs/SOFT_LAUNCH_OPERATIONS.md). La herramienta del ensayo está intencionalmente bloqueada contra repetición; su recibo de cuota y validación del corte no están listos para una captura actual. Inspección de código únicamente: no se ejecutó el chequeo de preparación, que contactaría STAGING. Política aprobada no equivale a respaldo diario operativo. Sin cambios funcionales, nuevas copias, automatización ni cambios remotos; AUD-018 ALTO / EN REVISIÓN — NO CORREGIDO / NO-GO. Cortes anteriores a la aprobación son antecedentes, no solicitudes vigentes.

**Vigente2026-10-19 — política básica confirmada, no automatizada:** usuario aprueba responsable/Fabián, copia cifrada por día de uso y antes de cambios importantes, objetivo de tres generaciones verificadas sin borrado automático. [Política y ubicaciones](docs/SOFT_LAUNCH_OPERATIONS.md). Existencia de generación local08oct en `/Users/Shared/QRIH_Staging_Backups` comprobada por listado/permisos, sin abrir contenido/claves; segunda copia Drive registrada históricamente y clave separada en Bitwarden por reporte del usuario. Una generación/dos copias, no tres generaciones ni copia diaria activa. Sin nueva captura/upload/consultaDrive/programación/poda/Git/Netlify. RTO/operación efectiva/piloto/RC yNO-GO permanecen; no pedir de nuevo aprobación de estas tres reglas.

**Vigente2026-10-19 — siguiente fase documental:** matriz15casos del plan de recuperación reconciliada con evidencia real, eliminando pendientes obsoletos de Auth/app/ingesta/edición/8ª; límites parciales yoperación siguen abiertos. [Acuerdos mínimos propuestos](docs/SOFT_LAUNCH_OPERATIONS.md): responsable, copia diaria durante uso/antes de cambios y objetivo3generaciones, sin aprobación ni automatización/exports/borrados. Rancher puede cerrarse normalmente porque el ensayo ylisteners terminaron; no Reset ni eliminación de volúmenes. No se observó/cambió el cierre del usuario. Sin nueva ejecución técnica/cloud/Git/Netlify ni GO global.

**Vigente 2026-10-19 — ensayo de escritura local completado dentro de su alcance:** 16 comprobaciones HTTP/SSR PASS con sesión admin legítima: ingesta JPEG/PNG/WebP→WebP y rechazo de bytes falsos, borrador, siete asociaciones, portada/edición persistentes, rechazo de octava por API/RPC sin alterar galería, pending no público, rutas denegadas al anónimo y logout/refresh rechazado. Filas previas de17tablas preservadas. [Evidencia](docs/aud018-private-write-acceptance-2026-10-19.json).

Lectura independiente PASS:8WebP/644bytes/hashes-tamaños-MIME iguales a procedencia; cuentas4/identidades4/sesiones0/refresh0/propiedades2/galería14/Storage15. Fixturepending+7asociadas+8objetos sintéticos conservados, uno no asociado; límite7 es de asociaciones, no objetos por cuenta. Proceso6207 cerrado con identidad/carpeta verificadas; listeners3118/3120/3122 ausentes, Rancher/contenedores conservados. Sin replay, limpieza, reset, restore, cambios funcionales/env/RLS/migraciones/cloud/Git/Netlify.

Actor admin-owner: no inferir publisher/no-admin HTTP ni formulario interactivo completo. Es límite de cobertura, no vulnerabilidad confirmada. Aceptación integral/operación/RPO-RTO/responsable/frecuencia-retención/contingencia, piloto/AUD002 original y RC Netlify explícito siguen separados. **AUD018 ALTO / EN REVISIÓN — NO CORREGIDO / NO-GO.** Este gate sí terminó: no pedir otro login ni repetir captura/restore/galería/PDF/escrituras ya comprobados.

Las ventanas y fases pendientes de los cortes inferiores son antecedentes.

**Vigente2026-10-19 — panel privado/admin/logout PASS, imágenes todavía pendientes:** recibo16:24:52Z acredita sesión legítima, rechazo anónimo, panel SSR, lectura admin legítima, logout+refresh rechazado y17tablas previas preservadas. Actor admin; no inferir cobertura publisher ni rechazo no-admin. Ingesta se detuvo antes de crear fotos/fixture (mutaciones0) por discrepancia127→localhost del helper/NextRequest. Sólo helper corregido;18regresiones PASS, preflight origen canónico401sin sesión/origen ajeno403 confirmado. Pantalla3118 nueva desde16:28:10Z45min esperando login; sin nuevas escrituras por la reapertura. [Evidencia](docs/aud018-private-http-progress-2026-10-19.json). Sin app/env/RLS/cloud/Git/Netlify nuevos; AUD018ENREVISIÓN/NO-GO, no imágenes/edición aceptadas todavía.

**Vigente2026-10-19 — Rancher/copia reanudados y página lista:** guard propio2reglas repuesto **antes** del arranque de6servicios existentes; IDs/imágenes/volúmenes/15ajenos conservados, puertos publicados0.7HTTP/4TCP internos y6namespaces sin ruta externa/default y SSHgateway denegado PASS acotados. READONLY16huellas app/historial iguales; cuentas4/identidades4/sesiones0/refresh0/propiedad1/galería7/Storage7. [Evidencia](docs/aud018-resume-after-reboot-2026-10-19.json). Pantalla3118 lista19oct16:20:29Z/45min, esperando login; no ensayo autenticado ni nuevos fixtures por esta reanudación. Sin reset/restore/borrado/app/env/RLS/cloud/Git/Netlify nuevos. AUD018 ENREVISIÓN/NO-GO. El motor ausente del corte inferior ya fue resuelto.

**Estado vigente — 2026-10-19, después del reinicio de la Mac:** servidor temporal anterior no constituye acceso vigente; motor Docker de Rancher no disponible y socket local ausente. La consulta no pudo inventariar contenedores ni verificar datos posteriores al reinicio: no interpretar cero resultados como cero contenedores/datos. No existe recibo del segundo ensayo corregido. Código167entradas/huella del candidato intactos. Usuario debe abrir Rancher y esperar el motor; después verificar identidades/volúmenes/red/guard antes de iniciar los seis servicios existentes y reabrir la pantalla. Sin reset/reimportación/borrado ni cambios cloud/Netlify/Git. AUD018 EN REVISIÓN/NO-GO; las ventanas3118 anteriores caducaron.

**Vigente2026-10-17 — reapertura expresamente autorizada y lista:** comprobador corregido/17tests PASS; guard y READONLY previos sesiones0/refresh0/propiedad1/galería7/Storage7. Acceso3118 desde18oct04:54:14Z por45min, esperando login humano para el mismo ensayo local. Código118/bundle58/baseline17 verificados; recibo fallido conservado. [Reapertura](docs/aud018-private-test-reopen-2026-10-17.json). No nuevas escrituras ni aceptación autenticada por esta preparación; cloud/Netlify/Git intactos. AUD018 ENREVISIÓN/NO-GO; el bloqueo de reapertura del corte inferior fue levantado por la nueva confirmación del usuario.

**Corte vigente2026-10-17 — ensayo detenido sin escrituras de negocio:** sesión legítima preparada, pero assertion del panel incorrecta y manejo de body204 vacío fallaban en el comprobador. Helpers corregidos fuera de app/17tests offline PASS; no corrección funcional QRIH ni aceptación autenticada inferidas.17tablas previas preservadas, fixture0/fotos nuevas0; READONLY independiente sesiones0/refreshactivos0/propiedad1/Storage7. Pantalla anterior cerrada; reapertura bloqueada por control de ejecución ante «no reintentes», pendiente confirmación específica del usuario. [Diagnóstico](docs/aud018-private-test-diagnosis-2026-10-17.json). No reset/limpieza/cloud/producción/Netlify/commit/push. AUD018 ENREVISIÓN/NO-GO; el acceso preparado del corte inferior ya no está vigente.

**Actualización vigente 2026-10-17 — privados/escrituras autorizados y preparados:** aislamiento y fronteras12tests/6checks PASS; app118archivos y bundle58 sin cambios funcionales/cloud. [Preparación](docs/aud018-private-test-preparation-2026-10-17.json). Pantalla diagnóstica3118/45min desde18oct04:38Z; browser integrado bloqueó apertura, no bypass ni UI visual validada. Usuario abre Safari e inicia una vez con cuenta del respaldo; después pruebas HTTP originales/RLS automáticas y cierre local. Aún cero fixtures/imágenes nuevos y ninguna aceptación autenticada PASS. AUD-018 EN REVISIÓN / NO-GO; STAGING remoto/producción/Netlify/Git intactos. Diseño/aprobación del corte inferior supersedidos por esta preparación.

**Próximo lote preparado, no ejecutado:** [ensayo local de privados/edición/ingesta y límite de siete](docs/AUD018_PRIVATE_WRITE_TEST_PLAN.md), limitado a un fixture nuevo y preservando propiedad/fotos recuperadas. Falta confirmar los efectos de escritura explícitos, incluido reemplazo de filas del fixture y purga interna de ventanas de cuota. No se habilitó Auth/mutaciones en el relay ni se modificó código funcional. Mantener AUD-018 EN REVISIÓN / NO-GO; no convertir el plan en evidencia PASS.

**Corte vigente — copia QRIH pública/galería/PDF validada en sólo lectura:** autorización ejecutada sin edición/upload/borrado. Copia separada de código118archivos iguales y buildproduction propio;58archivos de bundle público sin clave privada local ni orígenes Supabase cloud. Servidor/relay sólo127.0.0.1:3120/3122, guard normalSTAGING/env/build intactos, claves sólo locales en memoria servidor, filtro fijo de lectura/firma y defensa de red del proceso (no aislamiento universal). **Inventario/ficha HTTP200, siete imágenes803.872bytes con hashes fuente iguales, visor7→6→7/Escape observado, PDF200/949.283bytes/dos páginas dibujadas y revisadas.** Contador automático de visitas y cinco solicitudes fuera de lectura bloqueados. Cotejo posterior16huellas app/historial iguales, cuentas4/identidades4/sesiones0/refresh0/una propiedad/siete galerías-objetos. [Evidencia](docs/aud018-recovered-public-app-2026-10-16.json).

Herramienta temporal inicialmente bloqueaba chunk [slug]; filtro corregido con10tests y recarga visual PASS, sin cambio de QRIH. Renderizador inicial sin fontconfig sustituido por pypdfium2 ya incluido, proceso propio detenido, sin instalar/configurar sistema. **AUD018-OBS01 COSMÉTICO confirmado/no corregido/no bloqueante:** título Galería al pie de página1 y fotos en página2; fotos legibles. Guías Next/Supabase orientaron build/env separados; guía PDF añadió inspección visual. Esta fase pública termina; pendientes privados/admin/owner y escrituras/media/límite8 real con alcance autorizado, aceptación integral/operación/piloto. AUD018-R1 corregido local; **AUD018 ALTO/ENREVISIÓN—NOCORREGIDO/NO-GO.** Copia lectura disponible temporalmente hasta17oct02:08Z si procesos siguen activos; no tocar datos por enlaces/formularios, bloqueados. Sin cambios apporiginal/env/migraciones/RLS/Storage/Supabase remoto/conector ajeno/Git/Netlify/producción. Estados inferiores de app pública/PDF sin preparar quedan sustituidos.

**Corte vigente — Auth real de la copia recuperada PASS:** reporte del usuario cotejado con recibo17oct00:17:28Z (16octCDMX). Una cuenta inicia sesión con contraseña propia; Auth GETuser y perfil por PostgREST con el JWT emitido/permisos de cuenta pasan, se cierra únicamente esa sesión local y su refresh posterior es rechazado. Verificación independiente READ ONLY: **16 huellas de tablas de aplicación/historial iguales al respaldo, cuatro cuentas/cuatro identidades conservadas, sesiones0/refreshactivos0, una propiedad/siete imágenes/siete objetos**; cuarentena de enlaces vacía. No exigir igualdad de filas Auth operativas que el login puede actualizar. Pantalla temporal cerrada/PID exacto9082, ausencia de listener3118 confirmada00:19:13Z; Rancher/copia/datos conservados. [Resultado](docs/aud018-real-local-login-2026-10-16.json).

Guías Supabase/PostgreSQL mantuvieron separados permisos de usuario, cierre local y cambios operativos Auth. No repetir login/correo/contraseña/captura/reimportación para este gate. Falta plan/prueba de **QRIH completo sobre copia recuperada**, PDF/escrituras multimedia/aceptación integral y decisiones piloto/operación; no debilitar guard STAGING normal ni reutilizar su build/env. Sin cambios funcionales/env/migraciones/Supabase remoto/conector ajeno/Git/Netlify/producción. AUD018-R1 corregido local, **AUD018 ALTO/EN REVISIÓN—NO CORREGIDO/NO-GO**. Los cortes inferiores de login pendiente o pantalla abierta son antecedentes.

**Actualización vigente — acceso de prueba recuperada autorizado y preparado:** pantalla temporal [sólo loopback](http://127.0.0.1:3118/), no la aplicación QRIH. Listener127.0.0.1 comprobado, guard/identidades de seis servicios y endpoints internos Auth/REST verificados.12tests sintéticos y9negativos HTTP PASS; no agente envía credenciales/login. Cuerpo acotado/Origin+Host+CSRF/CSP/no-store/sin cookies ni URLs externas; destinos fijos internos, no proxy general ni clave service. Usuario introduce personalmente cuenta/contraseña del respaldo08oct; comprueba Auth real/perfil bajo RLS y cierra sólo sesión local creada, sin exportar JWT. Caduca30min desde17oct00:11:39Z (16octCDMX). [Evidencia y límites](docs/aud018-local-login-access-2026-10-16.json). **Login todavía NO verificado; AUD018 EN REVISIÓN/NO-GO.** La preparación no modifica datos; Auth legítimo posterior puede cambiar sus filas operativas/timestamps, no exigir igualdad literal de las37huellas después. QRIHlocalhost/STAGING/app/env/migraciones/origen/conector ajeno/Git/Netlify/producción intactos. Esta actualización sustituye sólo el permiso/transporte pendiente del corte inferior.

**Corte vigente — copia recuperada activa; AUD-018-R1 corregido localmente:** usuario reabre Rancher. Se reponen sólo las dos reglas de aislamiento antes de iniciar los seis contenedores existentes; identidades/volúmenes/15 ajenos detenidos conservados, puertos efectivos cero. Lectura de catálogo confirma grants explícitos a anon en los tres RPC, sin herencia ni bypass RLS cliente. Reconciliación de 70 ACL del respaldo validada con ROLLBACK y después COMMIT del mismo lote; no cambios a filas, roles, owners, RLS ni defaults globales. **15 comprobaciones RLS con anon/tres perfiles y 252 comprobaciones de imágenes/estados (84 contextos) PASS**; matriz revertida y 37 huellas de tablas nuevamente iguales, cinco tablas operativas en cuarentena vacías. Storage HTTP local: URL pública/acceso sin credenciales/firma no autenticada denegados, firma efímera entrega bytes/hash/MIME correctos y vence. Bucket privado/WebP/20 MiB conservado, 7 HTTP/4 TCP internos y aislamiento finito revalidados. [Evidencia y límites](docs/aud018-local-restore-2026-10-16.json).

**AUD-018 sigue ALTO / EN REVISIÓN — NO CORREGIDO / NO-GO.** Las pruebas SQL usan claims simulados, no login real. Pendientes acceso temporal separado autorizado para Auth real, aplicación recuperada/PDF/edición/upload/rechazo de octava foto, aceptación integral y acuerdos operativos/piloto. Localhost QRIH actual continúa en STAGING, no en esta copia; no confundir sesiones. Sin reimportación/reset, cambios al código de app/env/migraciones, conector ajeno, Supabase remoto, producción, Git o Netlify. Los cortes inferiores describen estados históricos sustituidos; el siguiente registro local de pruebas cruza medianoche UTC, pero continúa siendo 16 de octubre CDMX.

### Antecedentes de recuperación — no describen el estado actual

**Corte vigente — restauración local parcial, motor detenido antes de corregir ACL:** SI usuario aprobado;37tablas conservadas/huellas iguales y5tablas operativas en cuarentena confirmadas en COMMIT, más2buckets/7fotografías/803.872bytes por API local/GET-hash/procedencia7. Post-restore readonly avanzó por huellas37/FKs/galería/portada/anon privado/vista pública, pero falló en permiso RPC anónimo: **AUD018-R1 ALTO confirmado/NO CORREGIDO, sólo copia local**. Respaldo confirma permisos restringidos para los RPC probados. Corrección exacta de ACL preparada, **no ejecutada** porque Rancher volvió a estar ausente/VM Stopped/socket ausente; causa no verificada/ayuda solicitada, sin nuevo reinicio forzado. [Evidencia vigente](docs/aud018-local-restore-2026-10-16.json). Copia contiene datos: no reset/reimport/start-empty ni pruebas que exijan destino vacío; antes de arrancar servicios revalidar guard. No tocar código de aplicación/origen/producción/Git/Netlify. Auth HTTP/app/PDF/matriz completa y destino piloto siguen pendientes; **AUD018 EN REVISIÓN/NO-GO**. Los cortes inferiores son antecedentes.

**AUD018 — copia de datos y fotografías restaurada, verificación detenida por ACL:** usuario aprueba conservar cuentas/datos sin reactivar sesiones. Lote local validado con ROLLBACK y después confirmado:37tablas/huellas iguales,5tablas de sesiones vacías;2buckets/7WebP/803.872bytes recuperados por API local/GET-hash/procedencia, sin upsert/SQL de Storage. Verificación readonly detecta **AUD018-R1 ALTO confirmado sólo en copia local**: grants del entorno destino añadidos a funciones restringidas por el respaldo; reconciliación exacta pendiente, no vulnerabilidad cloud inferida. [Resultado vigente](docs/aud018-local-restore-2026-10-16.json). Copia ya NO vacía: no reset/reimport/start-empty ni repetir ayudas anteriores. No cambios al código de app/origen/conector ajeno/producción/Git/Netlify. Auth HTTP/app recuperada/matriz completa pendientes; **NO-GO** conservado.

**AUD018 — Rancher disponible, gate de arranque cerrado:** seis servicios existentes iniciados sólo después de reponer guard propio2reglas; identidad/volúmenes/15ajenos/resto reglas conservados. Destino fresco vacío, puertos efectivos0,7HTTP/4TCP y probes acotados positivos/negativos PASS; disco/montajes/carpetería privada revalidados.35tablas managed sin diferencias de columnas/tipos/nulabilidad/generación; extras COPY son generadas, extensiones iguales. No importar hooks del proveedor/role ausente sin revisión. Cuarentena local propuesta ahora incluye auth.mfa_amr_claims como dependencia de sesiones; aprobación solicitada, no aplicada. No URLs Supabase operativas de imágenes en datos capturados; historialSQL conserva referencia. [Evidencia actual](docs/aud018-local-target-2026-10-16.json)/[plan](supabase/staging/backup-recovery-plan-2026-10-06.md). No pedir abrir Rancher otra vez. Adaptador/ACL/defaults/funciones/transporte/importación/15casos pendientes; **ALTO/EN REVISIÓN—NO CORREGIDO,0post-restore/NO-GO**. Sin código funcional/cambios cloud/Git/deploy/producción.

**AUD-018 retomado por nueva instrucción — aún no restaurado:** usuario pide recuperación y demás pendientes sin Netlify; sustituye la pausa histórica. Análisis offline PASS del respaldo:51tablas con conteos capturados iguales/7WebP y hashes/manifest before=after, sin persistir datos en claro ni consultar origen/conector ajeno. Comparación managed sólo contra catálogo histórico; defaults/generadas/tipos/ACL/adaptador y cuarentena de sesiones pendientes. Rancher no disponible: un start sin flags lanza app, pero VM sigue Stopped/API no accesible; ayuda solicitada para aviso visible, sin reset. **0/15casos post-restore; ALTO/EN REVISIÓN—NO CORREGIDO/NO-GO.** [Evidencia](docs/aud018-recovery-analysis-2026-10-16.json)/[plan vigente](supabase/staging/backup-recovery-plan-2026-10-06.md). Sin importación/código funcional/configuración/Git/deploy/producción nuevos. El objetivo es dejar sólo RC Netlify pendiente, no un resultado conseguido todavía; destino piloto/operación siguen abiertos.

**Aislamiento de cuentas — instrucción vigente del usuario:** el conector Supabase de ChatGPT pertenece a otro proyecto. No consultarlo, cambiarlo ni desconectarlo para QRIH. La configuración local se comprobó sin red mediante `npm run preflight`: PASS del origen STAGING fijo `mcyxunymhuxyiwklyfpy`, presencia/formato de variables y ausencia de la credencial privada examinada en `.next/static`. Esto no verifica pertenencia remota de claves opacas, acceso actual, Auth, Storage o RLS. Cotejo offline del candidato: 167 archivos/huella conservados en HEAD `a496790`, sin cambios funcionales y main intacta. [Plan RC vigente](docs/RC_CANDIDATE_2026-10-08.md#preparación-offline-vigente--aislamiento-supabase-2026-10-16). Sólo documentación local; no commit/push/deploy/configuración/datos nuevos. NO-GO y tres frentes pendientes se mantienen.

**Entrega GitHub completada — sin deploy:** push explícitamente autorizado, sólo develop54faaf1→a496790ecc4169cb291232923f0f746ffef45440/21commits, sin force/tags/PR. GitHub privado/permisos/refs verificados antes y readback posterior developa496790/main55b7737 intacta. Guard Netlify GET-only antes/después PASS: builds detenidos, Free sin recargas/overages, repo/develop esperado y publicadof67fa46 sin cambios. Sin despliegue ni modificación de configuración/producción; saldo de créditos no medido. Acceso a almacenes oficiales bloqueado en aislamiento y resuelto mediante ejecución acotada fuera de éste, sin mostrar/copiar/rotar credenciales. Índice206/0hallazgos de patrones, fuente167/huella y build4302fef conservados; no nueva suite/build. [Recibo y límites](docs/github-delivery-2026-10-16.json). Registro posterior sólo local, sin segundo commit/push. Quedan recuperaciónAUD018 pausada, decisión de piloto/AUD002 original condicionado y RC Netlify autorizado/cuota/READY/pruebas; **NO-GO** conservado. No repetir correo/login local.

### Antecedente — preparación y validación local antes del push autorizado

**Entrega documental local — alcance del lote:** 10 documentos/evidencias, separados de las correcciones funcionales. Referencia de partida e568187, develop con20commits sobre la caché origin/develop54faaf1; remoto no consultado. Se conserva el código167entradas/huella f9fc6cbb… y build4302fef, sin nueva compilación por documentos. Versionado sólo local bajo el permiso de commits; el SHA documental se identifica en Git, no se confunde con el SHA compilado. Sin push/deploy/main/producción. Permanecen cuatro frentes: AUD018/recuperación pausada, entorno definitivo/AUD002 original condicionado, entrega Git autorizada con guards frescos y RC Netlify autorizado con cuota/READY/pruebas. Correo/consumo/contingencia a$0 deben acordarse antes del piloto; no son nuevos fallos confirmados. Cortes inferiores conservan su fecha; «sin commit» describe la acción de cada ensayo, no una prohibición ni un estado Git posterior.

**AUD-036 vigente — callback local validado por reporte del usuario:** tras informar Restablecer contraseña, usuario confirma explícitamente ambos campos y Guardar nueva contraseña sin aviso de enlace vencido. El título solo no bastaba: código revisado muestra formulario únicamente si getRecoveryUser valida la marca/sesión; eso contextualiza el reporte, no sustituye una observación independiente. [Evidencia y límites](docs/aud036-local-callback-2026-10-15.json). No contraseña cambiada por agente ni prueba local nueva de cambio/logout/login; no más correos/alta/login manual para este paso. Renovación natural del08oct conserva su cobertura. **MEDIO/CORREGIDO LOCAL—PARCIAL; RC pendiente.** Fuentes167/huella/HEAD e568187 intactos, sólo documentos; sin commit/push/deploy/producción/SQL/configuración/restore. Próximo: preparar entrega Git con permisos/guards frescos, no publicarla automáticamente. AUD018 pausado/bloqueante, decisión de piloto/originalAUD002 y **NO-GO** intactos. Guía Supabase orientó no confundir acceso al formulario con cambio de credenciales ni reporte con verificación independiente.

### Antecedente — enlace inválido y servidor local, antes de la confirmación positiva

**Callback local — aviso de enlace inválido/vencido reportado:** tras recuperar el servidor, la URL recibida reporta otp_expired; listener3107 activo y código conserva rechazo genérico de callback inválido. No demuestra fallo de cuenta ni de un enlace nuevo: pendiente aclarar correo anterior reutilizado frente a nueva solicitud local, sin repetir envíos por inferencia. [Diagnóstico y límites](docs/AUD036_SSR_SESSION.md). Sin cambios funcionales/contraseñas/configuración/push/deploy; callback positivo pendiente y NO-GO vigente.

**Reanudación vigente — localhost recuperado, callback todavía pendiente:** usuario reporta ERR_CONNECTION_REFUSED al volver del correo. Se confirma ausencia de listener3107 y se reinicia únicamente el build local existente mediante guard de STAGING, con permiso de red acotado; Ready y listener[::1]:3107 verificados. Preflight nuevo PASS; GET anónimos login/recuperación responden200. Recuperación entrega el placeholder previsto del componente cliente: la comprobación HTTP no valida hidratación ni canje positivo del código. Se corrige una expectativa del sondeo que exigía formulario SSR, no código de aplicación. HEAD e568187/167entradas/huella seleccionada intactos; cambios documentales previos preservados. Sin leer/reutilizar/guardar el código del enlace, cookies o contraseñas, correo por agente, build nuevo, cambios funcionales/configuración/datos/commit/push/deploy/producción. Causa de detención del proceso no determinada; no fallo Auth confirmado por conexión rechazada. Retomar mediante solicitud única de enlace nuevo desde recuperación local y abrirlo en el mismo navegador; no cambiar contraseña. [Detalle AUD-036](docs/AUD036_SSR_SESSION.md). Renovación del 8 de octubre conserva su alcance histórico; callback/RC/AUD018 pausado y **NO-GO** siguen pendientes. Guía Supabase mantuvo el guard sin fabricar sesión ni alterar permisos.

### Antecedente — renovación natural comprobada el 2026-10-08

**Actualización vigente — AUD-036, renovación natural local PASS acotado:** 23:30 CDMX, misma sesión legítima pasa de refreshed_at NULL a fecha posterior y conserva creación; panel privado/publicación sintética visibles tras nueva navegación y recarga completa, sin login nuevo. Servidor local hallado apagado, reiniciado con guardSTAGING/build existente4302fef/[::1]:3107; incidente de conexión/pestaña de error no acredita fallo Auth. HEADe568187/167entradas/huella intactos, preflight nuevo PASS; sin recompilar/repetir suites ni modificar código/datos/TTL/RLS/Storage/SMTP. No tokens/cookies/identificadores privados exportados. No atribución browser/Proxy ni JWT vencido/reuse concurrente/RC probado. **Callback positivo local pendiente de abrir un único correo de cuenta existente, sin cambiar contraseña.** [Evidencia y límites](docs/AUD036_SSR_SESSION.md). Sólo documentación local sin nuevo commit/push/deploy/producción; AUD-018 pausado/bloqueante y **NO-GO Soft Launch** intactos. Guías Supabase/PostgreSQL orientaron metadatos mínimos, no nuevas reglas.

### Antecedente — integración local y compilación antes de la espera

**Corte vigente — candidato integrado y compilado localmente:** autorización «ok, adelante» ejecutada sólo para consolidar/compilar local. `develop` avanzó sin reescritura desde54faaf1 hasta4302feffc30413e23efb7179289b6bb6824df666 (19 commits existentes, incluye cadena AUD-034/035/036 y documentación de recuperación); `main`55b7737 intacta. **Build de ese SHA PASS**, Next16.3.6/28páginas/Proxy, BUILD_ID `BDbYKXtzF6xa9a_dDnnJm`; preflight y25HTTP sin sesión reejecutados PASS.167entradas/huella f9fc6cbb2f0d15a89943403650a2532cf93edddd050f5d04587fc86cd9494ca9 siguen iguales entre código6efd78e,4302fef y trabajo;114unit/lint/tipos/43SQL anteriores conservados, no reejecutados por mover la rama. Servidor3107 pausado normalmente durante build y reabierto en loopback/STAGING; panel privado/publicación conservados tras recarga observada, sin leer cookies/secretos ni modificar datos. Documentación posterior se versiona aparte, no cambia entradas compiladas. Sin push/consulta remota/Netlify/tag/PR/producción; GitHub aún no contiene esta integración según caché, remoto no revalidado. Renovación tras caducidad/callback positivo y AUD-018 pausado siguen pendientes; **NO-GO Soft Launch**. [Evidencia RC](docs/RC_CANDIDATE_2026-10-08.md). Supabase orientó mantener staging/cliente sin clave privada y no confundir reinicio/recarga con renovación.

### Antecedente — commits antes de autorizar integración y build

**Corte vigente — versionado local y acceso autenticado comprobados:** usuario autoriza también commits. AUD-037 queda en `f55ab65`, AUD-038 en `0ca5a69` y las pruebas adicionales AUD-036 en `6efd78e`, separados en la rama actual `docs/aud-018-recovery-preparation`. Código candidato local: `6efd78ece7c433f95ae6c5b40f17eaed8fc371f4`; no tag/RC aprobado. Manifest167/huella f9fc6cbb2f0d15a89943403650a2532cf93edddd050f5d04587fc86cd9494ca9 cotejados contra los objetos Git y los archivos finales, sin cambios funcionales pendientes. **Reejecutados ahora:114 unit PASS, lint completo y tipos sin emisión PASS; scanner por índice sin hallazgos.** Build/preflight/25HTTP del lote anterior conservados, no recompilados para este SHA. Usuario inició sesión personalmente; agente observó el panel privado con su publicación de prueba y comprobó que se conserva después de recargar localhost3107. No leyó cookies/tokens/contraseña ni guardó datos personales en evidencia. Renovación tras caducidad y callback positivo local aún pendientes. Documentación en commit separado; `develop` y `main` intactos, sin integración/push/PR/deploy ni cambio remoto. Guía Supabase mantuvo separadas la persistencia inmediata, renovación real y pruebas sintéticas. AUD-018 pausado/bloqueante y **NO-GO Soft Launch** siguen vigentes.

### Antecedente — correcciones antes de autorizar sus commits

**Último lote — AUD-037/038 MEDIO / CONFIRMADOS Y CORREGIDOS LOCAL:** continuar hasta requerir ayuda, sin Git/deploy/producción. Carrera de foto quitada/título/orden durante optimización reproducida2/2 antes y corregida en ambos componentes con estado actual/refbusy/lifecycle;14tests. Respuesta RPC perdida no prueba rollback: mensajes honestos y sin limpiar fotos nuevas tras resultado incierto; limpieza post-commit fallida conserva éxito+warning,9tests. **114unit/lint completo/tipos/build/preflight/25HTTP localhost sin sesión PASS**;43SQL aisladas previas conservadas, no SQL/RLS/migración/lock/Storage real nuevo. Manifest167 entradas/huella f9fc6cbb2f0d15a89943403650a2532cf93edddd050f5d04587fc86cd9494ca9, no commit RC. Sólo indentación final posterior al build, semántica igual; no certificado de SHA integrado. [AUD037](docs/AUD037_IMAGE_EDITOR_RACE.md), [AUD038](docs/AUD038_AMBIGUOUS_WRITES.md), [candidato vigente](docs/RC_CANDIDATE_2026-10-08.md). **Ayuda requerida ahora:** login personal de cuenta existente en localhost3107; servidor loopback STAGING activo, sin credenciales compartidas/alta/correo por agente. Sesión real prolongada/callback positivo todavía no verificados. AUD-018 pausado/bloqueante, AUD-002 original/corte/RC externo pendientes; NO-GO. Guía Supabase mantiene pruebas simuladas separadas de permisos/operación real. Candidatos inferiores históricos.

### Preparación anterior — supersedida por las dos correcciones nuevas

**Candidato local — PREPARADO PARA INTEGRACIÓN, NO PUBLICADO:** [plan RC](docs/RC_CANDIDATE_2026-10-08.md) y [manifest de165 entradas](docs/rc-candidate-inputs-2026-10-08.json) preparados por autorización. ac26f64 y HEADafab3b7 contienen las mismas entradas de aplicación/config/tests; delta local sólo tests/ssr-session.test.mjs. Huella de trabajo70d60015af5f9831a463dd1a1b599fd09ed7c6f7f01593c9dd58eae8ff8f3a59; no SHA de commit/build ni certificación remota. **Ahora lint completo/tipos sin emisión/43SQL PGlite PASS**;91unit/14SSR del paso anterior sobre mismas entradas conservados, no nuevos build/HTTP/audit/preflight conectado. Propuesta: dos commits separados test/documentos y fast-forward local develop por cadena existente; **no ejecutados/autorizados por preparar**. Main/referencias/env/migraciones/servicios intactos; GitHub/Netlify/guard/cuota no reconsultados. AUD-018 pausado/no descifrar, AUD-002 original/recuperación real/sesión legítima local/callback positivo/RC remoto pendientes; NO-GO externo. Guías Supabase/PostgreSQL mantienen fixtures separados de permisos/datos efectivos, sin grants nuevos.

### Lote anterior — red/concurrencia SSR y recuperación pausada

**Último avance — validación local AUD-036:** el usuario rechaza continuar el descifrado y pide otro paso; **AUD-018 queda pausado por decisión del usuario, abierto y bloqueante**, sin leer la clave/paquete ni restaurar. Se añaden únicamente cuatro pruebas de renovación SSR a `tests/ssr-session.test.mjs`: interrupción breve del refresh, Auth503 sin identidad y recuperación posterior, dos requests simultáneos con respuestas invertidas, y aislamiento entre dos cuentas ficticias. SDK/Next/proxy reales con transporte simulado sin red: **14 SSR / 91 unit PASS**, lint del test y diff check PASS. Sin fallo funcional nuevo en estos casos; no cambia código de aplicación, permisos, datos, entorno ni servicios. Los builds/HTTP/tipos/SQL anteriores conservan su fecha: no reejecutados ahora. Sesión real prolongada, correo positivo localhost, integración RC y validación Netlify autorizada siguen pendientes. Git HEAD afab3b7 en docs/aud-018-recovery-preparation más cambios locales sin commit/push/merge/deploy; **NO-GO externo**. [Detalle y límites](docs/AUD036_SSR_SESSION.md).

### Corte anterior — ciclo de arranque vacío, recuperación no autorizada

**AUD-018 / corte vigente — ARRANQUE LOCAL CORREGIDO/VERIFICADO, SIN RESTORE:** autorización específica ejecutada: sólo seis restart policies unless-stopped→no, tabla propia2reglas y ciclo Rancher vacío. Policy actualizada una vez sin reiniciar servicios; shutdown/start0/VMStopped→Running/bootIDnuevo,6noautostart; guard se rearma **antes** de iniciar db y otros5. Final PASS_EMPTY_LOCAL_BOOT_ISOLATION:7HTTP200/4TCPDB, DNS interno positivo/gateway22+6puertos y DNS/TCP públicos bloqueados6, INPUT+46/FORWARD0(no tráfico forzado), hostports0/IDs-imágenes-volúmenes/redes/15ajenos/resto ruleset preservados. SQL READ ONLY37tablas/35payload0/historias82-74; sin descifrar/importar. Helper21tests sintéticos PASS; comparadores de orden de montajes/puertos efectivos detenido corregidos sin repetir mutation. Settings seleccionados/montajes7/carpetas privadas fuera iguales; muestra639procesos/1Rancher/0Docker, no causa/estabilidad prolongada probadas. **Rancher6activos protegidos; guard no persistente: todo boot requiere guard antes de start manual.** Copias/35checks offline previos intactos, sin nueva captura/upload. Siguiente permiso análisis privado del paquete/TOC/DDL **sin restaurar**; compatibilidad fina/adaptador/15casos reales0aprobados pendientes. Sin app/env/migración/cloud/producción/Netlify/commit/push/merge/borrado/costo. **ALTO / EN REVISIÓN — NO CORREGIDO / NO-GO**, ciclo vacío no es recuperación. [Evidencia y límites vigentes](supabase/staging/backup-recovery-plan-2026-10-06.md). Cortes inferiores históricos.

### Histórico inmediato — medición anterior a la autorización de captura

**AUD-018 / capacidad — COMPROBADA; CAPTURA NO EJECUTADA:** consulta STAGING READ ONLY observada en SQL Editor: BD13.031.091 bytes/12,43 MiB, Storage7 objetos/803.872 bytes declarados/0 tamaños desconocidos/0 buckets adicionales; Auth4/identidades4/perfiles3/propiedades1/galería7. Destino local700/vacío/183,05 GiB libres; Drive11,24 de15 GB usados/~3,76 GB libres, QRIH Backups shared=false/único owner. Dos intentos MCP sin resultados antes de la alternativa UI; no fallo de contraseña demostrado. Presupuesto provisional256 MiB/paquete, hasta3 generaciones/reserva1 GiB propuestos, no retención aprobada ni tamaño real medido. Diseño de cifrado inmediato/cobertura/manifest/gates en plan, no exporter implementado. Sin extracción de filas/fotos/claves, dump/upload real/restore/configuración/deploy/commit/push/merge; editor creó entrada de consulta, no Save. **ALTO / EN REVISIÓN — NO CORREGIDO / NO-GO**,15casos reales pendientes. [Plan, límites y permiso específico siguiente](supabase/staging/backup-recovery-plan-2026-10-06.md).

### Prerrequisitos conservados — cortes anteriores a la medición

**AUD-018 / conexión — PASS NATIVO REPORTADO POR USUARIO:** 2026-10-08, usuario devolvió PASS tras ejecutar el comprobador reforzado en Terminal. Prerrequisito de conexión STAGING autenticada/verify-full/PG17.11/ambos indicadores de lectura/límites15s5s/estructura esperada aprobado por reporte; no ejecución personal observada ni secreto recibido. SQL exacto MCP/diez campos y44checks anteriores PASS conservados, no reejecutados ahora. No repetir conexión/reset/instalación/fixture/guard por este resultado. Guía Supabase mantiene separación conexión vs recuperación real. Siguiente: verificar tamaño/capacidad/retención y acordar ventana sin escrituras, antes de permiso específico para captura cifrada y posterior restore. Ningún dump/descarga Storage/upload real/restore/deploy por este PASS. Documentación local, sin push/merge/cambio funcional; **ALTO / EN REVISIÓN — NO CORREGIDO / NO-GO**,15casos reales de recuperación pendientes. [Detalles y gates](supabase/staging/backup-recovery-plan-2026-10-06.md).

**AUD-018 / gateway — DOS REGLAS AUTORIZADAS APLICADAS Y VERIFICADAS:** tabla propia inet qrih_aud018_bridge_guard, puente exclusivo br-01ed69b976c4. Antes22 accesible desde seis; después22 y seis puertos adicionales del gateway bloqueados desde los seis, contador INPUT+46. DNS externo/TCP443 y rutas públicas no disponibles; DNS interno positivo. 7HTTP internos200/4TCP a BD/administración Mac-Docker exec/SSHlistener preservados, cinco tablas anteriores intactas salvo contadores. SQL local READ ONLY antes/después: Auth/identidades/buckets/objetos/public0; mismos IDs/imágenes/volúmenes/alias/redes/puertos host0, lsof confirma tres puertos antiguos cerrados. Un primer lote revertido sólo retirando tabla propia por fallo de probes; sondeos corregidos/probados y lote final PASS. FORWARD instalado/contador0, no tráfico forzado; no aislamiento universal/persistencia tras reinicio acreditados. Sin reinicio/exportación/restore/código/deploy/gasto. ALTO/EN REVISIÓN—NO CORREGIDO/NO-GO;15casos reales pendientes. [Evidencia](supabase/staging/backup-recovery-plan-2026-10-06.md).

### Antecedentes de preparación — cortes previos, no estado actual del gateway

**AUD-018 / reconexión autorizada — PRUEBAS DE RED APROBADAS EN SU ALCANCE:** los seis contenedores vacíos están exclusivamente en qrih-aud018-empty-20261006, internal=true/IPv6=false; red anterior loopback conservada vacía. IDs/imágenes/volúmenes/alias y bindings solicitados preservados, sin reiniciar/recrear/borrar. En los seis namespaces: sin ruta por defecto IPv4/IPv6, DNS interno funciona, DNS público y TCP público443 bloqueados en los probes fijos; UDP DNS directo y DNS del gateway bloqueados desde DB. Auth/REST/Storage/Mailpit internos HTTP200; SQL local READ ONLY/ROLLBACK antes/después: Auth/identidades/buckets/objetos/tablas public0. **Límite pendiente:** gateway TCP22 accesible, sin autenticarse; no prueba de escape ni aislamiento universal. VM home compartido/clave fuera de montajes, sin bind mounts en contenedores. Drive ~3,76 GB libres por lectura anterior, tamaño real pendiente. Sin exportación/restore/SQL remoto/código/deploy/gasto; ALTO/EN REVISIÓN—NO CORREGIDO/NO-GO intactos. [Evidencia y reversión](supabase/staging/backup-recovery-plan-2026-10-06.md).

**AUD-018 / clave guardada y recuperada — PASS reportado:** usuario confirmó «clave guardada» en Bitwarden y después «PASS» del verificador local con copia recuperada. El verificador compara recipient público y descifra contenido ficticio, sin leer la identidad original ni mostrar/persistir la entrada; agente comprobó self-test y tres rechazos, no observó ejecución real ni accedió a bóveda/2FA. Identidad sólo staging fuera de Git/Drive/montajes Rancher consultados, sin regeneración/borrado. Sin exportación/upload real/SQL/código/deploy nuevos; ALTO/EN REVISIÓN—NO CORREGIDO/NO-GO intactos. Plan recoge límites; aislamiento/cuota/conexión/permiso de captura/15casos reales pendientes.

**AUD-018 / segunda copia preparada:** QRIH Backups privada y único fixture ficticio AUD018_TEST_ONLY.age/253bytes comprobados; descarga byte-a-byte/SHA256/descifrado PASS, identidad del fixture sólo local y distinta de la clave staging. Ningún dato real/SQL/Storage/clave de respaldo subido ni sharing/deploy. Cuota/aislamiento restore/conexión/permiso de captura real/15casos siguen pendientes; custodia ficticia de la clave staging con PASS reportado arriba. ALTO/EN REVISIÓN—NO CORREGIDO/NO-GO intactos; enlaces y evidencia en plan, fixture conservado.

**Preparación AUD-018 vigente — ENTORNO VACÍO INTERNO OPERATIVO:** Rancher1.24.0/Docker29.5.3/Moby/PG17.11 y cifrado ficticio previos conservados. Tras la reconexión hay **cero puertos publicados al host**: el ensayo se accede mediante Docker exec/HTTP entre contenedores, no localhost55421/55422/55424. No afecta localhost3000/3107 contra STAGING remoto. HostConfig.NetworkMode conserva la red anterior: revalidar tras cualquier reinicio, no ejecutar start-empty.mjs ni repetir bootstrap CLI interno fallido como receta. Snapshot de reversión fuera de Git; red/volúmenes anteriores conservados. Límite gateway/acceso de restauración, cuota contra tamaño, conexión privada/ventana/permiso específico y15casos reales pendientes. No SQL remoto/dump/descarga Storage/código/dependencias/deploy; rama docs/aud-018-recovery-preparation, main/develop sin integrar. ALTO/EN REVISIÓN—NO CORREGIDO y NO-GO conservados; suites AUD-036 inferiores son previas.

**NO-GO externo / producción; localhost validado contra STAGING.** AUD-034/035 cerrados en aislamiento/runtime y builds detenidos. **AUD-036 MEDIO/CORREGIDO LOCAL:** guarda renovación SSR request/response antes de privadas, sin cambiar autorización. 87 unit/lint/tipos/build/preflight/25 HTTP compilado PASS; 43 SQL/audit prod0 anteriores no reejecutados. Usuario autorizó sólo callbacks localhost3000/3107, UI3 URLs/Site URL/callback remoto intactos. Sesión real prolongada/email→callback positivo/backup/RC/corte pendientes. Rama fix/aud-036-ssr-session, main/develop sin integrar ni deploy. [AUD034](docs/AUD034_LOCAL_STAGING.md), [AUD035](docs/AUD035_STAGING_BUILDS_STOPPED.md), [AUD036](docs/AUD036_SSR_SESSION.md); dictamen único QRIH_AUDIT.md.

### Matriz vigente — ciclo de arranque vacío aprobado; recuperación real pendiente

| Área / IDs estables | Estado vigente | Evidencia / cierre pendiente |
|---|---|---|
| Imágenes UI / IMG-001/002 / PROP-002/005 / AUD-037 | MEDIO / CORREGIDO LOCAL |14tests handlers reales/estado-Canvas simulado; preserva quitar/títulos/orden durante await, máximo7/refbusy/desmontaje. No UI autenticada/Storage real de este cambio ni publicación RC. |
| Errores de escritura / PROP-003/005 / AUD-038 | MEDIO / CORREGIDO LOCAL |9tests handlers reales/cliente ficticio, sin limpiar fotos tras RPC incierto/garantías falsas; postcommit+limpieza fallida=éxito warning. Conserva transacciones/RLS/ownership, huérfanos privados residual AUD-007; sin data real modificada. |
| Renovación sesión / AUTH-003 / AUD-036 | MEDIO / CORREGIDO LOCAL — PARCIAL | Proxy privadas request/response/getUser/cache privada, callback/recovery/API excluidos.14SSR incluidos en114unit PASS; pruebas adicionales versionadas6efd78e. Panel privado legítimo localhost3107 observado y persistente tras recarga. Allowlist2localhost autorizada/UI3/Site URL remota intacta; renovación real tras caducidad/email positivo/RC pendientes. Build/preflight/25HTTP del lote anterior conservados, no nueva compilación del SHA. |
| Auth AUTH-001–005 / PROF-001 | FUNCIONA EN FLUJOS REPORTADOS STAGING; PARCIAL | Registro/confirmación/login/perfil/recuperación y datos conservados por usuario; pruebas automatizadas diferenciadas. Correo/variantes avanzadas siguen como riesgo delimitado, no repetir altas ni pedir claves. |
| Roles/permisos PROF-002, AUD-010/011/012/013/014/019 | CONTROLES REVISADOS APROBADOS STAGING / ORIGINAL PENDIENTE | 43 SQL aisladas PASS, baseline+044–050 staging. Feed técnico autorizado separado de tablas privadas; anon sin EXECUTE, helpers internos cerrados, INSERT directo de postulación bloqueado. Excepciones definer documentadas, no alertas borradas. |
| Propiedades PROP-001–005 / imágenes IMG-001/002 / PDF-001 | FLUJOS NORMALES STAGING PARCIALES VALIDADOS | Publicación/moderación/edición/Safari/7 fotos/portada/PDF/reportes preservados; 7 referencias y objetos, 0 inconsistencias examinadas. Bucket privado y 0 firmas persistidas. Original property-images sigue público/8 URLs legadas: AUD-002 no cerrado. |
| Notificaciones NOT-001 / contacto CONT-001 | FUNCIONAN SEGÚN REPORTES; COBERTURA PARCIAL | Navegación/publicación/acceso historial y contacto autorizado tras recarga comprobados por usuario, RPC lectura propia por SQL; tercera cuenta OMITIDA / NO VALIDADA por instrucción, no insistir ni reemplazarla por admin. |
| Demanda/oportunidades DEM-001 | AUD-032 MEDIO / CORREGIDO Y DESPLEGADO STAGING | Propietario consulta requerimiento compatible ajeno sin PII y postula bodega propia publicada/activo; solicitante ve ficha técnica reducida, aviso/par único. 050/tests/commit READY exacto verificados; no sesión/UI autenticada real ni nuevos contactos/cuentas. |
| Tooling/entrega OPS-001/002/003 | AUD-031 LOCAL/SUBIDO, CUOTA BLOQUEA STAGING / AUD-033 CORREGIDO | develop 54faaf1, último publicado f67fa46; suites anteriores 70 unit/43 SQL/21 HTTP locales/audit 0 preservadas, sin nuevos builds. CLI antiguo revocado/401; usuario renueva, SDK nuevo valida mismo sitio/repo/develop/Free/recargas-overages off. Almacén oficial 600, copia obsoleta del chat eliminada. No secretos en proyecto/Git. |
| Recuperación / AUD-018 | ALTO / EN REVISIÓN — NO CORREGIDO / PAUSADO POR USUARIO | Ciclo vacío PASS anterior: seis policies no/guard previo, IDs-volúmenes/15ajenos/hostports0 preservados, guard no persistente. Usuario rechaza análisis privado y solicita otro paso; no descifrado/restore/lector,15reales0aprobados/compatibilidad-adaptador pendientes. Copias/custodia y evidencias conservadas, sin nueva revalidación del runtime/cloud/deploy/borrado. |
| Costos / AUD-023, OPS-002 | FREE CONSERVADO / NUEVA ENTREGA BLOQUEADA | Netlify Free/300 créditos por ciclo/recargas y overages off; usuario confirma agotamiento y proveedor rechaza deploy. API próxima renovación 19 octubre. No comprar ni reintentar; SMTP/Supabase anteriores sin cambios. Antes del piloto revisar consumo/contingencia $0, sin garantía de cuotas/SLA. |
| Desarrollo local / AUD-034 | ALTO operativo / CORREGIDO — RUNTIME VERIFICADO | Claves staging reales verificadas sin filas, override600/ignore/CLI original archivada-unlinked. 77 unit/lint/tipos/build/preflight y 21 HTTP en cada modo start/dev PASS. 28 JS build/20 JS dev activos sin clave privada/nombre privado/ref original. Watcher sandbox no reproducido fuera; callbacks/sesión E2E/SSR no cerrados, no linked CLI. |
| GitHub sin deploy / AUD-035 | ALTO operativo/costos / CORREGIDO — VERIFICADO | stop_builds=true, repo/config/publicado f67fa46/Free intactos. Permite commits/push de desarrollo tras revalidar guard; no habilita deploy manual/RC/main/producción. |

Cierre mínimo pendiente: sesión real prolongada/email local delimitados, RC autorizado que incluya AUD-031/036, respaldo/restauración AUD-018 y corte seguro elegido/autorizado. AUD-034/035 cerrados y AUD-036 corregido local; no repetir configuración/rotación/cuentas históricas. Sin dependencias/RLS/SQL/Storage/datos/SMTP/main/producción cambiados; único cambio remoto nuevo fueron dos callbacks exactos staging autorizados, sin enviar correo. Renovación de cuota no autoriza publicar; NO-GO conservado.

**Avance AUD-018 — 2026-10-06:** revisión/diseño autorizados durante bloqueo Netlify. Cobertura definida para BD/ACL/secuencias/qrih_private/Auth/historia/bytes Storage/procedencia/configuración; 15 casos de aceptación pendientes. Lecturas agregadas sin PII/contraseñas y sin tocar original. pg_dump/psql/docker no disponibles en PATH, Docker.app no encontrada en /Applications; CLI wrapper bloqueado por telemetría, ayuda Go no valida dump. No instalar/exportar/restaurar automáticamente. Guías Supabase/PostgreSQL orientaron mínimos privilegios, compatibilidad y separación metadatos/bytes. Sólo documentos locales, no push/build/migración; NO-GO y AUD-031 pendiente de entrega conservados.

**Preparación de reanudación — 2026-10-06:** `docs/SOFT_LAUNCH_RESUME.md` fija guards/SHA/orden/evidencia y lote HTTP existente para después de recuperar cuota. HEAD/referencia local origin/develop 54faaf1 confirmados; main 55b7737 intacto. Sin consulta remota nueva, cambios funcionales, commit/push/build/exportación/restore ni automatización. Código AUD-031 listo para entregar, AUD-018 sólo diseño: herramientas/custodia/ejecución aún pendientes. Fecha registrada 19 octubre no garantiza saldo; NO-GO conservado.

**Cierre AUD-034/035 — 2026-10-06:** ambas auditorías corregidas/verificadas en su alcance, sin módulos de negocio nuevos. Clave privada introducida sólo local por usuario, no mostrada/copiada a chat/Git; verificaciones en memoria con salidas agregadas. .env/CLI original preservados, archivo recuperable ignorado no es backup. SQL/RLS/migraciones/Storage/Auth/cuentas/correos/main/producción intactos. 77 unit/lint/tipos/build/preflight/21 HTTP start/21 mismos dev PASS. Archivos cliente activos sin secreto real/nombre privado/ref original; 33 chunks dev históricos con ref original conservados y delimitados, no servidos en las páginas revisadas. Next generó AGENTS/CLAUDE documentales; sin configuración nueva. Servidores detenidos al terminar; sesiones E2E aún no ensayadas. Rama fix/aud-034-local-staging, evidencia035 separada; sin integración develop/main ni PR/deploy automático.

## Archivo histórico de estados y especificaciones — consultar su fecha; el cuadro superior gobierna

**DEM-001 vigente — TARJETA/PERSISTENCIA POR REPORTE, REGISTRO ÚNICO ADMIN CORROBORADO:** 2026-10-06, usuario ve una tarjeta con datos correctos tras ensayo solicitado de panel/recarga. SQL read-only/rollback: 0→1 demanda new, ligada a cuenta administradora confirmada/activa, no anónima/no owner; **0 demandas del solicitante normal preparado**. Rangos/operación/zonas válidos y campos contacto presentes por agregados, sin valores privados ni comparación íntegra; empresa no coincide con marcador solicitado, no defecto demostrado. API deriva user_id de getUser servidor, no email del formulario; sesión usada por aclarar antes de atribuir fallo o validar actor normal. 0 intereses/registros/avisos de demanda y cuentas/propiedad/contacto/7 fotos/avisos/auditorías anteriores conservados por conteos. Próximo confirmar cuenta usada, sin reenvío/borrado/transferencia/interés/oportunidad. Guías Supabase/PostgreSQL separaron identidad/campos/reporte y consultas de lectura; sólo docs/lecturas, sin código/datos/configuración/main/producción/commit/build nuevos. Tercera cuenta omitida/no validada sigue igual; NO-GO/AUD-002 actual sin cierre, 0 demandas inferior es baseline anterior.

**CONT-001 vigente — TERCERA CUENTA OMITIDA / NO VALIDADA:** 2026-10-06, usuario no dispone de otra cuenta y solicita saltar el ensayo real de aislamiento. No marcar aprobado/fallido ni sustituir con admin/SQL simulado/alta automática. Coberturas anteriores conservadas, contacto/autorización siguen parciales y NO-GO general/AUD-002 actual sin cierre. No insistir con registro/selección de otra cuenta salvo nueva instrucción. Próximo DEM-001 con cuenta normal actual: vista Requerimientos y formulario existente, sin envío; baseline antes de creación futura. Guía Supabase separó permisos/reporte/prueba omitida. Sólo cuatro docs locales sin código/SQL/datos/servicios/main/producción/commit/build nuevos; selección de tercera cuenta en cortes inferiores histórica.

**NOT-001 / AUD-030 vigente — ACCESO VALIDADO POR USUARIO:** 2026-10-06, confirma visualización correcta tras Mi panel→Mis notificaciones→historial. BAJO/CORREGIDO Y DESPLEGADO STAGING, evidencia por reporte/no inspección independiente ni ensayo exhaustivo tres vistas/móvil/read_at. Entrega f84d6b2/6ac5490fca2a10000833835a READY y controles locales/remotos anteriores conservados, no reejecutados. Próximo elegir tercera cuenta normal confirmada/activa/no admin distinta de owner y solicitante autorizado, verificar baseline antes de aislamiento; no usar admin ni bypass. Guía Supabase delimitó reporte/permiso. Sólo cuatro docs locales sin código/datos/SQL/configuración/servicios/main/producción/commit/build nuevos; NO-GO/AUD-002 actual sin cierre. Cortes pendientes inferiores históricos.

**Verificación AUD-030:** 61 unit/21 HTTP locales sin sesión/lint/tipos/build PASS, 28 JS cliente/0 indicadores privados; guard staging/develop/Free/recargas y overages off previo a entrega. Sin nueva consulta SQL ni suites mutantes. Entrega/humo remoto/clic real pendientes. Los párrafos inferiores que indican controles pendientes registran momentos anteriores.

**NOT-001 / AUD-030 vigente — BAJO / CORREGIDO LOCAL:** acceso solicitado «Mis notificaciones» añadido a cabecera de `/mis-propiedades`, destino `/notificaciones` existente, visible en las tres vistas incluso sin publicaciones. Inspección confirmó ausencia antes del cambio; sólo navegación autorizada, sin función de negocio/avisos/contador/permiso/BD/RLS/API/migración/dependencia nuevos. Regresión del JSX real añadida; controles/entrega/clic real pendientes. Usuario confirma persistencia de contacto en respuesta al ensayo de nueva visita/Notificaciones: validación por reporte, no inspección independiente/SQL nuevo; pendientes tercera cuenta/rechazo/suspensión/corte actual. Guía Supabase mantuvo separado acceso visual de autorización. Main/producción intactos; NO-GO general/AUD-002 actual sin cierre. Cortes inferiores históricos.

**AUD-029 vigente — RECARGA VALIDADA POR USUARIO:** 2026-10-06, teléfono/correo permanecen visibles en misma ficha tras recarga completa con cuenta autorizada, sin reenviar. BAJO/CORREGIDO Y DESPLEGADO STAGING, persistencia visual por reporte/no inspección independiente ni nuevo SQL. 1beeacb READY/21 HTTP/controles locales anteriores conservados, no reejecutados. No repetir recarga/envío/autorización/entrega; siguiente nueva visita desde Inventario y Notificaciones→Contacto autorizado/recarga. Tercera cuenta normal/negativos/actual pendientes, no GO integral. Guía Supabase orientó separación de evidencia/permisos; sólo cuatro documentos locales, sin nuevo commit/build/código/datos/servicios/main/producción. NO-GO/AUD-002 actual sin cierre; recarga pendiente inferior histórica.

**AUD-029 vigente — CORREGIDO Y DESPLEGADO STAGING; recarga real pendiente:** Git/gh oficial fuera del aislamiento pudo usar sesión keyring existente y subir develop `1beeacb` (sin token extraído/login repetido/force); HEAD/origin/develop exactos, main intacto. Índice 180/0 hallazgos. Netlify `6ac5452d61a9ab0008eed4c8` READY/publicado/SHA exacto/develop, 2026-10-06 13:00:32 local; Free/recargas/overages off comprobados antes del push. **21 HTTP remotos sin sesión PASS**; controles locales 60 unit/30 SQL/21 HTTP/lint/tipos/build conservados, no equivalen a UI autenticada. Próximo usuario recarga MISMA ficha con cuenta autorizada, sin nuevo envío; luego nueva visita/Notificaciones/tercera cuenta normal. Guías Supabase/PostgreSQL influyeron en verificación/consulta segura, sin Supabase/datos/main/producción cambiados. Evidencia posterior sólo documental local, sin nuevo commit/build; NO-GO/AUD-002 actual sin cierre. Entrega local pendiente inferior histórica.

**AUD-029 vigente — BAJO / CORREGIDO LOCAL; entrega/recarga staging pendientes:** usuario reproduce formulario tras recarga. Ahora getUser verificado→autorización propia RLS→RPC existente restaura contacto autorizado; pending restaura polling/no permite repetir POST, cambios de actor/desmontaje descartan datos tardíos y key reinicia por propiedad. Sólo interfaz/helper de lectura/12 regresiones, sin endpoint/permiso/dependencias/arquitectura nuevos, PII persistida, RLS/Storage/SMTP/migraciones/datos/main/producción cambiados. **60 unit/30 SQL aisladas/21 HTTP locales/lint/tipos/build PASS**, 28 JS sin indicadores privados en escaneo; visual autenticado nuevo pendiente. Read-only remoto conserva 4 Auth/3 perfiles/1 published/1 contacto/1 authorized/4 avisos/24 auditorías/7 galerías y objetos por conteos. Guías Supabase/PostgreSQL orientaron identidad/RLS/RPC/callback síncrono/agregados. CLI oficial fuera del aislamiento reconoce sesión keyring existente; no extracción/renovación de credenciales ni nuevo login, entrega develop por verificar. NO-GO/AUD-002 actual sin cierre; apartados de diagnóstico inferiores históricos.

**CONT-001 vigente — AUTORIZACIÓN CORROBORADA/CONTACTO VISIBLE POR USUARIO:** 2026-10-06, contacto visible tras autorizar por reporte. SQL read-only: 1 authorized con responded_at/0 pending/1 contacto enlazado y 1 aviso al solicitante correcto; notificaciones 3→4. 4 Auth/3 perfiles/1 published/7 galerías-objetos/24 auditorías conservados por conteos. SQL simulated authenticated: autorizado ve 1 contacto con teléfono/correo presentes; admin sin autorización 0 filas (no prueba de tercera cuenta normal). No valores privados impresos. 0 terceras cuentas normales preparadas; no altas/confirmaciones/roles por agente. Persistencia UI/rechazo/tercera cuenta/suspensión/actual pendientes. Guías Supabase/PostgreSQL influyeron en agregados/rollback y separación de evidencias. Sólo docs/lecturas, sin nuevo commit/build/código/datos/config/main/producción; NO-GO/AUD-002 actual sin cierre.

**AUD-029 — BAJO / EN REVISIÓN / NO CORREGIDO:** código de PropertyContactForm no restaura autorización/contacto al cargar ficha; BD conserva authorized, no fuga/pérdida confirmada. Efecto UI por comprobar mediante recarga sin reenviar. Notificaciones tiene consulta alternativa existente, sin ensayo visual de ella todavía. Corrección mínima probable: recuperar estado propio/RPC autorizado, sin PII en almacenamiento del navegador ni solicitudes nuevas; no implementada. Pendientes inferiores de autorización son históricos.

**CONT-001 / Mensaje aclarado:** usuario lo dejó vacío; comportamiento esperado del campo opcional, no fallo confirmado. No reenviar ni modificar la solicitud existente. Autorización UI pendiente; persistencia de texto no vacío no demostrada aquí. Duda del corte siguiente ya contestada.

**CONT-001 vigente — ENVÍO PENDING CORROBORADO; AUTORIZACIÓN UI PENDIENTE:** 2026-10-06, respuesta afirmativa del usuario al ensayo envío/contacto oculto (reporte, no inspección). SQL read-only: 1 contacto enlazado/1 pending propia sin responder/1 aviso owner correcto; notificaciones 2→3. 4 Auth/3 perfiles/1 published/7 galerías-objetos/24 audit_logs conservados por conteos, no comparación íntegra. SQL authenticated simulado: solicitante ve pending y RPC owner 0 filas; owner ve solicitud/contacto/aviso. Mensaje opcional vacío, pregunta al usuario pendiente antes de atribuir fallo; no reenviar. Próximo owner no admin, navegador/perfil separado→Mis propiedades→Ver solicitudes→Autorizar contacto UNA vez; solicitante mantiene ficha para refresco existente, sin nueva solicitud. Visibilidad posterior/persistencia/tercera cuenta/rechazo/suspensión pendientes. Guías Supabase/PostgreSQL influyeron en agregados/rollback y separación de evidencia; sólo documentos locales/lecturas, sin código/datos/config/main/producción/commit/build cambiados. NO-GO/AUD-002 actual sin cierre; envío pendiente inferior histórico.

**CONT-001 vigente — PREPARACIÓN MANUAL VERIFICADA; ENVÍO UI PENDIENTE:** 2026-10-06, read-only/rollback: 4 Auth/3 perfiles/1 published owner activo/7 galerías y objetos; 0 contactos/autorizaciones/avisos de contacto, 2 notificaciones/24 auditorías totales. Solicitante confirmado/activo/no admin/separado; owner automático desactivado. SQL authenticated simulado del solicitante: propiedad pública visible y RPC contacto owner 0 filas antes de autorización; anon sin EXECUTE solicitar/leer contacto. No sesión/UI nueva demostrada por SQL. Usuario enviará UNA solicitud desde ficha con cuenta nueva; esperado solicitud correcta/manual pendiente y contacto owner oculto. No autorizar aún, repetir alta/envío/moderación ni cambiar configuración. Después corroborar creación única/preservación antes de autorización; UI rechazo/persistencia/tercera cuenta pendientes. Guías Supabase/PostgreSQL orientaron consultas agregadas y separación de permisos; sólo documentación local, sin nuevo commit/build/código/datos/servicios/main/producción cambiados. NO-GO general/AUD-002 actual sin cierre; baseline pendiente inferior histórico.

**AUD-028 vigente — LOGIN NORMAL VALIDADO POR USUARIO:** 2026-10-06, respuesta afirmativa a prueba login canónico sin next con cuenta nueva activa→Mis propiedades. Validación por reporte, no inspección independiente ni confirmación específica de lista vacía/rol/contenido íntegro. 816aa31 READY/21 HTTP/visual público previos conservados, sin repetirlos. BAJO/CORREGIDO Y DESPLEGADO STAGING; nuevo ciclo post-alta/callback y next/admin reales pendientes. Siguiente CONT-001: baseline/configuración antes de solicitud entre actores separados/no admin, sin envío aún. Guía Supabase orientó separar destino/permiso; sólo documentación local, sin nuevo commit/build ni código/datos/main/producción cambiados. NO-GO general/AUD-002 en actual sin cierre; corte siguiente histórico previo al reporte.

**AUD-028 vigente — CORREGIDO Y DESPLEGADO STAGING; login real pendiente:** develop `816aa31` incluye `629f469`; Netlify `6ac5237d37388600080e39f7` READY/publicado, commit exacto/develop, 2026-10-06 10:36:50 local. Free/recargas/overages off. **21 HTTP remotos sin sesión PASS**; tarjeta confirmación/Spam revisada en navegador staging y ausente en login normal. 48 unit/30 SQL/build/tipos/lint locales conservados. No nuevas altas/correos/sesiones autenticadas por agente. Usuario login canónico sin next con cuenta activa→Mis propiedades (sin propiedades propias); después baseline/configuración contactos. Guía Supabase orientó separar UX/identidad/permiso; sólo lecturas/pruebas negativas/documentación local, sin nuevo commit por esta evidencia ni main/producción/Supabase cambiados. NO-GO general/AUD-002 en actual sin cierre; entregas pendientes inferiores históricas.

**Entrega AUD-028:** corrección en develop `629f469`, 178 archivos/0 hallazgos. Push desde agente no completado por credencial GitHub no disponible; usuario sube develop desde Terminal autenticada. Deploy exacto/UI real pendientes, sin main/producción cambiados.

**Vigente AUD-028 — BAJO / CORREGIDO LOCAL; despliegue y UI autenticada pendientes:** registro correcto sin sesión→login automático con tarjeta visual «Cuenta creada: confirma tu correo», aviso de Spam y uso del mismo navegador. Login/callback normal→panel existente `/mis-propiedades`, no prototipo `/panel`; next interno explícito en login/registro, admin activo `/admin` y recuperación preservados. Bandera visual no concede acceso ni contiene email/tokens. **48 unit/30 SQL aisladas/21 HTTP locales/lint/tipos/build PASS**, tarjeta local revisada visualmente y ausente en login normal. Sin correos/altas reales por agente, cambios Supabase/RLS/Storage/SMTP/dependencias/main/producción. Falta entrega exacta y login con cuenta existente en staging; no nuevo registro sólo por esta prueba.

**AUD-023 actualizado:** usuario encuentra correo en Spam y activa cuenta; lectura SQL agregada/rollback corrobora **4 Auth/3 perfiles**, objetivo confirmada/no anónima/perfil publisher activo/no admin/0 propiedades propias. CONT-001 tiene actor separado disponible, pero baseline/configuración/solicitud siguen pendientes. No fallo SMTP confirmado; fiabilidad general pendiente, ALTO/EN REVISIÓN. Guías Supabase/PostgreSQL influyeron en comprobación agregada y preservación de confirmación/PKCE, sin cambio de seguridad por UX. **NO-GO general/AUD-002 en actual sin cierre**. Evidencias inferiores conservadas como histórico.

**AUD-023 / correo nuevo — 2026-10-06 10:01 local:** usuario no recibe confirmación, QRIH muestra cuenta creada. SQL exacto read-only: 4 Auth/2 perfiles; objetivo única/no confirmada/no anónima/sin perfil, creada 09:50 y confirmation_sent_at 09:58 local. Logs: cuatro confirmaciones solicitadas /signup 200, sin errores SMTP/límite observados en ventana; no acredita entrega ni identifica causa. **ALTO / EN REVISIÓN / NO CERRADO**, éxitos anteriores conservados. CONT-001 espera confirmación del solicitante: comprobar buzón/Spam/remitente y luego proveedor si ausente; no repetir altas/reenvíos ni auto-confirmar/crear perfil/reducir seguridad. Guías Supabase/PostgreSQL aplicadas a verificación agregada/envío vs entrega. Sólo lectura/documentos sin PII, sin código/SMTP/datos/main/producción cambiados; NO-GO general/AUD-002 en actual sin cierre.

**CONT-001 — 2026-10-06:** usuario confirma teléfono/correo del propietario ocultos en ficha de prueba tras comprobación solicitada sin login/ventana privada. **Privacidad visual sin sesión validada por reporte**, no nueva inspección independiente de HTML/API/RLS ni autorización/contacto probado. Próximo: identificar solicitante existente distinto del owner/no admin y verificar baseline/configuración antes de una solicitud; sin crear cuentas, cambiar roles o enviar contactos todavía. Manual/automático, autorización/rechazo y aislamiento UI siguen pendientes. Evidencias previas conservadas; guía Supabase aplicada a separación de identidad/permisos/reporte. Sólo documentación local, sin código/datos/servicios/main/producción cambiados; NO-GO general/AUD-002 en actual sin cierre.

**AUD-027 UI publicación — 2026-10-05 21:26 local:** usuario confirma clic en aviso existente de publicación desde Mi perfil→Mis propiedades. **BAJO / CORREGIDO Y DESPLEGADO STAGING — PUBLICACIÓN UI VALIDADA POR REPORTE**, sin inspección independiente/read_at. Deployment c327d05/20 HTTP previos conservados, sin repetición; rechazo/variantes reales pendientes, no cierre exhaustivo de notificaciones. Siguiente CONT-001: ficha sintética sin login en ventana privada, verificar que no revele teléfono/correo del propietario (campos vacíos del formulario no son datos revelados), sin enviar solicitud aún. Después preparar solicitante separado/no admin para autorización manual. Guía Supabase aplicada para distinguir UI/identidad/autorización; sólo documentación, sin código/configuración/datos/main/producción cambiados. NO-GO general/AUD-002 en actual sin cierre; corte inferior con publicación pendiente es histórico.

**AUD-027 desplegado — 2026-10-05 21:23 local:** push exitoso aportado por usuario; Netlify `6ac469632d14710008ee5b7e` READY/publicado, commit exacto `c327d054fd2fe133a4a61ae1eeeb348e8c2dd385`/develop, publicado 2026-10-05 21:22:40 local. Free/recargas/overages off. **20 HTTP remotos sin sesión PASS**, sin escrituras válidas/correos/cambios de contraseña; controles locales 42 unit/30 SQL/lint/tipos/build previos conservados. **BAJO / CORREGIDO Y DESPLEGADO STAGING — CLIC REAL PENDIENTE.** Usuario: recargar→Mi perfil→aviso existente de publicación, incluso leído→Mis propiedades; rechazo existente igual si disponible, sin nuevos avisos/moderación. HTTP no valida clic/read_at. Guía Supabase orientó separación de pruebas sin sesión/UI, sin implementación nueva. Sólo documentación local; main/producción intactos, NO-GO general/AUD-002 en actual sin cierre; cortes inferiores de entrega son históricos.

**Entrega AUD-027 — 2026-10-05 21:21 local:** login gh completado por usuario; push falló por helper deformado y pegado de comandos en prompt de credenciales, no regresión funcional. Corregir instrucción de Terminal con ruta literal/comillas simples (sin `!$` en comillas dobles); no repetir login ni pedir contraseñas/tokens. Agente sigue sin credencial disponible para lectura normal; índice 177/0 secretos. Sólo documentos locales; AUD-027 BAJO/CORREGIDO LOCAL, entrega/deploy/clic pendientes, main/producción intactos/NO-GO general.

**AUD-027 entrega aún pendiente — 2026-10-05 21:16 local:** tras reporte «subido», GitHub UI autenticada muestra develop en e3adb3942146b8298ef5d7d970dbfcca15aebc90, no c327d054fd2fe133a4a61ae1eeeb348e8c2dd385. Netlify confirma mismo deployment anterior 6ac43bec9300d800080306b9 READY/e3adb39; cinco despliegues recientes sin la corrección. Free/recargas/overages off. **BAJO / CORREGIDO LOCAL — SUBIDA/DEPLOY/CLIC REAL PENDIENTES**; no validar clic ni atribuir humo de versión anterior a esta corrección. CLI sin credencial disponible; conector sin acceso, interfaz del repositorio privado sí legible. Pedir salida final del push sin secretos antes de continuar entrega. Sólo documentos locales, sin código/configuración/datos/producción/main cambiados; NO-GO general/AUD-002 en actual sin cierre.

**Entrega AUD-027 — 2026-10-05 21:08 local:** commit local develop `c327d054fd2fe133a4a61ae1eeeb348e8c2dd385`, 177 archivos/0 hallazgos antes de commit. Push HTTPS sin force a repositorio exacto autorizado se detuvo: Git no pudo obtener usuario/credencial; gh auth status informa credencial default no válida en este proceso. No extracción de secretos, cambios de credenciales globales ni alternativa de subida. Origin/develop local conserva e3adb39; no se verificó nuevo deploy. **BAJO / CORREGIDO LOCAL — PUSH/DEPLOY/UI PENDIENTES**. Usuario debe subir desde Terminal con autenticación oficial válida; si hace falta, login web de gh, nunca claves/códigos en chat. Sólo documentación de entrega posterior local, no nuevo commit/build por evidencia. Main/producción intactos, NO-GO general.

**Owner y AUD-027 — 2026-10-05 21:04 local:** usuario confirma Mis propiedades Publicada y notificación visible; reporta clic sin destino en menú Mi perfil. AUD-027 **BAJO / CONFIRMADO / CORREGIDO LOCAL**, no fallo de entrega ni seguridad: Header carecía de ramas de navegación para publicación/rechazo; helper añade destino fijo /mis-propiedades sólo para esos tipos, resto de rutas/read_at intactos. **42 unit (5 nuevas)/30 SQL aisladas/20 HTTP locales/lint/tipos/build PASS**, 28 JS cliente/0 indicadores privados. No dependencias/env/BD/RLS/Storage/API/app-notificaciones/configuración/datos/producción cambiados. Nueva ID NOT-001 documenta funcionalidad ya existente, no feature añadida. Git/deploy exacto y clic real aún pendientes; probar aviso existente, no publicar/rechazar otra vez. Supabase guió preservación de filtrado/read_at y separación de UI/pruebas. **NO-GO general/AUD-002 en actual no cerrado**. Pendientes inferiores de owner estado/aviso visible cumplidos para su cobertura, navegación no validada externamente.

**Publicación y UI pública — 2026-10-05 20:53 local:** usuario confirma que toda la comprobación solicitada se ve bien: descripción corregida/portada/siete fotos, abrir y recorrer galería, PDF con datos/fotografías. **Visual validado por reporte del usuario**, en respuesta a prueba solicitada sin sesión/ventana privada; no inspección independiente de navegador/PDF ni validación exhaustiva de páginas/dispositivos. Corte independiente 20:49 conservado: SQL published/7 referencias-portada/bucket privado/1 auditoría admin/1 notificación owner; anon base 0/proyección pública 1/galería 7/objetos 0; **17 HTTP sin sesión PASS** (ficha 200, siete firmas/HEAD 200 WebP, siete públicas antiguas HEAD 400, PDF 200 MIME/%PDF-). Sin URLs firmadas persistidas en campos de imágenes. No nuevas consultas ni HTTP este turno; pendientes TTL/revocación de firmas, negativos, backup/corte actual. Próximo: owner→Mis propiedades Publicada y notificación de publicación; no repetir aprobación/galería/PDF/cargas. Sólo documentación por agente, sin código/datos/configuración/producción modificados. **NO-GO general/AUD-002 en actual no cerrado**, no apertura de piloto; pendientes inferiores de visual público históricos.

**Corrección y reenvío — 2026-10-05 20:43 local:** usuario confirma En revisión después de editar/reenvíar. SQL staging: única propiedad pending de publisher activo; descripción contiene texto de prueba identificado con normalización de mayúsculas/espacios/punto final (no coincidencia literal exacta), rejection_reason NULL, 7 referencias con objetos/portada=primera imagen/bucket privado. Anon SQL: 0 propiedades/galerías/objetos; **9/9 HTTP sin sesión PASS**, ficha/PDF 404 y siete HEAD públicas Storage 400 sin MIME imagen. Corrección/reenvío validados parcialmente; no comparación íntegra de otros campos/bytes. Próximo: admin verifica descripción y fotos de la reenviada y, si correctas, publica **sólo esta propiedad sintética en staging**. Aprobación/published/ficha/PDF aún pendientes; no GO para usuarios reales. Sólo lectura/documentación por agente, sin código/datos/configuración/producción modificados; **NO-GO general/AUD-002 en actual no cerrado**. Pendientes inferiores de corrección/reenvío son históricos.

**Vista propietaria tras rechazo — 2026-10-05 20:36 local:** usuario confirma que ve correctamente Rechazada, motivo de prueba, portada/siete fotos y notificación. Cobertura UI por reporte, no nueva lectura independiente de BD ni comprobación del flag de notificación leída/email. SQL/9 HTTP del corte rejected anterior se conservan, no reejecutados. Próximo ensayo en la misma propiedad sintética de staging: propietario→Editar→añadir al final de la descripción «Descripción ajustada para prueba de staging.» sin cambiar otros campos/fotos→GUARDAR CAMBIOS Y REENVIAR. Corrección/reenvío aún no realizados ni confirmados; después verificar pending y persistencia antes de aprobar. Sólo documentación por agente, sin código/datos/configuración/producción modificados; **NO-GO general/AUD-002 en actual no cerrado**. Pendientes inferiores de vista propietaria quedan cumplidos para esta cobertura.

**Rechazo confirmado — 2026-10-05 20:33 local:** usuario ve Rechazada; SQL staging corrobora única propiedad `rejected` de publisher activo, motivo exacto de prueba guardado, 7 rutas/referencias con objetos y portada=primera imagen, bucket privado. 1 auditoría de rechazo por admin activo y 1 notificación al propietario con motivo. Anon SQL: 0 propiedades/galerías/objetos. **9/9 HTTP sin sesión PASS**: ficha/PDF 404, siete HEAD Storage públicas 400 sin MIME imagen. Lectura de la notificación/estado/motivo/fotos desde UI del propietario pendiente; existencia SQL no acredita entrega visual ni email. Próximo: comprobarlo como propietario antes de corregir/reenvíar; no aprobar aún. Sólo read-only/documentación por agente, sin código/datos/configuración/producción modificados; **NO-GO general/AUD-002 en actual no cerrado**. Corte anterior pending y rechazo pendiente queda histórico.

**Admin pending y privacidad HTTP — 2026-10-05 20:26 local:** usuario confirma abrir propiedad En revisión como administrador y ver portada/siete fotos. Lectura independiente staging conserva 1 propiedad pending de publisher activo, 7 referencias con objetos existentes, portada correcta y bucket privado. **9/9 HTTP sin sesión PASS:** GET ficha y PDF exactos 404; HEAD de las siete rutas públicas Storage 400, sin MIME de imagen, sin cookies/firma ni descarga de fotografías. Complementa anon SQL previo (0 propiedades/galerías/objetos), no prueba revocación de firmas anteriores/TTL/GET de bytes ni todas las superficies públicas. Próximo: rechazo de prueba con motivo sintético desde admin; después comprobar estado/motivo/fotos del propietario antes de corregir/reenviar. No rechazo ejecutado por agente ni aún confirmado por usuario. Sólo lectura/documentación; sin cambios funcionales, datos, configuración o producción. **NO-GO general; AUD-002 en actual no cerrado.** Cortes inferiores con admin pending/HTTP pendientes son históricos.

**Envío a revisión confirmado — 2026-10-05 18:41 local:** usuario ve «En revisión»; lectura independiente staging confirma 1 propiedad `pending`, 0 draft/0 published, propietario publisher activo, 7 galerías/rutas distintas/objetos referenciados y portada=primera imagen. 1 admin activo, bucket privado. SELECT bajo rol anon en transacción read-only con rollback: 0 propiedades, galerías y objetos de property-images visibles. No verifica HTTP/URL firmada previa ni acceso/render admin del estado pending. Próximo: cuenta admin→abrir la misma propiedad en revisión→confirmar portada/siete fotos antes de aprobar/rechazar; privacidad HTTP pendiente. Sólo consultas read-only y documentación por agente, sin código/datos/RLS/Storage/configuración/producción modificados. NO-GO general; AUD-002 en actual no cerrado. Pendientes inferiores de envío son históricos.

**AUD-026 vigente — 2026-10-05 18:31 local:** **ALTO / CORREGIDO Y DESPLEGADO STAGING — FLUJO NORMAL VALIDADO POR USUARIO; COBERTURA PARCIAL.** Correo/cambio confirmados a las 18:26; ahora confirma login con contraseña nueva y conservación del perfil/borrador/portada/siete fotos solicitados. Evidencia de UI por reporte, no comparación íntegra independiente de BD/roles ni lectura de credenciales. Rechazo de contraseña anterior, logout/sesiones y negativos de enlaces/otra cuenta/TTL siguen pendientes; no se declara revocación instantánea. No repetir recuperación/login/fotos. Se puede retomar ensayo publisher: mismo borrador→Editar→GUARDAR CAMBIOS Y ENVIAR A REVISIÓN; comprobar pending y privacidad antes de moderación. Sólo documentación actualizada por agente, sin código/configuración/datos/producción modificados; **NO-GO general**, AUD-026 no cerrado integralmente y AUD-002 en actual no cerrado. Cortes inferiores son históricos.

**Entrega vigente AUD-026 — 2026-10-05 18:13 local:** `e3adb3942146b8298ef5d7d970dbfcca15aebc90` coincide HEAD/origin/develop/commit publicado; Netlify `6ac43bec9300d800080306b9` READY, publicado 2026-10-06 00:08:40.379 UTC. Free, recargas/overages off; **20/20 HTTP sin sesión PASS en staging**, incluidas nuevas rutas y denegaciones recovery. **ALTO / CORREGIDO Y DESPLEGADO STAGING — CORREO/CAMBIO REAL PENDIENTES**, NO-GO general. Usuario solicitará un enlace nuevo desde QRIH y lo abrirá en el mismo navegador; él introduce/guarda contraseña. No envío de correo ni cambio de Auth/datos/configuración/producción por agente; moderación draft sigue pausada hasta recuperar acceso. AUD-002 no cerrado en actual. Esta entrega sustituye pendientes Git/deploy de los cortes inferiores, no sus pruebas reales pendientes.

**Implementación AUD-026 (2026-10-05):** autorización de implementación recibida. Login enlaza a Recuperar contraseña; solicitud explícita mediante Supabase Auth/publishable key, mensaje no enumerador, guard UI de doble envío/espera 60 s sin reducir cuotas del proveedor. PKCE vuelve al callback exacto existente: evento público PASSWORD_RECOVERY después del intercambio válido lleva a Restablecer, sin ensureOwnProfile/alta de perfiles en esa rama; confirmación de registro conserva Publicar. Cookie HttpOnly/Secure en HTTPS, SameSite=Lax, ventana 600 s y binding de usuario/token evita confundir sesiones; **marca de UX, no credencial ni permiso**: getSession sólo aporta token y getUser(token) valida identidad en servidor. POST del mismo origen, body 4 KiB, contraseña/confirmación 8–128 caracteres, updateUser sólo password, retiro de marca y intento de logout global; errores no imprimen secretos ni falsean éxito si falla logout.

**37 unitarias (8 recovery), 30 SQL aisladas, 20 HTTP locales, lint/tipos/build PASS.** Una prueba usa SDK SSR real/cookies PKCE y HTTP simulado: no correo/Auth real. UI local muestra solicitud y deniega formulario sin marca/sesión válida. No credenciales leídas/introducidas ni solicitudes de correo/cambios de contraseña remotos por agente. No dependencias/env/migraciones/RLS/Storage/Supabase config/producción cambiados. Guía Supabase orientó PKCE/evento público, validación getUser y caché privada; arquitectura conservada, se añade sólo Route Handler del cambio propio. Evidencia y límites: supabase/staging/password-recovery-verification-2026-10-05.md. **NO-GO general**, AUD-026 no cerrado externamente; AUD-024 era perfil. Tras publicar develop: usuario solicita un enlace nuevo desde QRIH en el mismo navegador, introduce él la nueva contraseña y verifica login/datos/fotos; no reutilizar correo Dashboard ni enviar a revisión antes. Apartado diagnóstico siguiente es histórico.

**AUD-026 — ALTO / CONFIRMADO EN CÓDIGO — NO CORREGIDO (2026-10-05 14:09 UTC, 08:09 local):** recuperación de contraseña ausente. Usuario olvidó su contraseña y reporta que correo de recuperación enviado desde Dashboard vuelve al inicio sin formulario. No existen llamadas a resetPasswordForEmail/updateUser(password), rutas/formulario de reset ni manejo PASSWORD_RECOVERY en app/components/lib/tests. Login sólo email/password y registro; Perfil anuncia administración de contraseña futura. Callback sólo intercambia code y termina en Publicar, sin rama recovery. **Bloqueante de aptitud para Soft Launch y continuidad de moderación**, no evidencia de acceso indebido. El redirect/config/formato/validez del enlace concreto no se inspeccionó ni se recibió: su causa exacta permanece no verificable. AUD-024 recuperó el **perfil** mediante login, no una contraseña olvidada; cualquier referencia histórica ambigua a recuperación debe entenderse así.

AUTH-005 queda **NO IMPLEMENTADO / EN REVISIÓN**. Propuesta mínima: solicitud desde Login, retorno de recovery separado/validado y formulario de contraseña nueva/confirmación, mediante Supabase Auth del propio usuario, sin clave privada ni cambios de rol/BD/RLS/Storage. Diseño de PKCE/token hash y redirect/template exactos a confirmar antes de implementar; no aceptar type/next de URL como autorización. Moderación en pausa operativa: no enviar a revisión mientras falta acceso publisher. Portada/siete fotos admin ya confirmadas se conservan. Sólo documentación en este corte, sin enviar correos/cambiar contraseñas/cuentas/configuración/datos/producción; NO-GO general. Auditoría/matriz: QRIH_AUDIT.md, AUD-026.

**Render admin confirmado — 2026-10-05 13:44 UTC (07:44 local):** usuario confirma que portada y siete fotografías se ven correctamente en la ficha administrativa. Listado/apertura/render admin **VALIDADOS PARCIALMENTE STAGING por reporte del usuario**, no inspección directa ni prueba de expiración/renovación. Última lectura independiente (13:42 UTC): 1 draft de publisher activo, 7 galerías/objetos, portada correcta y bucket privado; anon sin lectura. No nueva consulta remota ni cambios funcionales/datos/roles/producción en este corte. Pendiente **draft→pending** desde sesión publisher usando **GUARDAR CAMBIOS Y ENVIAR A REVISIÓN →**, luego comprobar privacidad y visibilidad admin antes de moderar. No aprobar/rechazar todavía, cambiar fotos ni crear otra propiedad. Los pendientes inferiores de render admin quedan cumplidos para esta cobertura; **NO-GO general y AUD-002 no cerrado en actual**.

**Acceso UI administrador confirmado — 2026-10-05 13:42 UTC (07:42 local):** usuario informa que puede ver y abrir el borrador desde el panel de la cuenta admin preparada. **Listado/apertura admin validados parcialmente por reporte del usuario**, no inspección directa del navegador; no confirma todavía render de portada/siete fotos, moderación o PDF. Lectura agregada independiente: 1 admin activo, 1 propiedad draft de publisher activo, 0 pending/0 published, 7 galerías/rutas distintas/objetos, portada=primera imagen y bucket privado. Consulta bajo anon con rollback: 0 propiedades públicas/galerías/objetos visibles; no nueva prueba HTTP ni descarga. Guías Supabase/PostgreSQL aplicadas para separar lectura privilegiada de acceso público y registrar sólo evidencia comprobada, sin PII/rutas/firmas.

Sin cambios de datos/roles/código/RLS/Storage/migraciones/configuración/deploy/producción en este corte. **NO-GO general; AUD-002 no cerrado en actual.** Próximo: confirmar visualmente portada y siete fotos en la ficha admin; después, desde sesión publisher, usar **GUARDAR CAMBIOS Y ENVIAR A REVISIÓN →**, comprobar pending privado antes de rechazar/aprobar. No cambiar fotografías ni crear otra propiedad. Los pendientes inferiores de login/listado/apertura admin ya se cumplieron sólo con esta cobertura; render y moderación siguen pendientes.

**Administrador de ensayo preparado — 2026-10-05 13:36 UTC (07:36 local):** usuario autorizó una segunda cuenta exacta; preflight: 1 Auth confirmada/no anónima, 1 perfil publisher activo y 0 propiedades propias. En staging `mcyxunymhuxyiwklyfpy` se cambió **únicamente `profiles.role` de publisher a admin**, con identidad bloqueada y actualización condicional dentro de transacción. Comparación antes/después en memoria confirma que los demás campos del perfil, otros perfiles, identidad/confirmación/metadata Auth, propiedades, galerías, objetos y configuración del bucket permanecen iguales; sin exportar datos personales ni hashes. Resultado: **1 admin activo separado, 1 draft con propietario publisher activo, 7 galerías/7 objetos, bucket privado**. No altas/perfiles/auto-confirmación, JWT administrativo, migración, relajación de RLS/trigger, código, deploy, plan pagado ni producción modificados.

Verificación posterior en transacción `authenticated` con identidad del admin y rollback: `current_user_is_admin()=true`, perfil propio visible, 1 draft y 7 galerías legibles. **Es prueba SQL de autorización, no login/UI ni descarga/render de imágenes.** Guías Supabase/PostgreSQL y documentación/changelog vigentes consultados para verificar identidad, aplicar sólo el privilegio autorizado y comprobar preservación. Moderación UI sigue pendiente, **NO-GO general; AUD-002 no cerrado en actual**. Próximo: iniciar sesión con esta cuenta en navegador separado y abrir `/admin`; conservar borrador sin enviarlo a revisión hasta confirmar acceso. Los cortes inferiores con 0 admin/elección pendiente son históricos y quedan sustituidos sólo en ese punto.

**Preparación admin detenida por identidad — 2026-10-05 07:24 local:** la cuenta propuesta por el usuario existe una sola vez en Auth, confirmada/no anónima, con perfil publisher activo, pero **es propietaria del borrador**. No cumple la separación de cuentas acordada para probar moderación. **No se cambió su rol ni se creó/asignó un administrador.** Lectura posterior: 0 admin/1 draft/7 galerías/7 objetos. Elegir otro correo bajo control del usuario; si no existe, alta y confirmación normales, sin perfil/confirmación administrativa manual. El correo/ID no se duplican en Git. Guías Supabase/PostgreSQL: comprobación de identidad/ownership antes de privilegios; sólo consultas/documentación, código/configuración/producción intactos. No es un nuevo hallazgo de software, sino elección pendiente para el ensayo; NO-GO general y moderación UI pendiente.

**Portada/orden y privacidad pública — corte 2026-10-05 07:10 local (13:10 UTC):** usuario aclara que **la nueva foto Principal** persiste al recargar. Lectura actual: 1 draft, 7 rutas distintas/galerías/procedencias/objetos, posiciones 0–6, portada coincide con primera foto, rutas propias/WebP por procedencia y metadatos, bucket privado, **0 nuevas subidas desde el corte de siete**. Prueba pública sin sesión/firma: GET ficha **404**, GET PDF **404**, HEAD siete URLs `/object/public/property-images/` **400**, ninguna responde MIME de imagen. No descarga de fotos ni afirmación de GET de bytes/sesión ajena. Netlify sigue be370e6 / 6ac32d2027c97d0008e48e45 READY/develop/Free/recargas y overages off/logs privados. Guías Supabase/PostgreSQL: evidencia agregada y separación entre lectura privilegiada y accesos públicos; rutas se usaron sólo en memoria, no documentadas. **Portada/orden persistentes Safari y denegación pública del draft validados parcialmente staging**, NO-GO general; AUD-002 no cerrado en actual. **0 administradores en staging**: elegir/autorización explícita de cuenta separada antes de asignar permisos y continuar moderación; no enviar a revisión todavía. Sólo documentación/lecturas, sin cambios de código/datos/RLS/bucket/migraciones/configuración/producción. Cortes inferiores que piden reordenar/privacidad HTTP ya se cumplieron para esta cobertura.

**Siete fotos Safari verificadas — corte 2026-10-05 05:15 UTC (2026-10-04 local):** usuario completa la prueba y reporta selector deshabilitado. Lectura agregada: **1 draft con título esperado, 7 galerías/7 rutas distintas/7 procedencias/7 objetos property-images**, posiciones `[0,1,2,3,4,5,6]`, 7/7 rutas propias/WebP según metadatos y procedencia/tamaños acotados/sin URL o token. Portada coincide con primera foto; bucket privado. Bajo anon: 0 propiedades públicas/galerías/objetos visibles. **Guardado de siete y bloqueo UI de octava validados en staging**; no se envió una octava petición, no cuenta como nueva prueba de rechazo backend. SQL/HTTP anteriores del límite se conservan separados. Agente sólo lectura/documentación según guías Supabase/PostgreSQL, sin emitir firmas/descargar fotos/modificar datos/código/configuración/producción. AUD-025 corregido, flujo normal Safari hasta siete validado parcialmente; Chrome/negativos/TTL/corte actual pendientes, **NO-GO general**, AUD-002 no cerrado en actual. Próximo: reordenar segunda foto como Principal y comprobar portada/galería al guardar y recargar, sin envío a revisión. Cortes inferiores de dos fotos/siete pendiente son históricos.

**Edición y recarga Safari verificadas — corte 2026-10-05 05:09 UTC (2026-10-04 local):** usuario confirma que título y ambas fotos se conservan al guardar/reabrir/recargar. Consulta sólo lectura: **1 propiedad draft con título esperado «PRUEBA STAGING — EDICIÓN», updated_at posterior a created_at, 2 galerías/2 procedencias/2 objetos, 0 nuevas subidas desde el corte anterior**. Ambas rutas propias/WebP verificadas por procedencia y metadatos, portada aún en primera imagen, bucket privado. Bajo rol anon: 0 propiedades públicas/galerías/objetos visibles. **PROP-003 edición simple y persistencia UI Safari validadas parcialmente; AUD-025 guardado/edición/recarga normal de dos fotos VALIDADO STAGING.** No acredita edición de todos los campos, carrera concurrente ni HTTP ajeno/decodificación independiente; Chrome/siete fotos/negativos/corte actual pendientes. Guías Supabase/PostgreSQL mantienen verificación agregada sólo lectura y aislamiento del rol público, sin datos personales en documentos. Sólo documentación, sin código/datos/configuración/firmas/producción modificados, NO-GO general. Próximo: añadir cinco fotos al mismo borrador, guardar siete y verificar bloqueo UI de octava. Cortes siguientes con edición/recarga pendiente son anteriores a esta prueba.

**Resultado vigente AUD-025 — CORREGIDO / GUARDADO DE DOS FOTOS SAFARI VALIDADO STAGING:** usuario confirma «SI SE GUARDARON AMBAS» tras be370e6 publicado. Verificación sólo lectura 2026-10-05 05:00 UTC (2026-10-04 local): **3 Auth, 2 perfiles, 1 propiedad draft, 0 no-draft, 2 imágenes de galería, 2 procedencias y 2 objetos property-images**. Join comprueba ambas rutas propias/WebP según metadatos y procedencia/tamaño acotado/sin URL ni token; portada coincide con primera foto y main_image legado NULL. Bucket privado, MIME permitido sólo WebP. Transacción de lectura bajo rol anon: 0 propiedades públicas/galerías/objetos visibles; no equivale a prueba HTTP de bytes ni de otra cuenta. Guardado real reportado por usuario, no navegación del agente. **NO-GO general**; edición/recarga/Chrome/límites UI/corte actual pendientes. Se preserva el borrador del usuario, sin eliminar/reparar datos ni crear firmas. Guías Supabase/PostgreSQL aplicadas para verificación cruzada y separación entre privilegios de auditoría y acceso anon. Cortes inferiores con 0 propiedades/UI pendiente son históricos. Próximo: editar sólo título, guardar y recargar sin enviar a revisión.

**Entrega AUD-025 verificada:** commit `be370e6fd5f07e5c9b25cffa1a78d5a661b38078` de develop publicado en Netlify `6ac32d2027c97d0008e48e45`, READY, 2026-10-05 04:53:19.024 UTC (2026-10-04 local). **15/15 HTTP sin sesión PASS** en sitio canónico; nueve chunks de Publicar examinados contienen el fallback corregido, sin patrones de clave privada/service-role ni referencia al proyecto actual. Free/auto-topup off/overages off/logs privados/develop confirmados. **AUD-025: CORREGIDO Y DESPLEGADO STAGING — PRUEBA UI SAFARI PENDIENTE**, no GO. El párrafo siguiente conserva el diagnóstico local previo a esta entrega. No nueva carga/alta/edición/migración/configuración por el agente, producción intacta. Sólo evidencia documental posterior queda local; no otro build por documentación.

**Último avance AUD-025 — ALTO / CORREGIDO LOCAL; STAGING PENDIENTE:** Guardar borrador con fotos en Safari falló; tres registros privados de ingesta indican `format`, antes de Storage. Reproducción sintética confirma Canvas PNG etiquetado incorrectamente como WebP. Corrección puntual: cliente conserva MIME real y usa JPEG optimizado si no puede codificar WebP; servidor verifica JPEG/PNG/WebP auténticos y siempre guarda WebP. Sin nuevas funcionalidades/dependencias/arquitectura ni cambios de bucket/RLS/migraciones/datos/env/producción. 29 unit/30 SQL/lint/tipos/build PASS. Cero propiedades/galerías/procedencias/objetos de fotos en staging; formulario del usuario no intervenido. **NO-GO**, falta subir a develop/desplegar y repetir dos fotos/Guardar borrador/Editar en Safari. Logs no incluyen bytes privados: causa compatible, no captura forense de la fotografía. La entrega publicada sigue `5fad292` y aún no incluye esta corrección. Detalle: QRIH_AUDIT.md AUD-025 y supabase/staging/upload-verification-2026-10-04.md.

**Git / entrega verificada:** repositorio `https://github.com/arzalight/qrih` privado, con `main` (`55b7737`) y `develop` (`ee4d465` al conectar). Netlify `qrih-staging` sigue **únicamente `develop`**, sin branch deploys adicionales ni Deploy Previews, con logs privados. Primer deployment Git `6ac2be07ce110e3b94a50a2c` READY y publicado, commit `ee4d465991a0a321ada13ff28e41993364d3253d`. 15 HTTP sin sesión pasan de nuevo; nueve chunks sin patrones de secreto/referencia al Supabase actual. Free, recargas y overages desactivados. Producción no conectada; `main` reservado hasta GO. Revisión: `docs/PRE_GITHUB_REVIEW.md`; evidencia: `supabase/staging/git-deployment-verification-2026-10-04.md`.

**Acceso Git:** usuario subió `5fad2925a39034a12aa15b779be5f23d408337b0`; origin/develop coincide y Netlify publicó ese commit exacto. Helper oficial sin extraer/copiar credenciales ni alterar preferencias globales; el agente no usa el token del llavero. Fallo histórico HTTP 400 y solución temporal HTTP/1.1/búfer no acreditan causa raíz. Corrección/pruebas entregadas; sólo evidencia posterior queda local.

**NO-GO para abrir a usuarios reales.** Congelamiento de funcionalidades. **Supabase staging creado y activo en plan Free ($0/mes)**: QRIH Staging (`mcyxunymhuxyiwklyfpy`). Se instaló un baseline de estructura verificada y se aplicaron 044–049 sólo allí. `property-images` es privado, WebP, máximo 20 MiB; `profile-images` es público conforme al diseño existente, WebP, máximo 5 MiB. El proyecto actual (`dmtvnwsuhehxfftddsap`) conserva su esquema y bucket público; no recibió cambios.

Netlify: **qrih-staging publicado en Free**, https://qrih-staging.netlify.app (`bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`); recargas/overages off/logs privados comprobados previamente, sin afirmar saldo actual. Git **`5fad292` → `6ac31d76c0cc5c000829ea5b` READY**, publicado 2026-10-05 03:46:29.422 UTC (2026-10-04 local); humo/callback denegado previos PASS. AUD-024 recuperación/login repetido y segunda alta con correo → Publicar sin login → perfil propios seguros validados aquí. Negativos avanzados/aptitud SMTP/UI restante/corte actual pendientes. Sólo develop, producción/main intactos; sin suites mutantes/secreto local o plan/dominio/complemento contratado.

**AUD-023 / ensayo $0 — EN REVISIÓN, NO CERRADO:** usuario guardó Gmail dedicado directamente en Supabase staging. Panel confirma SMTP activo; puerto persistido 562 detectado y corregido únicamente a **587**, verificado tras guardar/recargar; intervalo 60 s. Contraseña oculta no leída/reemplazada; dirección no duplicada en Git. Supabase advierte riesgo de entrega por proveedor personal. Sin correo enviado ni alta nueva; consulta sólo lectura: 1 Auth confirmado, 0 perfiles/propiedades/galerías. Registro UI abierto para acción del usuario con cuenta nueva. Faltan entrega→callback en mismo navegador→perfil→sesión y evaluar cuotas/aptitud para piloto; no acredita 2FA ni TLS efectivo. **Este estado sustituye «SMTP desactivado» anterior.** No equivale a aprobación de Gmail para Soft Launch. Fuentes/evidencia: QRIH_AUDIT.md, AUD-023. Sin código/datos/producción/planes modificados.

**AUD-023/024 / resultado posterior vigente:** **AUD-024 ALTO / CORREGIDO — FLUJO NORMAL DE ALTA/CALLBACK Y RECUPERACIÓN/LOGIN REPETIDO VALIDADOS EN STAGING.** Usuario confirma correo → Publicar directamente sin login y datos de la cuenta nueva visibles. Consultas: **3 Auth confirmadas/2 perfiles asociados a confirmadas/0 admin/0 propiedades**; nueva Auth tiene exactamente su perfil propio nuevo, ambos con defaults seguros y nombre del registro coincidente. Recuperación y repetición anteriores sin duplicar conservadas como evidencia. Git `5fad2925a39034a12aa15b779be5f23d408337b0`, READY `6ac31d76c0cc5c000829ea5b`; pruebas/build anteriores conservados. No valida SMTP general/cuotas, negativos avanzados ni corte actual; causa histórica no identificada. Informe: `supabase/staging/auth-profile-verification-2026-10-04.md`. Sólo lectura/documentación por agente; sin intervención administrativa/código/RLS/Storage/migraciones/SMTP/producción. **NO-GO**, AUD-023 abierto. Próximo: borrador privado de prueba e imágenes UI, sin envío a revisión/publicación.

Esta sección es la fuente de estado vigente y reemplaza afirmaciones incompatibles del historial inferior. La autorización actual permite resolver hallazgos directamente en el workspace; las instrucciones de confirmación por cada paso inferiores corresponden al antiguo flujo de chat/copiar-pegar.

**Validación vigente AUD-022: CORREGIDO Y VALIDADO HTTP EN STAGING; UI AUTENTICADA Y CORTE REAL PENDIENTES.** Cuatro uploads propiedad/avatar antes/después de borrador **200**, **24 controles de imágenes + 42 flujos PASS**, sin fixture directo inicial. Siete WebP propios, portada/galería, octava/corruptos rechazados, estados/suspensión/privacidad, edición/contactos/demanda/avatar/PDF y expiración real 300 s comprobados. Origin externo sigue bloqueado. Tres suites verifican Auth/perfil previo intacto; limpieza independiente: **1 cuenta previa, 0 perfiles/propiedades/galerías/demandas/contactos/autorizaciones/notificaciones/intereses/oportunidades/procedencias/objetos**. 17 unit/29 SQL pasan. UI pública carga foto HTTP y abre/cierra visor; no acredita UI autenticada/dispositivos. Informe: `supabase/staging/upload-verification-2026-10-04.md`. Sin cambios funcionales en este corte, bucket/RLS/migraciones/producción; 044–049 sólo staging.

| Área / IDs | Estado comprobado | Evidencia / limitación |
|---|---|---|
| Auth AUTH-001/003/004/005 | PARCIALES STAGING; AUD-028 DESPLEGADO, LOGIN NORMAL AL PANEL VALIDADO POR USUARIO | 816aa31 READY/21 HTTP remotos PASS; tarjeta staging comprobada y ausente en login normal; destino login normal→Mis propiedades confirmado por usuario. 48 unit/30 SQL/21 HTTP locales/lint/tipos/build previos conservados; nueva cuenta/perfil seguro por lectura anterior. next login/registro/admin/recovery preservados; nuevo ciclo post-alta/callback, variantes reales/negativos/SMTP/actual pendientes. |
| Roles/perfiles PROF-001/002 | PERFIL PROPIO/DEFAULTS DE DOS CUENTAS VALIDADOS PARCIALMENTE STAGING | 2 perfiles propios de confirmadas, publisher/trial/active/no-verificado, nombres de registro coincidentes; segunda alta corroborada con join Auth/perfil. No inserción administrativa ni snapshot íntegro/edición completa. |
| Inventario/ficha/catálogo PROP-001 | VALIDADO PARCIAL EN STAGING | Foto de ingesta HTTP real cargada, galería abre/cierra y dirección oculta; RPC catálogo sin teléfono/WhatsApp. Responsive previo 375/1440 px; corte real pendiente. |
| Crear PROP-002 | BORRADOR/EDICIÓN HASTA SIETE FOTOS SAFARI VALIDADOS; PARCIAL | be370e6 READY; 1 draft/7 rutas propias WebP; título persistente y selector deshabilitado al máximo. Publicación/Chrome/negativos pendientes. |
| Editar/borrar/moderar PROP-003/004/005 | RECHAZO/CORRECCIÓN/REENVÍO/APROBACIÓN, UI PÚBLICA Y OWNER PARCIALES STAGING | Usuario confirma Publicada/aviso owner y ficha/galería/PDF públicos; SQL published/auditoría/notificación y 17 HTTP previos conservados. AUD-027 c327d05/20 HTTP PASS; clic publicación→Mis propiedades confirmado por usuario, rechazo/otros negativos pendientes. |
| Notificaciones NOT-001 | AUD-027/AUD-030 DESPLEGADOS; ACCESO PANEL VALIDADO POR USUARIO | Mis notificaciones→historial correcto por reporte; publicación→panel previamente confirmada. Entrega f84d6b2 READY y controles anteriores conservados. No inspección independiente; tres vistas/móvil/rechazo/variantes/read_at pendientes. Sin nuevos avisos/permisos. |
| Contactos CONT-001 | PARCIALES STAGING; TERCERA CUENTA OMITIDA / NO VALIDADA POR USUARIO | Envío/autorizar/visible/recarga y respuesta positiva a nueva visita/Notificaciones por reporte. Ensayo real de otra cuenta normal omitido por instrucción explícita, no aprobado/fallido ni sustituido por pruebas anteriores/admin. Rechazo/suspensión/corte actual pendientes; no cierre integral ni GO. |
| Requerimientos/interés/oportunidad DEM-001 | TARJETA/PERSISTENCIA POR REPORTE; REGISTRO ADMIN ÚNICO, ACTOR NORMAL NO VALIDADO | Una tarjeta/datos correctos por usuario; SQL read-only 1 demanda new de admin confirmado/activo y 0 del solicitante normal previsto. Aclarar sesión, no fallo de asignación demostrado ni reenvío. 0 intereses/oportunidades/avisos de demanda; matching/interés/registro/actor normal/actual pendientes, HTTP previo no sustituye esa cobertura. |
| Imágenes IMG-001/002 — AUD-002/025 | SIETE/PORTADA SAFARI, PRIVACIDAD NO PUBLICADAS Y GALERÍA PÚBLICA PARCIALES STAGING | Usuario confirma portada/siete fotos y abrir/recorrer galería pública. SQL/HTTP previos: bucket privado/7 firmas HEAD 200 WebP/públicas antiguas HEAD 400/0 firmas persistidas. Sin nuevo GET bytes independiente; Chrome/ajeno/TTL/corte actual pendientes. AUD-002 no cerrado en actual. |
| Avatar PROF-003 — AUD-005 | VALIDADO HTTP EN STAGING; CORTE REAL PENDIENTE | PNG → WebP, nueva ruta propia, limpieza anterior, avatar ajeno y corrupto rechazados. Público por diseño. |
| PDF PDF-001 | HTTP Y VISUAL DE FIXTURE STAGING PARCIALES, VISUAL POR USUARIO | Usuario confirma apertura/datos/fotografías correctos; HTTP previo 200/application/pdf/%PDF- conservado. No parseo/render exhaustivo independiente ni prueba de todas las páginas/dispositivos. Casos límite/volumen/corte real pendientes. |
| Build / tooling OPS-001/003 | VALIDADO CON COBERTURA PARCIAL | Lint/tipos, 17 unit, 29 SQL; 4 uploads+24 imágenes+42 flujos; 15 humo tras normal READY/publicado. Audit sin dev 0 vulnerabilidades; guard preserva cuenta previa. |
| Producción OPS-002 | STAGING FREE GIT EXACTO VERIFICADO; PILOTO NO AUTORIZADO | Git 5fad292 → 6ac31d76c0cc5c000829ea5b READY/publicado, 15 HTTP PASS; Free/recargas/overages off/logs privados. Login/perfil y cierre integral/corte actual pendientes. |
| Integridad / recuperación | PREFLIGHT Y FIXTURE PARCIALES; BACKUP ÍNTEGRO PENDIENTE | 15 tablas con RLS, sin duplicados; recuperación de título/galería/bytes sintéticos con hash. No acredita backup íntegro de BD/Auth/Storage ni grafo completo. |
| Responsive / legal / monitorización | RESPONSIVE PARCIAL; EXTERNO PENDIENTE | Navegador integrado 375/1440 px, menú/galería/form vacío; no sustituye móvil real Chrome/Safari ni UI autenticada. Textos legales y recuperación completos pendientes. |

Mantener originales de hasta 20 MB para fotos, máximo siete y WebP. Cada foto optimizada viaja por separado y no supera 3 MB para respetar payload de Netlify. Firmas 600 s tarjetas, 900 s galerías/admin, 300 s PDF; **no se guardan firmas en BD**. Una firma previa puede seguir usable hasta vencer; privacidad no equivale a revocación de copias descargadas.

AUD-025 distingue **transporte** y **persistencia**: WebP nativo o JPEG optimizado desde navegador; siempre WebP verificado en Storage. Entrada PNG auténtica también puede ser convertida por el endpoint autorizado, sin ampliar los MIME del bucket. Se mantiene resize 1920 px y los controles previos.

Cambios de arquitectura acotados: se mantiene Next/Supabase; se traslada la validación real de archivos al servidor y se añade un cliente privilegiado server-only tras autorización con la identidad original. Credencial nunca pública/commit/log. Sin valor real en .env ni documentos.

Los IDs y severidades se mantienen en QRIH_FUNCTIONAL_INDEX.md / QRIH_AUDIT.md. NEXT_STEPS.md contiene sólo acciones posteriores a esta auditoría y al Soft Launch.

## 1. Objetivo del proyecto

QRO INDUSTRIAL HUB (QRIH) es un portal inmobiliario especializado en propiedades industriales del estado de Querétaro.

El portal permite:

- Mostrar inventario industrial.
- Filtrar propiedades.
- Publicar propiedades mediante usuarios autenticados.
- Enviar propiedades a revisión.
- Moderar propiedades como administrador.
- Rechazar, publicar y retirar propiedades.
- Permitir que el propietario edite una propiedad rechazada y la vuelva a enviar a revisión.
- Registrar solicitudes de contacto.
- Registrar visualizaciones.
- Mostrar estadísticas al propietario.
- Manejar zonas industriales mediante una estructura jerárquica centralizada.

La prioridad actual es continuar construyendo el portal de manera ordenada, evitando inconsistencias en los datos y manteniendo una arquitectura sencilla.

---

## 2. Perfil del usuario

El usuario es principiante en programación.

Reglas importantes para continuar:

- Dar instrucciones claras y copy-paste-ready.
- Trabajar UN PASO A LA VEZ.
- No avanzar varios pasos de golpe.
- Después de cada modificación, pedir al usuario que confirme el resultado.
- No asumir que una instalación, archivo o cambio existe.
- Cuando sea necesario modificar un archivo, indicar exactamente dónde hacerlo.
- Preferir cambios pequeños y comprobables.
- Evitar cambiar arquitectura o tecnologías sin explicarlo previamente.
- No volver a cuestionar decisiones que ya fueron aprobadas.
- Si existe una duda técnica, comprobar primero antes de modificar otras partes.

El usuario trabaja principalmente desde Terminal y no usa VS Code para este proyecto.

---

## 3. Stack actual

- Next.js 16.3.6 (parche de seguridad; validado localmente)
- Turbopack
- Supabase
- PostgreSQL mediante Supabase
- TypeScript / TSX
- CSS
- Node / npm
- Playwright no forma parte de este proyecto; pertenece a otro proyecto del usuario.

Servidor local:

http://localhost:3000

Comando habitual:

npm run dev

El proyecto ha conseguido ejecutar:

npm run build

sin errores después de los cambios recientes.

---

## 4. Ubicación del proyecto

/Users/fabianlira/Documents/Codex/2026-09-18/perfecto-con-esas-decisiones-el-modelo

---

## 5. Estructura relevante

Archivos y carpetas importantes:

- app/
- app/api/
- app/admin/
- app/inventario/
- app/mis-propiedades/
- app/publicar/
- app/privacidad/
- app/terminos/
- components/
- lib/
- supabase/
- .env
- .env.example
- package.json
- package-lock.json
- PROJECT_STATUS.md
- NEXT_STEPS.md

---

# 6. Supabase

## profiles

Campos relevantes:

- id
- full_name
- phone
- company_name
- website
- role
- plan
- trial_ends_at
- created_at

Roles:

- publisher
- editor
- admin

Planes:

- trial
- basic
- intermediate
- advanced

---

## properties

Campos relevantes:

- id
- owner_id
- slug
- title
- operation
- status
- zone_general
- zone
- address
- location_visibility
- price_display
- price_plus_vat
- price_plus_maintenance
- negotiable
- total_area
- covered_area
- exterior_area
- max_height
- offices_area
- parking
- docks
- description
- share_commission
- main_image
- featured
- featured_priority
- publication_authorized_at
- terms_accepted_at
- last_verified_at
- verification_due_at
- rejection_reason
- created_at
- updated_at

Operation:

- Renta
- Venta

Status:

- draft
- pending
- published
- paused
- rejected
- expired
- pending_update

IMPORTANTE:

Se agregó:

zone_general text

Los registros antiguos de prueba pueden tener zone_general NULL. El usuario indicó que esos registros de prueba no son relevantes y no es necesario migrarlos.

Las propiedades nuevas sí deben guardar:

- zone_general
- zone

---

## property_images

Campos:

- id
- property_id
- storage_path
- category
- position
- created_at

---

## property_contacts

Campos:

- id
- property_id
- name
- phone
- email
- company
- message
- source
- utm
- created_at

---

## demand_requests

Campos:

- id
- name
- phone
- email
- company
- operation
- zone
- area_requirement
- budget
- notes
- status
- created_at

---

## demand_requests

Se utiliza para solicitudes de personas que buscan una bodega.

---

## property_views

Existe una tabla para registrar visualizaciones.

Políticas relevantes:

- El público puede insertar una visualización.
- El propietario autenticado puede leer las visualizaciones de sus propias propiedades.

---

## audit_logs

Registra acciones administrativas.

Campos:

- id
- actor_id
- entity_type
- entity_id
- action
- metadata
- created_at

---

# 7. RLS importante

property_views:

El público puede registrar visualizaciones.

Los propietarios pueden consultar visualizaciones únicamente de sus propias propiedades.

property_contacts:

Los propietarios pueden consultar solicitudes únicamente de sus propias propiedades.

---

# 8. Cliente Supabase

lib/supabase.ts actualmente utiliza:

createBrowserClient

Variables:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

Si alguna variable no existe, createClient() devuelve null.

---

# 9. Sistema de zonas

Esta decisión YA ESTÁ APROBADA.

No cambiar la estructura sin consultar al usuario.

El sistema tiene dos niveles.

## Nivel 1 — Zona general

- Querétaro Norte
- Querétaro Centro/Poniente
- Querétaro Sur
- El Marqués
- Corregidora
- Colón
- Pedro Escobedo
- San Juan del Río
- Huimilpan
- Tequisquiapan

## Nivel 2 — Zona industrial

### Querétaro Norte

- Jurica
- Santa Rosa Jáuregui
- Parque Industrial Querétaro (PIQ)
- Benito Juárez
- La Montaña
- San Pedrito Peñuelas

### Querétaro Centro/Poniente

- 5 de Febrero
- Santa María Magdalena

### Querétaro Sur

- Bernardo Quintana

### El Marqués

- Conín
- El Marqués
- El Colorado
- Aeropuerto
- Finsa
- Parque Tecnológico Innovación Querétaro
- Parque Aeroespacial Querétaro

### Corregidora

- Balvanera
- Centro Corregidora
- Los Cues

### Colón

- Colón

### Pedro Escobedo

- Pedro Escobedo

### San Juan del Río

- San Juan del Río

### Huimilpan

- Huimilpan

### Tequisquiapan

- Tequisquiapan

---

# 10. lib/zonas.ts

Actualmente contiene:

ZONAS_GENERALES

y

ZONAS_INDUSTRIALES_POR_ZONA

La estructura actual es:

export const ZONAS_GENERALES = [
  'Querétaro Norte',
  'Querétaro Centro/Poniente',
  'Querétaro Sur',
  'El Marqués',
  'Corregidora',
  'Colón',
  'Pedro Escobedo',
  'San Juan del Río',
  'Huimilpan',
  'Tequisquiapan',
]

export const ZONAS_INDUSTRIALES_POR_ZONA: Record<string, string[]> = {
  'Querétaro Norte': [
    'Jurica',
    'Santa Rosa Jáuregui',
    'Parque Industrial Querétaro (PIQ)',
    'Benito Juárez',
    'La Montaña',
    'San Pedrito Peñuelas',
  ],

  'Querétaro Centro/Poniente': [
    '5 de Febrero',
    'Santa María Magdalena',
    'Bernardo Quintana',
  ],

  'El Marqués': [
    'Conín',
    'El Marqués',
    'El Colorado',
    'Aeropuerto',
    'Finsa',
    'Parque Tecnológico Innovación Querétaro',
    'Parque Aeroespacial Querétaro',
  ],

  Corregidora: [
    'Balvanera',
    'Corregidora',
    'Los Cues',
  ],

  Colón: [
    'Colón',
  ],

  'Pedro Escobedo': [
    'Pedro Escobedo',
  ],

  'San Juan del Río': [
    'San Juan del Río',
  ],

  Huimilpan: [
    'Huimilpan',
  ],

  Tequisquiapan: [
    'Tequisquiapan',
  ],
}

---

# 11. Publicación de propiedades

Archivo:

app/publicar/page.tsx

Actualmente:

- Requiere autenticación.
- Redirige a /login si no existe usuario.
- Solicita datos de propiedad.
- Tiene selector de zona general.
- Tiene selector de zona industrial dependiente de la zona general.
- Guarda zone_general.
- Guarda zone.
- Guarda dirección cuando corresponde.
- Permite indicar si se muestra zona o dirección.
- Permite cargar fotografía principal.
- Genera slug único.
- Guarda la propiedad con status pending.
- Guarda autorización de publicación.
- Guarda aceptación de términos.
- Muestra modal de éxito.
- Redirige a /mis-propiedades.

La validación actual requiere:

- title
- price
- zone_general
- zone
- total_area
- autorización de publicación
- términos aceptados

---

# 12. Edición de propiedades rechazadas

Archivo principal:

app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx

Actualmente tiene:

- selector de zona general
- selector de zona industrial
- selector de visibilidad
- importación de ZONAS_GENERALES
- importación de ZONAS_INDUSTRIALES_POR_ZONA
- estado zonaGeneral
- lectura de property.zone_general

La página:

app/mis-propiedades/[id]/editar/page.tsx

ya solicita zone_general en la consulta de Supabase.

La propiedad editada vuelve a:

status = pending

---

# 13. Endpoint de edición

Archivo:

app/api/editar-propiedad/route.ts

Actualmente debe contener:

const zoneGeneral = String(
  form.get('zone_general') || ''
).trim()

y validar:

!zoneGeneral

y actualizar:

zone_general: zoneGeneral,
zone,
location_visibility: visibility,

El endpoint:

- autentica al usuario
- verifica propietario
- solamente permite editar propiedades rejected
- conserva fotografía existente si no se sube otra
- permite subir nueva fotografía
- actualiza información
- elimina rejection_reason
- cambia status a pending
- actualiza updated_at

---

# 14. Moderación administrativa

Archivos relevantes:

app/admin/page.tsx
app/admin/[id]/page.tsx

Actualmente existe:

- publicar propiedad
- rechazar propiedad
- retirar/unpublish propiedad
- razón obligatoria para rechazo
- razón obligatoria para retirar
- registro de acciones en audit_logs
- banners de éxito después de las acciones

El flujo de moderación fue probado y funciona.

Acciones registradas:

- property_published
- property_rejected
- property_unpublished

---

# 15. Mis propiedades

Archivo:

app/mis-propiedades/page.tsx

Actualmente muestra:

- propiedades del usuario
- estado
- visualizaciones
- solicitudes
- conversión
- acciones según estado

Se probaron estadísticas.

Ejemplo observado durante pruebas:

- Visualizaciones: 7
- Solicitudes: 4
- Conversión: 57.1%

Estos números pertenecen a datos de prueba y no deben tratarse como datos reales del negocio.

---

# 16. Inventario

Archivo:

app/inventario/page.tsx

Actualmente:

- muestra únicamente properties con status published
- ordena destacadas primero
- ordena después por created_at
- filtra por operación
- filtra por zona
- filtra por rango de superficie
- muestra PropertyCard

Filtros de superficie:

- menos de 200 m²
- 200 a 500 m²
- 500 a 1,000 m²
- 1,000 a 2,000 m²
- más de 2,000 m²

Los filtros de operación y superficie fueron probados.

El filtro de zona funcionaba, pero había un problema de calidad de datos porque la zona era texto libre y podía escribirse con variantes.

Por eso se creó el sistema centralizado de zonas.

IMPORTANTE:

El inventario todavía necesita actualizarse para utilizar:

zone_general

y

zone

de acuerdo con lib/zonas.ts.

Este es el siguiente trabajo principal.

---

# 17. Header

components/Header.tsx

Actualmente incluye:

- QRO INDUSTRIAL HUB
- Inventario
- BUSCO UNA BODEGA
- Subir propiedad
- Panel

---

# 18. Footer

El footer está integrado globalmente.

Incluye enlaces a:

- Inventario
- Busco una bodega
- Publicar propiedad
- Panel
- Aviso de privacidad
- Términos y condiciones

---

# 19. Legal

Páginas:

app/privacidad/page.tsx
app/terminos/page.tsx

Actualmente son textos provisionales.

Se evitó inventar:

- razón social
- domicilio legal
- correo legal
- información jurídica no proporcionada por el usuario

Las páginas ya fueron probadas visualmente y funcionan.

---

# 20. Diseño

El proyecto utiliza una estética:

- profesional
- minimalista
- inmobiliaria
- premium
- industrial
- limpia

La intención es que el portal se perciba como una plataforma profesional especializada en bienes raíces industriales.

---

# 21. Problemas ya resueltos

Se han resuelto, entre otros:

- publicación de propiedades
- autenticación
- redirección a login
- carga de imagen
- generación de slug
- moderación
- rechazo
- republicación después de rechazo
- edición
- filtros de operación
- filtros de superficie
- visualizaciones
- solicitudes
- estadísticas
- footer
- páginas legales
- selección jerárquica de zonas
- almacenamiento de zone_general

---

# 22. Consideraciones pendientes

1. Actualizar inventario para utilizar zone_general y zone.
2. Hacer que el filtro de inventario mantenga la lógica jerárquica.
3. Evitar que vuelvan a existir zonas escritas manualmente.
4. Revisar posteriormente UX cuando se cambia una zona general después de seleccionar una zona industrial.
5. Continuar con las funcionalidades pendientes del portal sin romper las existentes.
6. Mantener build limpio después de cambios importantes.

---

# 23. Regla fundamental para futuras modificaciones

Antes de cambiar una funcionalidad:

1. Identificar el archivo exacto.
2. Revisar el código existente.
3. Hacer el cambio mínimo necesario.
4. Probar.
5. Confirmar con el usuario.
6. Solamente después continuar.

No reconstruir componentes completos si solamente se necesita cambiar unas líneas.

---

# 24. Actualización vigente — notificaciones, contacto y privacidad

## Cambios completados

- Se creó la página `/notificaciones` para consultar el historial completo.
- El Header ahora navega a requerimientos, solicitudes de la propiedad o
  notificaciones según el tipo de aviso.
- `property_contact_authorized` muestra datos del propietario únicamente
  después de comprobar una autorización aprobada del asesor.
- Se protegió en Supabase la función
  `get_property_publisher_contact`: ahora requiere una autorización con estado
  `authorized` para esa propiedad y ese asesor.
- La protección se guardó también en
  `supabase/migrations/003_protect_publisher_contact.sql`.
- `npm run build` terminó correctamente después de estos cambios.

## Auditoría de privacidad en curso

La revisión de políticas RLS detectó un riesgo crítico pendiente:

- La política `Users can update their own profile` permite actualizar el perfil
  completo. Sin una restricción adicional, un usuario podría intentar cambiar
  su propio campo `role` a `admin`.

No abrir el portal a usuarios reales hasta completar la auditoría de permisos.

La migración `004_protect_profile_roles.sql` ya fue ejecutada en Supabase. Un
perfil nuevo solo puede crearse con rol `publisher`, y una sesión autenticada
no puede cambiar el campo `role` de su propio perfil.

Comprobación realizada: una cuenta propietaria pudo cambiar y guardar la
preferencia de autoaprobación de contactos mostrando el mensaje de éxito.

La migración `005_restrict_contact_requests.sql` fue ejecutada en Supabase.
Las solicitudes de contacto ahora deben provenir de usuarios autenticados y
dirigirse a una propiedad publicada. Falta probar una solicitud válida desde
la aplicación.

Comprobación realizada: con autoaprobación activa, el asesor recibió el
contacto inmediatamente. Con autoaprobación desactivada, la solicitud quedó
pendiente y el propietario recibió el aviso para autorizarla.

Pendiente detectado: al autorizar, el asesor no recibe
`property_contact_authorized`. La ruta intenta insertar directamente en
`notifications`, pero las políticas de esa tabla solo permiten SELECT y UPDATE
al propietario de la notificación. Debe crearse una función controlada de
Supabase, igual que las otras notificaciones existentes.

La migración `006_respond_contact_authorization.sql` ya fue ejecutada en
Supabase. Reúne la respuesta del propietario y la creación de la notificación
en una sola operación segura. La aplicación compiló correctamente; falta
probar una autorización manual completa.

Comprobación realizada: la autorización manual creó correctamente la
notificación del asesor. El asesor pudo abrir `/notificaciones`, ver el
contacto autorizado y acceder a la propiedad.

La migración `007_protect_profile_managed_fields.sql` fue ejecutada en
Supabase. Protege también `plan` y `trial_ends_at` en perfiles normales y
mantiene editables los datos personales y la autoaprobación.

Comprobación realizada: una cuenta propietaria volvió a guardar correctamente
la preferencia de autoaprobación después de esta protección.

El 2026-09-29 se detectó que la migración
`008_require_authorization_response_function.sql` no coincidía con el nombre
real de la política activa, por lo que no la eliminó. Se creó la migración
`009_remove_live_contact_authorization_update_policy.sql` con el nombre exacto
`owners can update contact authorizations for own properties`. El usuario
confirmó su ejecución en Supabase el 2026-09-29 20:38 CST. Con ello, la
respuesta del propietario queda restringida a la función segura ya validada,
que actualiza el estado y crea el aviso del asesor en una sola operación.
`npm run build` terminó sin errores. Falta confirmar la ausencia de la política
mediante la consulta de auditoría de solo lectura.

Confirmación realizada el 2026-09-29 20:39 CST: la consulta de políticas
`UPDATE` para `property_contact_authorizations` devolvió cero filas. La vía
directa quedó cerrada correctamente.

El usuario confirmó la ejecución en Supabase de
`010_remove_unused_interest_update_policies.sql` el 2026-09-29 20:41 CST. La
migración elimina las políticas `UPDATE` directas de intereses de propiedades y
registros de oportunidades, que la aplicación no utiliza. `npm run build`
terminó sin errores. Falta confirmar con una consulta de solo lectura que ambas
políticas ya no aparecen activas.

Confirmación realizada el 2026-09-29 20:42 CST: la consulta de verificación
devolvió cero filas para ambas políticas `UPDATE` eliminadas por la migración
010. Las vías directas de actualización de intereses y oportunidades quedaron
cerradas correctamente.

Durante la auditoría de funciones se detectó que la función activa
`prevent_self_profile_role_change` solo protegía `role`, aunque la migración
007 también contemplaba `plan` y `trial_ends_at`. Se creó
`011_restore_profile_managed_fields_protection.sql` para restaurar los tres
campos protegidos. El usuario confirmó su ejecución en Supabase el
2026-09-29 20:47 CST y `npm run build` terminó sin errores. Falta confirmar
mediante una consulta de solo lectura que la definición activa contiene los
tres campos.

Confirmación realizada el 2026-09-29 20:49 CST: la definición activa contiene
las comprobaciones de `role`, `plan` y `trial_ends_at`. La protección de los
campos administrados del perfil quedó restaurada correctamente.

El usuario confirmó la ejecución en Supabase de las migraciones 012 y 013 el
2026-09-29 20:59 CST. `npm run build` volvió a terminar sin errores.

Actualización documental: 2026-09-29 21:10 CST. Se eliminó la sección histórica
que señalaba al inventario como siguiente paso, ya que la auditoría de permisos
es la prioridad vigente. También se eliminó la nota anterior que decía que las
migraciones 012 y 013 estaban pendientes de ejecución: ambas ya fueron
confirmadas como ejecutadas.

Confirmación realizada el 2026-09-29 21:13 CST: la consulta de solo lectura
devolvió 3 de 3 funciones esperadas y 19 de 19 políticas RLS esperadas. El
inventario versionado quedó confirmado como activo. El siguiente paso es
identificar, sin modificar datos ni permisos, si existen funciones o políticas
activas adicionales que todavía no estén representadas en las migraciones
locales.

Confirmación realizada el 2026-09-29 21:15 CST: el inventario completo mostró
6 funciones y 28 políticas RLS activas. Todas están representadas por las
migraciones locales 001 a 013: no se detectaron funciones ni políticas activas
sin versionar y no fue necesario crear una migración. El siguiente paso es
validar los accesos con cuentas de prueba por rol, empezando por Público.

Confirmación realizada el 2026-09-29 21:19 CST: como Público, sin iniciar
sesión, el inventario `/inventario` cargó correctamente y mostró 3 propiedades.
La consulta del inventario limita los resultados a `status = 'published'`.
La siguiente comprobación es abrir una ficha de esas propiedades sin sesión,
sin enviar formularios ni modificar datos.

Confirmación realizada el 2026-09-29 21:20 CST: una ficha pública de propiedad
cargó correctamente sin iniciar sesión. La siguiente y última prueba para el
rol Público es comprobar que el formulario de contacto redirija a `/login`
antes de crear una solicitud.

Confirmación realizada el 2026-09-29 21:20 CST: el envío del formulario de
contacto como Público redirigió a `/login`, por lo que no se creó una solicitud
sin autenticación. La validación del rol Público quedó completada.

Actualización documental: 2026-09-29 21:22 CST. Por decisión del usuario, las
comprobaciones visuales pendientes de Asesor, Propietario y Admin se posponen.
No se consideran aprobadas y deben realizarse antes de abrir el portal a
usuarios reales. Se retoma como siguiente trabajo funcional la revisión del
inventario para consolidar sus filtros jerárquicos de zonas.

Actualización documental: 2026-09-29 21:24 CST. El usuario cambió la prioridad
al cierre técnico del MVP: auditoría final de RLS y seguridad. Se revisarán
propiedades ajenas, requerimientos ajenos, autorizaciones de contacto ajenas,
acceso a `/admin` y manipulación directa de IDs en URLs. La revisión comienza
por el acceso a propiedades de otro usuario, sin modificar código ni permisos.

Revisión local realizada el 2026-09-29 21:24 CST: las rutas y migraciones de
`properties` restringen la lectura privada al propietario y la actualización al
administrador o al propietario de una propiedad rechazada. El inventario y las
fichas permiten leer propiedades ajenas únicamente cuando están publicadas,
que es el comportamiento previsto.

Confirmación realizada el 2026-09-29 21:26 CST: las expresiones RLS activas de
`properties` coinciden con la revisión local. Un tercero solo puede leer una
propiedad con estado `published`; no puede modificar ni eliminar una propiedad
ajena. El primer punto de la auditoría quedó cerrado. Continúa la revisión de
acceso a requerimientos ajenos.

Hallazgo de auditoría el 2026-09-29 21:26 CST: las políticas locales de
`demand_requests` limitan la lectura al dueño del requerimiento o al
administrador. Sin embargo, `app/api/registrar-oportunidad/route.ts` acepta un
`demand_request_id` sin comprobar que el usuario pueda acceder a ese
requerimiento antes de crear un registro y notificación. No se hicieron cambios;
se debe confirmar la política activa en Supabase y definir el ajuste mínimo.

Revisión local realizada el 2026-09-29 21:27 CST: las políticas y la función
`respond_property_contact_authorization` limitan la lectura de autorizaciones
al asesor correspondiente o al dueño de la propiedad. La función verifica que
el solicitante autenticado sea propietario de la propiedad vinculada antes de
actualizar una solicitud pendiente. Falta confirmar estas definiciones activas
en Supabase antes de cerrar el punto.

Confirmación parcial realizada el 2026-09-29 21:28 CST: la definición activa
de `respond_property_contact_authorization` coincide con la función segura.
Exige sesión, comprueba la propiedad del recurso antes de responder y rechaza
solicitudes ya respondidas. Falta confirmar las políticas RLS activas de
`property_contact_authorizations`.

Confirmación realizada el 2026-09-29 21:29 CST: las políticas RLS activas de
`property_contact_authorizations` limitan la lectura al asesor vinculado o al
dueño de la propiedad. No existe una política `UPDATE` directa. Junto con la
función segura confirmada, una autorización ajena no puede ser vista ni
respondida por un usuario normal. Este punto quedó cerrado. Continúa la
revisión de `/admin`.

Revisión local realizada el 2026-09-29 21:36 CST: `/admin` y `/admin/[id]`
exigen sesión y comprueban que el perfil tenga `role = 'admin'`. Las acciones
de moderación repiten la validación del rol mediante `getAuthenticatedAdmin()`
antes de actualizar. Las políticas RLS de `properties` también restringen las
actualizaciones administrativas al rol admin. Falta confirmar el resultado con
una cuenta normal autenticada.

Confirmación realizada el 2026-09-29 21:36 CST: una cuenta normal abrió
`/admin` y recibió “Acceso restringido”, sin exponer propiedades ni
requerimientos. El punto quedó cerrado. Continúa la revisión final de rutas que
reciben IDs directamente en URL o formularios.

Actualización realizada el 2026-09-29 21:41 CST: se añadió en
`app/api/registrar-oportunidad/route.ts` la validación del requerimiento antes
de registrar una oportunidad. La consulta exige simultáneamente el ID recibido
y `user_id = auth.uid()`; si no coincide, responde con 403 y no crea el
registro ni la notificación. `npm run build` finalizó sin errores.

Confirmación realizada el 2026-09-29 21:41 CST: una prueba real con propiedad
propia y un `demand_request_id` de otra cuenta devolvió 403. No se creó un
registro ni una notificación. Con este resultado quedó completada la auditoría
final de RLS y seguridad. El siguiente trabajo funcional recomendado es retomar
la actualización del inventario para filtros jerárquicos de zonas.

Actualización visual realizada el 2026-09-29 22:22 CST: se mejoraron las
pantallas de Registro, Header, Footer, filtros y selectores sin modificar
flujos ni datos. Esta nota reemplaza los ajustes intermedios de navegación
móvil y Footer que ya no describían la versión vigente.

Revisión de página principal realizada el 2026-09-29 22:51 CST: la portada
comunica bien el enfoque industrial de QRIH, pero todavía muestra las tres
propiedades ficticias de `lib/data.ts` y un filtro de zonas escrito manualmente.
No representa por completo el portal actual, que ya incluye inventario real,
publicación moderada, requerimientos, contacto autorizado y estadísticas. Se
debe reemplazar la selección de prueba por tres propiedades publicadas. Antes
de implementar la selección por rendimiento, falta definir la métrica: el
portal registra visualizaciones, solicitudes y conversión, pero esos datos son
privados por RLS y no deben exponerse directamente en la portada.

Actualización de portada realizada el 2026-09-29 22:59 CST: la selección QRIH
usa propiedades reales con estado `published`, ordenadas primero por
`featured`, después por `featured_priority` y finalmente por fecha. Se retiró
del buscador la lista manual de zonas y la entrada libre de superficie; ahora
usa `zone_general` y rangos compatibles con Inventario. Se añadió una sección
que comunica los flujos actuales: buscar espacio, publicar y administrar, y
registrar requerimientos. `npm run build` terminó sin errores.

Corrección visual realizada el 2026-09-29 23:10 CST: se reforzó el menú
responsive con un panel oscuro, contrastado y desplegable debajo del Header;
el Footer volvió a tener fondo, borde y enlaces coherentes con la identidad
visual. La sección “Una plataforma, dos caminos” dejó de ser texto plano y
ahora usa tarjetas con jerarquía visual, iconos, numeración y fondos sutiles.
No se modificaron datos ni flujos. `npm run build` terminó sin errores.

Optimización de imágenes implementada el 2026-09-30 09:31 CST: Publicar y
Editar ahora usan un selector reutilizable con máximo de 7 fotografías,
validación de JPG/PNG/WebP y 20 MB por original, procesamiento secuencial en
navegador, conversión a WebP con calidad 80 %, máximo de 1920 px, vista previa,
reducción de tamaño y eliminación individual antes de subir. Se conserva el
bucket `property-images`, la ruta por usuario y `main_image`; además, las
referencias de galería se guardan en `property_images` y se muestran en la
ficha. Se agregó la migración pendiente `014_property_images_policies.sql`
para autorizar la galería y restringir el bucket a WebP. Fue ejecutada el
2026-09-30; la prueba posterior reveló la corrección documentada enseguida.
`npm run build` terminó sin errores.

Corrección de galería realizada el 2026-09-30 09:45 CST: una prueba real
confirmó que la inserción directa en `property_images` era bloqueada por RLS.
Se creó la migración pendiente `015_save_property_images_function.sql`, con
una función segura que valida propiedad, usuario, máximo de 7 y rutas WebP
antes de reemplazar la galería. Publicar y Editar ahora la usan. La interfaz
indica “Sube hasta 7 fotografías”, muestra solo “Foto 1”, “Foto 2”, etc., y
las tarjetas ya no exceden el ancho del formulario. La migración 015 no fue
ejecutada. `npm run build` terminó sin errores.

Corrección de rutas y títulos realizada el 2026-09-30 10:00 CST: la prueba
posterior detectó que la expresión regular de la función 015 rechazaba rutas
WebP válidas. Se creó la migración pendiente
`016_fix_image_path_validation_and_titles.sql`, que sustituye esa validación
por comprobaciones de carpeta del usuario y extensión `.webp`; también añade
el campo `title` a `property_images`. Cada asesor puede escribir un título de
hasta 120 caracteres por fotografía, que se muestra en la galería pública.
`npm run build` terminó sin errores. La migración 016 no fue ejecutada.

Visualización de galería ampliada el 2026-09-30 10:15 CST: se agregó una
galería explícita con títulos a `/admin/[id]`. La ficha pública ya consulta
`property_images`; se creó la migración pendiente
`017_property_images_read_policies.sql` para reafirmar el acceso de lectura:
administrador y propietario pueden ver las imágenes siempre, mientras que el
público solo puede ver imágenes de propiedades publicadas. `npm run build`
terminó sin errores. La migración 017 no fue ejecutada.

Visualizador de fotografías implementado el 2026-09-30 10:30 CST: la ficha
pública y `/admin/[id]` usan un componente reutilizable. Al seleccionar una
foto se abre ampliada; permite avanzar y retroceder con botones o flechas del
teclado, cerrar con botón, Escape o clic fuera de la imagen, muestra el título
y el contador, y bloquea el desplazamiento de fondo. Se adapta a móvil.
`npm run build` terminó sin errores.

Ajuste de tamaño de galería realizado el 2026-09-30 10:40 CST: se detectó que
una regla móvil genérica elevaba todas las imágenes de la ficha a 300 px. La
galería ahora conserva su ancho de contenedor, miniaturas compactas y una foto
principal de altura moderada tanto en escritorio como en móvil. `npm run build`
terminó sin errores.

Ajuste de cuadrícula realizado el 2026-09-30 10:50 CST: la galería de la ficha
de propiedad muestra ahora dos fotografías por fila; la principal conserva el
ancho completo de las dos columnas. `npm run build` terminó sin errores.

Ajuste de proporción realizado el 2026-09-30 11:00 CST: las fotografías
secundarias de la ficha usan ahora una proporción horizontal 2:1 en escritorio
y móvil. La imagen principal conserva su proporción de presentación propia.
`npm run build` terminó sin errores.

## Actualización — PDF de propiedades

- Se implementó la generación dinámica de fichas PDF mediante `@react-pdf/renderer`, incluyendo información, precios, imágenes, galería, logo, datos de ubicación, descripción, nota legal y paginación.
- Se agregó el botón **“Descargar PDF”** en la ficha pública de cada propiedad.
- La descarga funciona correctamente desde el navegador.
- Validación TypeScript: `npx tsc --noEmit` ✅

**Estado: COMPLETADO**

## HISTORIAL DE CAMBIOS — 2026-09-30 / 2026-10-02

### 2026-09-30 — 11:20 — Corrección final de galería responsive

Se corrigió el comportamiento de la galería en móvil.

Problema detectado:
- Una regla genérica de imágenes móviles estaba fijando una altura de `300px` para toda la galería.
- Esto provocaba que la galería completa tuviera una altura artificial y que las filas secundarias no crecieran correctamente.

Corrección:
- La galería ahora crece de acuerdo con el número real de filas.
- Las imágenes secundarias mantienen su proporción visual `2:1`.
- Se conserva el comportamiento responsive.
- La imagen principal mantiene su propia presentación.
- Se evita que reglas globales de imágenes alteren el layout específico de la galería.

Resultado:
- Galería responsive corregida en desktop y móvil.
- No se modifica la lógica de almacenamiento de imágenes.
- No se modifica el límite máximo de fotografías.
- `npx tsc --noEmit` limpio.

Estado: COMPLETADO.

---

### 2026-09-30 — PDF dinámico de propiedad

Se completó la generación de PDF dinámico para las propiedades.

El PDF incluye:
- Información general de la propiedad.
- Tipo de operación.
- Precios.
- Información de ubicación.
- Descripción.
- Imagen principal.
- Galería de fotografías.
- Logotipo.
- Información relevante de la propiedad.
- Nota legal.
- Paginación.

Implementación:
- Se utiliza `@react-pdf/renderer`.
- El PDF se genera a partir de los datos reales de la propiedad.
- Se agregó la opción `Descargar PDF` en la página pública de detalle de propiedad.
- La descarga fue probada directamente desde el navegador.

Resultado:
- El PDF se genera correctamente.
- La descarga funciona desde la vista pública.
- `npx tsc --noEmit` limpio.

Estado: COMPLETADO.

---

### 2026-09-30 — Estado de cuenta y suspensión de usuarios

Se implementó la estructura funcional para manejar cuentas activas y suspendidas.

Se agregó al perfil del usuario:

- `account_status`
- `suspension_reason`
- `suspended_at`
- `suspended_by`
- `publications_enabled`

Estados contemplados:
- `active`
- `suspended`

Reglas de negocio establecidas:

#### Cuenta activa
- Puede operar normalmente.
- Sus propiedades pueden aparecer en el catálogo público de acuerdo con las reglas existentes.
- Puede realizar las acciones permitidas por la plataforma.

#### Cuenta suspendida
- No puede realizar nuevas publicaciones.
- Sus propiedades no se eliminan.
- Sus propiedades dejan de aparecer públicamente de acuerdo con las reglas de suspensión.
- El estado de la propiedad NO se modifica automáticamente por la suspensión de la cuenta.
- La suspensión no elimina información ni fotografías.
- El administrador puede seguir viendo y gestionando la información.

#### Reactivación
- Reactivar una cuenta no republica automáticamente las propiedades.
- Las publicaciones permanecen deshabilitadas hasta que el administrador decida habilitarlas explícitamente.
- No se modifica automáticamente el `status` de las propiedades durante la suspensión o reactivación.

También se mantiene la separación entre:
- estado de la cuenta del usuario;
- estado de publicación de la propiedad.

Esto evita utilizar el estado de la propiedad como sustituto del estado de la cuenta.

Estado: IMPLEMENTADO.

---

### 2026-09-30 — Protección administrativa de perfiles

Se consolidó el acceso administrativo mediante la función:

`public.current_user_is_admin()`

La función:
- utiliza `security definer`;
- establece `search_path = public`;
- comprueba el `role = 'admin'` del usuario autenticado;
- permite utilizar la comprobación desde políticas RLS.

Se agregó la política administrativa correspondiente para permitir que los administradores consulten perfiles que no sean únicamente el propio.

La función tiene acceso restringido y se concede ejecución a usuarios autenticados.

Objetivo:
- evitar depender únicamente de comprobaciones visuales del frontend;
- mantener la autorización administrativa respaldada por RLS y PostgreSQL.

Estado: IMPLEMENTADO.

---

### 2026-10-02 — Configuración global de soporte

Se creó la tabla:

`public.platform_settings`

La tabla está diseñada para almacenar configuraciones globales de la plataforma.

Actualmente contiene principalmente:

- `support_email`
- `updated_at`
- `updated_by`

La tabla utiliza una única fila global mediante:

`id boolean primary key default true`

y una restricción que garantiza:

`id = true`

Seguridad:
- RLS habilitado.
- Usuarios autenticados pueden consultar la configuración necesaria.
- Solo administradores pueden insertar.
- Solo administradores pueden actualizar.
- Las modificaciones utilizan `current_user_is_admin()`.

Migración creada:

`036_platform_settings.sql`

La migración fue ejecutada correctamente mediante:

`npx supabase db push`

También se creó la página administrativa:

`/admin/configuracion`

La página:
- requiere autenticación;
- requiere rol `admin`;
- permite consultar el correo de soporte actual;
- permite modificarlo;
- guarda `updated_at`;
- guarda `updated_by`.

Se agregó el acceso a `Configuración` desde el panel administrativo.

Resultado:
- El correo de soporte ya no está hardcodeado en los componentes.
- El administrador puede cambiarlo desde la plataforma.
- Los cambios persisten después de actualizar la página.

Estado: COMPLETADO.

---

### 2026-10-02 — Aviso reutilizable de cuenta suspendida

Se creó el componente reutilizable:

`components/AccountSuspensionNotice.tsx`

Objetivo:
- centralizar el mensaje mostrado a usuarios con cuenta suspendida;
- evitar duplicar el mismo bloque de interfaz en diferentes páginas;
- utilizar el correo de soporte configurado globalmente.

El componente consulta:

`platform_settings.support_email`

y muestra:

**Cuenta suspendida**

`Tu cuenta está suspendida y no puedes realizar nuevas publicaciones.`

Si existe un correo de soporte configurado, también muestra la opción de contacto mediante `mailto:`.

Características:
- componente cliente;
- consulta el correo de soporte desde Supabase;
- no contiene el correo de soporte hardcodeado;
- muestra el correo configurado actualmente;
- permite actualizar el correo desde `/admin/configuracion` y utilizar el nuevo valor en posteriores cargas de la interfaz.

Integración realizada en:

`/publicar`

y:

`/mis-propiedades`

En `/publicar`:
- la cuenta suspendida sigue bloqueada para nuevas publicaciones;
- los botones correspondientes permanecen deshabilitados;
- la validación existente de campos obligatorios no fue alterada;
- el aviso reutilizable reemplaza el aviso inline anterior.

En `/mis-propiedades`:
- se muestra el mismo aviso reutilizable cuando la cuenta está suspendida;
- se mantiene la lógica existente de consulta de propiedades;
- no se eliminan propiedades como consecuencia de la suspensión.

Resultado:
- Ambos puntos de entrada muestran el aviso de suspensión.
- El mensaje utiliza la configuración global de soporte.
- Se evita duplicar la implementación del aviso.
- `npx tsc --noEmit` limpio.

Estado: COMPLETADO.

---

## 2026-10-02 FUNCIONALIDADES RECIENTEMENTE COMPLETADAS

Las siguientes áreas fueron completadas o consolidadas recientemente:

- Galería responsive de propiedades.
- Selector reutilizable de fotografías con máximo de 7 imágenes.
- Validación y optimización de imágenes.
- Almacenamiento de fotografías WebP.
- Galería titulada.
- Visor ampliado de fotografías.
- PDF dinámico de propiedades.
- Estados de cuenta `active` / `suspended`.
- Reglas de negocio para suspensión y reactivación.
- Protección administrativa mediante `current_user_is_admin()`.
- Configuración global de correo de soporte.
- Página administrativa `/admin/configuracion`.
- Aviso reutilizable de cuenta suspendida.
- Integración del aviso en `/publicar`.
- Integración del aviso en `/mis-propiedades`.

Las modificaciones recientes relacionadas con suspensión de cuentas no eliminan propiedades ni modifican automáticamente el `status` de las propiedades.

La reactivación de una cuenta tampoco republica automáticamente las propiedades.

---

## 2026-10-02 ESTADO ACTUAL — FUNCIONALIDADES RECIENTEMENTE COMPLETADAS

Las siguientes áreas fueron completadas o consolidadas recientemente:

- Mejora visual y funcional del panel administrativo `/admin`.
- KPIs administrativos para propiedades.
- Mejora de filtros, tarjetas de revisión y paginación de propiedades.
- Historial administrativo centralizado en `/admin/historial`.
- Filtros de historial por entidad, acción, búsqueda y rango de fechas.
- Navegación entre panel, historial, propiedades y asesores.
- Botón de acceso a Historial agregado al panel de Administración.
- Auditoría de creación, modificación, publicación, rechazo, retiro y reenvío de propiedades.
- Auditoría de verificación, suspensión y reactivación de asesores.
- Corrección de `/inventario` para mostrar correctamente las propiedades publicadas.
- Notificaciones administrativas para propiedades publicadas y rechazadas.
- Consolidación de las reglas de visibilidad pública para cuentas suspendidas.
- Validación de suspensión y reactivación sin eliminar ni republicar automáticamente propiedades.
- Configuración global de correo de soporte.
- Aviso reutilizable de cuenta suspendida integrado en `/publicar` y `/mis-propiedades`.

Estado: COMPLETADO Y VALIDADO.



## Regla documental

Corrección responsive de proporción realizada el 2026-09-30 11:10 CST: el
aspecto 2:1 se fijó en el contenedor de cada foto secundaria y la imagen se
recorta dentro de él. Esto evita que la proporción original altere la
cuadrícula en móvil. `npm run build` terminó sin errores.

Corrección de contenedor móvil realizada el 2026-09-30 11:20 CST: una captura
mostró que una regla genérica fijaba la altura completa de la galería en 300
px, causando que las fotografías se amontonaran. La galería vuelve a crecer
por filas y mantiene las secundarias en proporción 2:1. `npm run build`
terminó sin errores.

Después de cada cambio funcional, actualizar este archivo y `NEXT_STEPS.md`
con el resultado, la verificación realizada y el siguiente paso exacto.
