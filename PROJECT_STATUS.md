## PROJECT STATUS — QRO INDUSTRIAL HUB / QRIH

## Estado maestro consolidado — 2026-10-06

**NO-GO externo / producción; staging disponible para pruebas controladas.** Dictamen y única matriz de cierre: QRIH_AUDIT.md, «Dictamen consolidado vigente». No hace falta repetir recorridos de tarjetas; los límites de cobertura se conservan sin convertirlos todos en bloqueantes. Las notas inferiores son historia con estados de su fecha, no el estado operativo actual.

| Área / IDs estables | Estado vigente | Evidencia / cierre pendiente |
|---|---|---|
| Auth AUTH-001–005 / PROF-001 | FUNCIONA EN FLUJOS REPORTADOS STAGING; PARCIAL | Registro/confirmación/login/perfil/recuperación y datos conservados por usuario; pruebas automatizadas diferenciadas. Correo/variantes avanzadas siguen como riesgo delimitado, no repetir altas ni pedir claves. |
| Roles/permisos PROF-002, AUD-010/011/012/013/014/019 | CONTROLES REVISADOS APROBADOS STAGING / ORIGINAL PENDIENTE | 43 SQL aisladas PASS, baseline+044–050 staging. Feed técnico autorizado separado de tablas privadas; anon sin EXECUTE, helpers internos cerrados, INSERT directo de postulación bloqueado. Excepciones definer documentadas, no alertas borradas. |
| Propiedades PROP-001–005 / imágenes IMG-001/002 / PDF-001 | FLUJOS NORMALES STAGING PARCIALES VALIDADOS | Publicación/moderación/edición/Safari/7 fotos/portada/PDF/reportes preservados; 7 referencias y objetos, 0 inconsistencias examinadas. Bucket privado y 0 firmas persistidas. Original property-images sigue público/8 URLs legadas: AUD-002 no cerrado. |
| Notificaciones NOT-001 / contacto CONT-001 | FUNCIONAN SEGÚN REPORTES; COBERTURA PARCIAL | Navegación/publicación/acceso historial y contacto autorizado tras recarga comprobados por usuario, RPC lectura propia por SQL; tercera cuenta OMITIDA / NO VALIDADA por instrucción, no insistir ni reemplazarla por admin. |
| Demanda/oportunidades DEM-001 | AUD-032 MEDIO / CORREGIDO Y DESPLEGADO STAGING | Propietario consulta requerimiento compatible ajeno sin PII y postula bodega propia publicada/activo; solicitante ve ficha técnica reducida, aviso/par único. 050/tests/commit READY exacto verificados; no sesión/UI autenticada real ni nuevos contactos/cuentas. |
| Tooling/entrega OPS-001/002/003 | AUD-031 CORREGIDO LOCAL / ENTREGA PENDIENTE | 70 unit/43 SQL/lint/tipos/build PASS nuevos, 28 JS/0 indicadores privados. source-map-js 1.2.2, único paquete del lock cambiado; Next/PostCSS intactos. Audit completo/producción 0, 91 firmas/41 attestations verificadas. Último READY f67fa46/AUD-032 y sus 21 HTTP preservados; nueva entrega por verificar. |
| Recuperación / AUD-018 | ESQUEMA RECONSTRUIDO / RESPALDO ÍNTEGRO NO DEMOSTRADO | Baseline+044–050 aisladas pasan; no evidencia de recuperación completa filas/Auth/archivos/configuración. Bloqueante operativo antes de datos reales/corte. |
| Costos / AUD-023 | FREE COMPROBADO / CORREO CON RIESGO RESIDUAL | Supabase organización Free; Netlify Free/recargas y overages off/logs privados/vars protegidas/contexto staging. Gmail/587/entregas anteriores, no garantía de cuotas/Spam/SLA. Sin gasto ni función pagada incorporada. |

Cierre mínimo pendiente: completar entrega AUD-031; respaldo/restauración aislados AUD-018; corte seguro autorizado. AUD-031 ALTO corregido localmente por parche 1.2.1→1.2.2 sin nuevas funciones ni cambio de arquitectura/Next/PostCSS; tres pruebas nuevas con timeout, suites 70 unit/43 SQL/build PASS. AUD-032 permanece corregido/desplegado f67fa46/050 staging; ranking, privacidad y datos del corte anterior preservados sin nueva consulta remota. No sesión/UI autenticada nueva, tercera cuenta omitida/no validada intacta. Guía Supabase npm influyó en lock mínimo, scripts deshabilitados y firmas, sin paquete nuevo/override/upgrade general. Original/main/producción/Supabase/datos/SMTP intactos; Free guard revisado, NO-GO conservado. Detalles/fuentes QRIH_AUDIT.md.

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
