# QRIH — Acuerdos mínimos de operación del piloto

## Alcance comercial vigente — NO-GO / 2026-10-20

El GO condicionado previo no cubre Compartir y MXN/USD nuevos. [Entrega y procedimiento](COMMERCIAL_SHARING_CURRENCY.md). Sólo se comparten published; moneda histórica MXN confirmada. 052 probada únicamente en PostgreSQL temporal, no aplicada a servicios. No publicar USD con el artefacto Netlify anterior; requiere integración/RC autorizados y aceptación nueva.

Se conservan Free, no producción/main, Netlify sólo RC autorizado, respaldos por día de uso y antes de cambios, y pausa manual de altas ante fallos. Usuario autorizó continuar hasta deploy; [gate actual](COMMERCIAL_DEPLOY_GATE_2026-10-20.md) requiere nueva copia cifrada local+Drive antes de052. No captura/transferencia/restore nuevos ni pagos realizados por este control. No repetir ensayos cerrados ni herramientas de captura consumidas.

### Antecedentes y política operativa conservada

## Cierre vigente20oct — GO condicionado del piloto

**GO CONDICIONADO para Soft Launch supervisado en el QRIH STAGING existente, con datos reales ya seleccionados.** [Dictamen y condiciones](SOFT_LAUNCH_GO_2026-10-20.md) / [RC y cierre AUD-040](aud040-deploy-verification-2026-10-20.json). Commit publicado `f803f35faba9cf871a81f93560112e20358230c2`, fuente `4c7d05057f2429306d8ed5ba6097d9b273eb292a`, deploy `6ad79257b59620a2a787e9a1` READY/SHA/publicación exactos.138unit remotas/31HTTP remotos PASS/0fallos/0skips y lint/tipos/build/preflight completos. Selector admin corregido, guardado autenticado de fixture con éxito, `m2` conservado y huellas comerciales/galerías de ambos fixtures iguales (sólo updated_at excluido). **AUD-040 MEDIO CORREGIDO, DESPLEGADO Y VERIFICADO.**

Aceptación crítica [gestionada](soft-launch-moderation-2026-10-20.json): owner/admin reales, ciclo publicado→retirado→editado→revisión→rechazo, privacidad/ficha/PDF/7WebP, duplicado y portada independientes. Fixtures finales rejected/draft,14objetos conservados; sin inmuebles reales alterados por el agente, eliminaciones, nueva migración ni producción/main. Free/saldo previo283,7créditos/sin pagos-recargas-overages, un único RC adicional autorizado y builds detenidos; no otro build por documentación.

**Límites operativos aceptados expresamente:** Fabián supervisa, respaldos cifrados manuales por día de uso/antes de cambios y pausa manual de nuevas altas si falla respaldo/correo/cuota. Recuperación completa24h y carga/concurrencia real NO medidas; renovación prolongada/all-actor-all-status y demás límites conservan su alcance, no son PASS inferidos. AUD-018 mantiene riesgo operativo residual aceptado, no «totalmente corregido». Sin SLA, GO de producción, invitaciones, publicación de registros adicionales ni acciones automáticas. Los NO-GO/pedidos de permiso o deploy de cortes inferiores son **antecedentes superados por este dictamen condicionado**, no tareas vigentes.

### Antecedentes de preparación y controles ya cerrados

**20oct — aceptación de riesgos operativos registrada, no SLA ni prueba de RTO.** **Aceptación funcional crítica PASS, dentro de su alcance; límites operativos del piloto ACEPTADOS por el usuario; GO pendiente de entregar/verificar AUD-040.** [Ciclo gestionado y límites](soft-launch-moderation-2026-10-20.json): sesión publisher localhost y admin legítimo STAGING; original pending→published→draft→pending→rejected, Cancelar conserva publicada, un solo evento de retiro, edición/reenvío normales. Ficha/PDF y7WebP públicos200 sólo publicada; nuevas lecturas404 y autorización vacía al retirar/rechazar en ambos sitios. Admin no-owner recibe404 en editor/duplicación privados. Duplicado draft101m²,14rutas independientes/7fotos cada uno; visor admin1→2→1/EscapePASS. Cero borrados/tercer fixture/cambios de inmuebles reales/DDL/deploy en esta aceptación; ambos fixtures conservados sin publicar.

**AUD-040 MEDIO / CONFIRMADO / CORREGIDO LOCALMENTE / NO DESPLEGADO.** [Informe](AUD040_ADMIN_PRICE_UNIT.md): BD `m2` no correspondía a opción `m²` del editor admin; selector vacío podía enviarse comoNULL. Inconsistencia reproducida en BD+DOM, pérdida real no provocada. Dos líneas de corrección, cinco regresiones antesFAIL/despuésPASS y conteo hijo33→38.138unit/31HTTPlocal/lint/tipos/build/preflightPASS; tres entradas funcionales cambian y READY5c4970e anterior no contiene el fix. Sin migración/datos/configuración/producción cambiados. Falta entregar develop, único RC adicional con autorización explícita y comprobación de selector/guardado sobre fixture; no repetir ciclo completo, copias,051 o recuperación.

**Aceptación operativa explícita:** «Sí, acepto esos límites para el piloto»: piloto supervisado/Fabián, política de respaldos ya aprobada, pausa de nuevas altas si falla respaldo/correo/cuota; recuperación completa24h y carga/concurrencia real no medidas, sin SLA ni GO de producción. Copia cifrada local rehashPASS,12,82h de antigüedad al corte20oct15:45UTC; no nueva captura/restore ni readbackDrive actual. Renovación cronometrada/concurrencia y demás límites quedan declarados, no convertidos en PASS. No pedir nuevamente esa aceptación. **NO-GO vigente del artefacto remoto hasta AUD-040 entregado y verificado; después dictamen condicionado del piloto, nunca apertura/invitaciones automáticas.**

Los estados previos que piden sesión admin/aceptación del ciclo o permiso operativo son antecedentes ya superados. RC publicado5c4970e conserva su recibo y no acredita la corrección local nueva. No repetir trabajo cerrado.

**Actualización vigente19octCDMX/20octUTC:** usuario autoriza aplicar pendientes; [única nueva051 aplicada y verificada](profile-property-management-staging-migration-2026-10-19.json) después del respaldo local+Drive PASS y preflight vivo igual. Sin repetir generación/captura/restore ni ampliar a servicio diario, Git o Netlify. Datos previos/políticas/buckets intactos; aceptación de nuevos flujos, RPO/RTO y operación efectiva siguen pendientes/NO-GO. Las referencias inferiores a051 sin permiso son históricas.

Estado: POLÍTICA/DESTINO/RTO CONFIRMADOS; NUEVA CAPTURA MANUAL Y SEGUNDA COPIA CIFRADA VERIFICADAS; SIN APERTURA DEL PILOTO NI AUTOMATIZACIÓN. Corte19oct2026, Ciudad de México/20octUTC.

**Resultado vigente:** [recibo local + Drive](backup-verification-2026-10-19.json). Captura51tablas/52objetos, paquete cifrado7.866.424bytes/SHA256 verificado independientemente y segunda copia Drive exacta byte a byte, único permiso owner. Dos generaciones conservadas08oct/19oct; no tres ni copia diaria automática. Clave separada/no subida; archivos previos y recibo de captura intactos. Release nuevo consumido, antiguo capturador bloqueado/intacto: no repetir. No nuevo restore ni RTO demostrado;81,152s es sólo captura.051/Git/Netlify no autorizados. Cortes de preparación siguientes conservan antecedente, no instrucciones pendientes.

**Autorización posterior específica19oct:** usuario confirma una nueva generación cifrada de BD/Auth/Storage del QRIH STAGING, copia local y segunda copia cifrada en carpeta Drive existente, durante ventana sin escrituras. [Preparación](backup-preparation-2026-10-19.json): adaptador separado12tests+39checks sintéticos PASS, controles locales/Drive y cuota Supabase verificados tras login. Capturador antiguo bloqueado intacto; nuevo release único preparado/no consumido, ninguna captura/upload nuevos. Esta aprobación sustituye únicamente las referencias inferiores a captura/transferencia todavía sin permiso; no autoriza servicio diario, aplicación051, Git, deploy, borrado o pago. No volver a pedir permiso para el mismo alcance ni afirmar operación efectiva por la preparación.

**Control posterior vigente22:38UTC:** login realizado; identidad/Free/egress0,03de5GB observados en organización correcta, Drive privado11,24de15GB. Recibos privados de cuota/corte exacto/release único preparados, `--check-ready`PASS por consulta STAGING vacía y sin SQL/dump. Contraseña de BD debe introducirse por el usuario sólo en terminal personal para captura nueva; no se abrió bóveda ni se leyó esa contraseña. Antes de exportar, el propio capturador verifica cobertura de esquema/roles/tablas/buckets con sólo lectura y tras exportar exige coherencia. Aún NO nueva generación/upload ni respaldo diario activo. No repetir login/consentimiento; si vence el recibo, revalidar sin omitir el control.

Confirmación del usuario: «Sí» a Fabián como responsable, respaldo cifrado cada día de uso y antes de cambios importantes, objetivo de tres generaciones verificadas sin borrar copias actuales automáticamente. Es aprobación documental de esas tres reglas, no de todas las propuestas posteriores ni autorización para programar/exportar/subir/borrar datos ahora.

La prueba local de recuperación y escrituras está completada dentro de su alcance. [Evidencia](aud018-private-write-acceptance-2026-10-19.json). No se repite ni requiere Rancher abierto para revisar estos acuerdos. Cerrar Rancher normalmente conserva los volúmenes; no utilizar Reset, eliminar contenedores/volúmenes ni restaurar de nuevo. Al reabrirlo en otra ocasión, revalidar aislamiento antes de iniciar la copia.

## Decisión de piloto y recuperación — confirmación del usuario

El usuario confirma: el piloto utilizará **la información real ya activa en el STAGING actual**, no datos ficticios, y acepta **24 horas de interrupción** como objetivo de recuperación. Entorno QRIH identificado en la documentación: Supabase `mcyxunymhuxyiwklyfpy`, aplicación `qrih-staging.netlify.app`; identidad/configuración actuales no reconsultadas por registrar esta decisión.

El nombre STAGING no vuelve desechables sus datos: tratarlo como entorno de servicio del piloto con información real. No realizar allí pruebas destructivas, fixtures por inferencia, resets, limpieza, restauraciones sobre el origen ni cambios de permisos. Conservar las validaciones de escritura en destinos aislados y con alcance propio. No trasladar datos a otro entorno ni ampliar su exposición por esta elección.

**RTO objetivo: 24 horas.** Para el procedimiento se medirá desde el inicio conocido de la interrupción hasta el restablecimiento y validación de los flujos críticos; registrar detección y comienzo de atención por separado. El ensayo previo no demuestra cumplimiento de ese plazo: falta medición operativa, incluyendo atención, acceso a copias, restauración y comprobaciones. No es SLA ni garantía. No confundirlo con RPO: cuánto dato puede perderse depende de la antigüedad real de la última copia verificada y la política diaria aún no activa.

La decisión selecciona entorno/datos y objetivo; **no autoriza abrir el piloto, invitar usuarios, publicar información adicional, desplegar, exportar ni modificar configuración**. El entorno original distinto queda fuera de este piloto: su AUD-002 histórico no se traslada como fallo confirmado del STAGING elegido ni autoriza corregirlo allí. Siguen pendientes los controles actuales del entorno seleccionado y el GO explícito.

## Política y controles operativos

| Tema | Propuesta | Situación real / límite |
| --- | --- | --- |
| Responsable | Fabián como responsable de operación y custodia; el agente asiste, no actúa como guardia permanente | Política confirmada por el usuario19oct2026 |
| Frecuencia de copia | Una copia cifrada por día de uso y antes de un cambio importante; sólo en ventana coordinada sin escrituras | Política confirmada; no tarea programada ni captura autorizada ahora |
| Destinos | Mantener copia cifrada local y segunda copia cifrada en la carpeta privada Drive ya preparada; clave separada | Nueva transferencia requiere verificar identidad, capacidad y alcance; no se consultó ni escribió Drive en este paso |
| Retención | Objetivo aprobado de tres generaciones completas verificadas, preservando última válida hasta verificar su sucesora | No significa que existan tres generaciones. No borrar copias existentes ni activar poda automática; retirada requiere objetivos exactos y autorización |
| Costo | No contratar ni activar servicios de pago, recargas, overages ni otra cuenta Netlify | Revalidar cuotas/Free/capacidad reales antes de una acción remota; no garantizar disponibilidad por recibos históricos |
| Aviso de incidente | El usuario recibe el aviso genérico y conserva diagnóstico sanitizado; no publicar secretos ni enlaces de acceso | No se creó monitoreo ni automatización. Canal/horario de atención por definir |

Una copia diaria sólo puede apuntar a **como máximo24h de pérdida de datos** si realmente se completa/verifica con esa separación y antes del incidente. Si se omite una copia, ese objetivo no se cumple. El respaldo disponible del8oct fue el del ensayo: no acredita una política diaria ya activa ni un respaldo reciente del futuro piloto.

**Tiempo de recuperación:** objetivo24h confirmado; medición operativa pendiente. Los tiempos de fases del ensayo no equivalen a un SLA de atención/restablecimiento. No sumar sesiones humanas de diagnóstico para declarar el objetivo cumplido. No repetir un restore ni borrar el destino para medirlo por inferencia.

## Ubicaciones del respaldo existente

- **Generación nueva19octCDMX/20octUTC:** [/Users/Shared/QRIH_Staging_Backups/capture-b19dbe83-4d5c-4432-b910-f48b349080e3](/Users/Shared/QRIH_Staging_Backups/capture-b19dbe83-4d5c-4432-b910-f48b349080e3). Carpeta700/archivos600, DB/Auth y52objetos Storage cifrados;54miembros cifrados verificados. Segunda copia privada: [QRIH_STAGING_20261020T025456Z.age](https://drive.google.com/file/d/1HdDoNiBTh6PW6j03BfDrj4CNfi8hVo0y/view?usp=drivesdk), en carpeta existente; tamaño/hash/readback byte a byte y único permiso owner comprobados20oct03:01UTC. Clave no subió. El nombre usa UTC.
- **Mac:** [/Users/Shared/QRIH_Staging_Backups](/Users/Shared/QRIH_Staging_Backups), generación `capture-88e6a4a1-260c-4d19-9bed-56235edd13db`. Existencia/listado/permisos comprobados19oct sin abrir contenido ni claves: `bundle.tar.age`, `manifest.age`, ocho piezas `.age` y recibo; carpeta700/archivos600. Son archivos cifrados, fuera de Git y de los volúmenes de la copia Rancher.
- **Segunda copia registrada:** carpeta [QRIH Backups en Google Drive](https://drive.google.com/drive/folders/1r_wDsqI2qRVDvSOaxqCqYN9FL-IFgdzq), archivo [QRIH_STAGING_20261008T212225Z.age](https://drive.google.com/file/d/1RoQu6w__hh7tIJTyH8QQnqztpODBUJ_H/view). Subida/readback y permisos privados verificados históricamente; no se reconsultó Drive ni se afirmó vigencia de permisos hoy.
- **Clave separada:** custodia en Bitwarden reportada y probada por el usuario, nota «QRIH — STAGING — Clave de respaldos 2026-10-07». No almacenar la clave junto al paquete en Drive/Git ni compartirla en chat; no se abrió la bóveda en este paso.

Ahora hay dos generaciones distintas de STAGING,08oct y19octCDMX, cada una con copia local y segunda copia Drive verificada en su fecha; la nueva tiene readback actual y el hash local anterior se conserva. No tres generaciones ni respaldo diario activo. GitHub conserva código/documentación, no estas copias de BD/Auth/fotografías. Cerrar Rancher no elimina este directorio ni Drive; nunca usar Reset/borrado de volúmenes como forma de cerrar la aplicación.

## Preparación de futuras copias — revisión del 19 de octubre

**Confirmado por inspección de código, sin ejecución:** `work/aud018-tools-20261006.KqHlHu/capture-staging.mjs`, fuera del repositorio, conserva `CAPTURE_RELEASED=false` (línea29) y aborta al comenzar una captura (línea228). Es un bloqueo intencional de repetición, no una vulnerabilidad. No quitarlo ni presentar `--capture` como instrucción lista para uso diario.

| Control existente | Situación / preparación necesaria |
| --- | --- |
| Cuota y privacidad | Recibo fijo del8oct, exigencia de antigüedad menor a12h; no acredita capacidad actual. Revalidar Free, espacio y destino antes de una nueva ejecución |
| Identidad y esquema | Metadatos fijan STAGING, PostgreSQL170011 e inventario de origen. Revisar cualquier diferencia actual, no relajar controles automáticamente |
| Corte de código | `gitCut()` admite sólo cinco documentos sucios del ensayo antiguo. El lote documental actual no cumple esa condición; preparar un corte trazable al manifiesto revisado, sin ignorar todos los cambios |
| Preparación de red | `--check-ready` lee una clave de servidor en memoria y consulta REST del STAGING fijado. No es offline; no se ejecutó en esta revisión |
| Ejecución | Captura de un solo uso, no servicio diario. Adaptación futura con destinos únicos, permisos restrictivos, cifrado, exclusión de ejecuciones simultáneas y parada segura; no implementada aquí |

### Secuencia mínima antes de una nueva generación

**Preparación offline completada19oct, alcance acotado:** [herramienta](../scripts/backup-rehearsal.mjs), [19pruebas PASS sin skips](../tests/backup-rehearsal.test.mjs) y [evidencia](aud018-backup-rehearsal-2026-10-19.json). Revisión estática y sintaxis PASS. Dos generaciones sintéticas distintas, cifrado/descifrado age real, lectura independiente, bloqueo local atómico, copias previas preservadas, permisos y rechazo de paquetes alterados. CLI probado. Fallos de productor/cifrador/cambio de origen/interrupción son inyecciones de prueba: no ensayos de caída del SO ni fallos reales de pg_dump.

La herramienta sólo admite `--synthetic` y un directorio absoluto de binarios age revisados. No recibe datos, rutas de respaldo reales ni credenciales; no carga `.env`, no implementa cliente de red y genera su identidad ficticia en un directorio temporal privado exclusivo. Binarios macOSage1.3.2 fijados por hash; no descarga ni instalación automática. Material sintético conservado, sin limpieza ni intervención en copias reales. No afirmar aislamiento universal de red por revisión de código.

Reproducción técnica, sólo con binarios locales revisados:

```sh
QRIH_SYNTHETIC_AGE_DIRECTORY="/ruta/absoluta/age-revisado" node --test tests/backup-rehearsal.test.mjs
node scripts/backup-rehearsal.mjs --synthetic /ruta/absoluta/age-revisado
```

Sin el directorio explícito la suite se marca omitida; eso no demuestra PASS. El formato sintético **no es el paquete de respaldo real anterior ni un artefacto compatible con restauración**. No hay adaptador activo a BD/Auth/Storage, captura real ni transferencia; no llamar a esta herramienta respaldo diario operativo. El bloqueo del capturador anterior sigue intacto. Para captura real falta integrar/revisar controles frescos, cifrado del flujo real, coherencia del corte y autorización de exportación/transferencia. No repetir el ensayo de recuperación ya cerrado.

**Candidato/Git:** los167archivos existentes del manifiesto conservan sus hashes. El control RC completo rechaza correctamente los dos nuevos archivos de herramienta/pruebas fuera de su manifiesto; no se relajó el control ni se actualizó candidato para forzar PASS. Nuevos archivos sin commit/push. Su revisión/versionado y el manifiesto del siguiente candidato quedan separados; no reutilizar el READY anterior para este árbol.

1. Acordar entorno exacto y ventana sin escrituras. Documentar alcance autorizado de exportación/transferencia y capacidad Free vigente; nunca usar producción ni el conector ajeno.
2. Preparar una ejecución manual repetible con controles de identidad, esquema, código y límites; probar cifrado y fallos con datos sintéticos antes de habilitar captura real. No desactivar el bloqueo antiguo como atajo.
3. En la ventana autorizada, crear una generación nueva sin sobrescribir anteriores; clave separada, secretos sólo en procesos previstos y ningún dato sin cifrar en Git, Drive o registros.
4. Comprobar integridad, coherencia del corte, inventario y recibo. Los hashes no prueban por sí solos recuperación funcional; conservar el ensayo ya completado y evaluar las diferencias del nuevo origen.
5. Transferir sólo el paquete cifrado al destino privado autorizado y verificar lectura de retorno/tamaño/hash. Registrar fecha, resultado y custodio sin secretos. Si falla, conservar la copia válida anterior; no comprar capacidad ni borrar automáticamente.
6. Registrar generaciones verificadas y antigüedad real. Acumular tres generaciones no autoriza retirar ninguna: selección exacta y permiso antes de cualquier retirada. No repetir restore/login del ensayo cerrado por preparar este procedimiento.

Diseño operativo y ensayo sintético, no ejecución ni autorización de captura/transferencia. Ensayo offline completado dentro del alcance indicado; pendientes adaptador/control de captura real, validaciones frescas y alcance explícito de la primera copia nueva. **No se activó respaldo diario ni se verificaron cuotas, SMTP o Drive actuales.**

## Incidentes: procedimiento propuesto, sin acciones automáticas

1. Identificar el entorno y el incidente. No usar producción como entorno de pruebas ni el conector Supabase de otro proyecto.
2. Detener nuevos cambios de desarrollo; cualquier suspensión del servicio, invitaciones o configuraciones necesita alcance y autorización propios. Conservar evidencia y última copia válida.
3. Revisar diagnóstico sanitizado y la disponibilidad real de cuota/correo. No comprar capacidad ni crear otra cuenta como salida automática.
4. Elegir entre corregir código, recuperar servicio o restaurar datos. Un rollback de código no revierte migraciones/datos; no restaurar sobre el origen por inferencia.
5. Para una restauración real: destino exacto aprobado, impacto mostrado, respaldo/custodia verificados, ensayo acotado y autorización antes de sobrescribir. Validar Auth/RLS/Storage y flujos después; hashes por sí solos no dan GO.

## Piloto y entrega: decisiones separadas

- Destino confirmado: STAGING actual con sus datos reales existentes. No implica apertura pública, invitaciones, publicación de datos adicionales ni permiso de deploy. No volver a preguntar si el piloto será de datos ficticios.
- Entorno original distinto fuera del alcance elegido. AUD-002 de ese entorno conserva su evidencia histórica, no es por sí mismo bloqueo del destino seleccionado ni permiso para modificarlo. Verificar controles del STAGING elegido antes de GO, sin inferir vigencia del ensayo local.
- Netlify se reserva para un RC autorizado con SHA exacto, Free/cuota/guards/READY y validación proporcional. No deploy ahora ni al renovarse cuota.
- SMTP/límites/contingencia de correo necesitan revisión del entorno elegido; pruebas históricas de envío no garantizan capacidad o entrega futura.
- No-admin/publisher HTTP, parte de flujos integrales recuperados y otros límites de la matriz se mantienen explícitos. No crear una cuenta externa adicional ni repetir ensayos completos para ocultar una cobertura faltante.

## Qué no autoriza aprobar esta propuesta

No crea automatizaciones, no exporta ni sube datos, no elimina generaciones, no cambia producción/STAGING/Supabase/SMTP/Netlify, no despliega ni versiona/envía Git. Las ejecuciones conservarán sus gates de alcance, identidad, cuotas y autorización.

**Dictamen vigente:** NO-GO global. Ensayos locales completados se conservan como PASS acotados. Responsable/frecuencia/retención, STAGING con datos reales y RTO objetivo24h confirmados, no operación diaria implementada ni RTO demostrado. Pendientes ejecución segura de respaldos, medición operativa, contingencia correo/cuotas, aceptación del entorno seleccionado y RC/GO explícitos; sin cambios remotos por esta confirmación.
