# Sprint 3 — herramientas privadas / 27oct2026

## Base y diagnóstico previo

Sprint2 aprobado localmente por usuario,pero sin commit al comenzar. Se preservaron sus38archivos en checkpoint local `8414633`(sin push ni deploy),padreff89d57. Rama nueva `feature/sprint-3-commercial-tools` desde8414633. main/originmain55b7737 ydevelopremotoff89d57 intactos. Sprint2 todavía no publicado;vinculaciones siguen sólo propuesta. Usuario confirma en este alcance que el swipe funciona en smartphone:validación reportada por usuario,no nueva prueba física del agente.

| Área/archivos | Diagnóstico y cambio propuesto | Riesgo/control |
|---|---|---|
| PropertyImageGallery/globals.css/fichas | Galería ya admite swipe/foco/visor;mobilehereda padding16px ybotones con fondo. SóloCSS para ancho completo yflechas44pxsin fondos,contorno claro/oscuro;no tocar gestos | Regresiónresponsive/ficha compartida;probar componentes reales |
| properties/RPC048/051/052/alta/editor | owner_id significa asesorpublicador,no propietariolegal. No nombre interno. Mantener datos privados en tabla separada ligada porproperty_id,fuera del registrocomercial yJSONaudit/catálogo | No añadircolumnas privadas apublicview niJSONp.*;RLSpropio/adminlectura |
| Perfil/directorio/formularios | No existe directorio. Nueva tabla advisor_owners con campos mínimos,archivo yfechasBD;secciónMispropietarios yCRUD privado,búsqueda yrelaciones | Sinservice_role;actorservidor+RLS;adminlecturasólo,crossaccountasociaciónprohibida |
| Alta/edición/duplicación | GuardadoRPCexistente esatómico para galería;altaSDKinsert+replace. IncorporarRPCv3 para guardar datoscomerciales+privados juntos,conservar flujoslegados sincamposnuevos yduplicaciónsólo misma cuenta | No pérdidas parciales;validar antes de transferencias ypruebasrollback/idempotencia |
| demand_requests/feed/admin | Activos según sistema=new yúltimos45días;no urgencias ni fechas. Tabla deunpuntero porusuario,fechasUTCBD,locktransaccional porusuario,RPCdeacción | Unaactivavigente bajo concurrencia;expiración derivada,sincerrar requerimiento/cron |
| Público/compartido/PDF/moderación | Publicprojection ylistascomerciales existentes. Nuncaconsultar nuevas tablas desde público;no tocar títulos ni moderación | Canarioprivado enRLS/JSON/catálogo/ficha/PDF;existentes sinfilaprivada compatibles |

## Dependencias previstas antes de implementar

Migraciones versionadas nuevas,**sólo preparadas y probadas en BD aislada**;no ejecución remota ni producción.1)Directorio ydetalleprivado conRLS/archivo,2)guardadoatómico conRPCv3,3)urgencia porusuario yfeedmismospermisos. Tablasnuevas ausentes enSTAGING:interfaz debe explicar«porhabilitar»sin fallar ni simular guardado. LedgerdevinculacionesSprint2 no se aplica como dependencia ni se incorpora aeste sprint.

Política conservadora:asesoractivo administra sólo sus contactos/asociaciones;adminactivo puede consultar conguardreal,no reasignar ni escribir contactosajenos. Archivar,noDELETE. Datosprivados no viajan enp_changes comerciales ni audit_logs. Duplicaciónmisma cuenta precarga camposprivados editables;viejoRPCno permite duplicaciónentrecuentas yse conservaesa prohibición.

Urgencia:7díasnaturales=168horasconsecutivas desde relojBDUTC,incluye finesdesemana/festivos;UIAmerica/Mexico_City. No cron. Requerimiento activo=new,creadoúltimos45días,concuentaactiva;vencerurgencia no cambiaestado de requerimiento. Renovación reinicia7díasdesdeconfirmación,nuncaapila extensiones. Otro requerimiento urgente vigente produceconflicto,hasta retirarlo oquevenza.

Fuentesrevisadas:Nextinstalado(Server/Client,RouteHandlers,CSS);SupabasechangelogHTMLfallback(markdownincompatible),RLS yRPCactuales. GuíasPostgresdeRLS ylocksconsultadas. CLI2.119.0existente,noactualizada;generararchivoslocales requiere permiso deescritura detelemetríadelCLI,ningún comando remoto. No se usa conectorSupabase deproyectoajeno.

## Informe de entrega local

**Estado: implementado en código para revisión; no validado funcionalmente en STAGING.** No se hicieron push, despliegues, migraciones remotas ni cambios comerciales o de contactos. Excepción: al revisar visualmente una ficha real desde localhost se activó su contador automático de visitas remoto, descrito abajo; no se afirma cero escrituras analíticas. Las referencias remotas conservadas son `origin/develop=ff89d57` y `origin/main=55b7737`. El checkpoint local aprobado de Sprint 2 es `8414633`; los cambios de Sprint 3 permanecen sin commit en `feature/sprint-3-commercial-tools`.

### Funcionalidades

1. **Galería:** sólo estilos móviles, sin reescribir `PropertyImageGallery` ni los gestos. Fotografía a ancho disponible, proporción conservada con `object-fit: contain`, flechas sin fondo/borde/sombra, contorno blanco/oscuro y área táctil mínima de 44 px. Tablet/escritorio mantienen la presentación previa. Las fichas compartidas usan su portada independiente y no reciben estos selectores.
2. **Nombre interno:** opcional, máximo 160 caracteres, en alta, edición, duplicación editable, tarjetas propias, consulta privada y detalle administrativo. No se añade ninguna columna privada a `properties` ni a su vista pública. Los títulos comerciales no cambian.
3. **Mis propietarios:** directorio desde Mi perfil; registro, edición, búsqueda por nombre, paginación de 50, propiedades asociadas, asociación/desvinculación, archivo y restauración. Los selectores de propiedades también están paginados. Nombre obligatorio; empresa, teléfono, correo y notas opcionales con límites en cliente/servidor/BD. Fechas automáticas de BD. No se solicitan documentos ni información bancaria.
4. **Flujo de propiedad:** propietario opcional, selector privado y alta sin salir del formulario. Guardado comercial/galería/privado mediante una única transacción cuando las migraciones estén instaladas. Un fallo revierte todo. Datos privados separados de `p_changes`, sin introducirlos en auditorías comerciales. Reintentos con ID estable; altas inline confirmadas no se repiten si no cambian sus campos.
5. **Duplicación:** sólo de propiedad propia, misma cuenta, sin copiar contactos. Se precargan nombre y asociación de forma editable. Archivar no invalida la relación histórica: también puede conservarse en la duplicación; los selectores nuevos ocultan archivados salvo el contacto ya seleccionado. Nunca se modifica el original.
6. **Urgencias:** una por usuario, siete días naturales consecutivos (168 horas) desde reloj de BD, renovar o retirar. Estado derivado de vencimiento y elegibilidad actual (`new`, últimos 45 días); no cron, publicidad ni notificaciones masivas. Se priorizan requerimientos propios y el feed compatible existente sin ampliar sus filtros. Etiqueta con vencimiento en America/Mexico_City; temporizador limpia la etiqueta y refresca el orden al vencer. El requerimiento no se cierra.

### Seguridad y migraciones preparadas

Ejecutadas **únicamente en PostgreSQL aislado en memoria** sobre baseline + 044–052:

| Archivo | Alcance |
|---|---|
| `20261027061535_sprint3_private_owners.sql` | `advisor_owners`, `property_private_details`, índices, FK, triggers de integridad, RLS y RPC de asociación parcial |
| `20261027061537_sprint3_atomic_private_property.sql` | RPC de creación atómica, wrapper de edición/duplicación y comprobación de disponibilidad; RPC antiguos intactos |
| `20261027061538_sprint3_demand_urgency.sql` | `demand_urgencies`, RLS de lectura, RPC transaccional y enriquecimiento del feed compatible con fecha de urgencia |

- `owners_private_read/insert/update`: asesor activo sólo sus contactos; administrador activo puede leer contactos ajenos, pero no escribirlos. Comprobación real de rol desde `profiles`, nunca metadata editable.
- `property_details_private_read/insert/update`: lectura propia o admin activo; escritura sólo del asesor activo propietario del inmueble. Trigger exige que contacto e inmueble pertenezcan al mismo asesor. No se puede cambiar identidad/advisor por UPDATE ni asociar IDs ajenos.
- `urgency_own_admin_read`: tabla de urgencias legible por su usuario activo o admin activo. Ningún cliente puede insertar, editar o borrar directamente. RPC usa lock transaccional por usuario y PK por `user_id`, con reloj tomado después de adquirir el lock.
- Sin DELETE de contactos. Archivar/restaurar no borra propiedades ni historial. Eliminar una propiedad elimina sólo su detalle/asociación privada; el contacto permanece.
- APIs privadas usan actor validado, origen canónico, tamaños acotados, proyecciones explícitas y `private, no-store`. Las búsquedas viajan en cabecera codificada, no en URLs de acceso/historial. Sin logs de cuerpos, contactos o errores SDK, sin `service_role` en estas nuevas funcionalidades, sin persistencia de contactos en localStorage.
- Si faltan migraciones, el directorio indica «por habilitar», no simula éxito; alta/edición heredadas siguen disponibles sin alterar campos privados. Si la verificación privada falla por otra causa, se bloquea el guardado para evitar vaciar datos por error.
- No se cambia el modelo de permisos de los RPC previos ni el ledger propuesto de Sprint 2. No se aplica la propuesta de tablero de requerimientos de sprints anteriores.

### Archivos afectados

- Nuevos: `components/{OwnerDirectory,PrivateOwnerFields,PrivatePropertySummary,DemandUrgency}.tsx`, `lib/private-commercial{,-server}.ts`, `app/perfil/propietarios/page.tsx`, `app/api/propietarios/route.ts`, `app/api/requerimientos/urgencia/route.ts`, las tres migraciones y dos suites `tests/sprint3-commercial{,-rls}.test.mjs`.
- Integración: `app/publicar/{page,PublicarForm}.tsx`, `app/mis-propiedades/page.tsx`, `app/mis-propiedades/[id]/{page,editar/page,editar/EditarPropiedadForm}.tsx`, `app/perfil/page.tsx`, `app/admin/[id]/page.tsx`, `app/admin/asesores/[id]/page.tsx`, `lib/property-save-server.ts`, `proxy.ts`, `app/globals.css` y `package.json`.
- Regresiones: `tests/{commercial-properties,http-smoke,prelaunch-ui,profile-property-management,property-write-errors,sprint1-stability,ssr-session,synthetic-test-environment}.test.mjs`. Se conserva el fingerprint completo de la lógica anterior del panel y formularios tras excluir únicamente los enriquecimientos explícitos de Sprint 3; no se reemplazó su hash por uno que ocultara cambios comerciales.
- Documentación: este informe, `PROJECT_STATUS.md`, `NEXT_STEPS.md`, `QRIH_FUNCTIONAL_INDEX.md`, `QRIH_AUDIT.md`. Herramientas visuales sintéticas y evidencia se mantienen fuera de Git.

### Validación y evidencia

| Comprobación | Resultado local |
|---|---|
| TypeScript y lint | PASS, sin cambios de dependencias |
| Build Next instalado | PASS, sin clave privada en compilador |
| Suite previa + integración de guardado privado | 270/270 PASS |
| Nueva suite de validación/API/privacidad | 10/10 PASS |
| RLS/regresiones previas | 111/111 PASS |
| Nuevas migraciones y RLS | 13/13 PASS |
| HTTP sobre build local, sin sesión | 39/39 PASS |
| Preflight | PASS; bundle cliente sin la credencial privada examinada |

Las suites nuevas también están incluidas en los comandos habituales: `npm test` ejecutó 280 pruebas y `npm run test:rls` ejecutó 124 con el runtime PGlite configurado. Los comandos focalizados `test:sprint3` y `test:sprint3:rls` se conservan para repetir sólo este alcance. Último HTTP sobre el build final: 39/39 PASS; última comparación de huellas posterior a la visita: 26/26 conservadas.

Las pruebas de aislamiento usan A/B/admin/suspendido sintéticos y correos `example.invalid`. Comprueban lectura propia, ID ajeno vacío, UPDATE ajeno de cero filas, INSERT/asociación ajena denegados, DELETE denegado y metadata administrativa falsa sin privilegios. El admin autorizado puede leer, no editar contactos ajenos. Se probaron rollback de creación y edición, copia privada al nuevo borrador, conservación de fuente, reintento idempotente, archivo y FK de eliminación. Publicar mediante moderación conserva los privados únicamente en su tabla; una fila publicada real de la instancia aislada no expone canarios en `properties_public`, el registro comercial ni auditorías.

Urgencias: activación, intervalo exacto, activación repetida sin renovación implícita, renovación explícita, retiro, caducidad, cerrado/antiguo/ajeno/suspendido y segundo urgente rechazado. El feed distingue urgencia vigente, quita la fecha al vencer y no añade nombre/teléfono/correo/user_id. Se verificó el lock antes del reloj y el invariante único; **no equivale a una prueba con dos conexiones simultáneas reales**.

Navegador sintético: registro/edición/búsqueda, asociación/desvinculación, archivo/restauración, alta inline y selección en FormData, activación/renovación/retiro de urgencia. Sin conexión a Supabase y sin datos reales. Galería medida a 375 px: borde izquierdo 0, ancho 375, documento 375, proporción 375×250; flechas transparentes, borde 0, sombra none y toque mínimo 44 px. Tablet 768 y escritorio 1280 sin desbordamiento; visor, siguiente y cierre comprobados. La prueba táctil física es la previamente reportada por el usuario, no una nueva prueba del agente.

Evidencia local: `../evidence/sprint3-gallery-mobile.png` y `../evidence/sprint3-urgency-mobile.png` (rutas relativas al checkout `qrih`; datos completamente ficticios). La ficha compartida HTML se renderizó con canarios privados extra y no los incluyó; su loader/PDF conservan la proyección pública explícita sin esas columnas. **No se generó ni inspeccionó un PDF binario nuevo del Sprint 3**; la prueba PDF autenticada completa queda para STAGING autorizado, junto con los demás flujos integrados.

Comprobación remota sólo de lectura: huellas de las **26 filas** idénticas al registro anterior, incluidas las **24 originales**; 22 publicables en el momento de consulta y cero escrituras. No se consultaron contactos reales. Configuración local cargada del archivo existente del checkout original en el proceso, sin copiar credenciales a esta rama. Un intento inicial sin esa configuración fue rechazado por el guard; preflight y build posteriores con carga correcta pasaron. Los fallos iniciales de fixtures por imports/contadores nuevos se corrigieron conservando los casos anteriores.

**Excepción en la comprobación visual final:** se abrió la ficha pública real proporcionada por el usuario en `127.0.0.1:3110`. La ruta existente registra visitas mediante `qrih_take_server_limit` y `property_views` aun siendo una navegación GET. Una lectura posterior confirmó **un evento** a `2026-10-27T07:03:33.082133Z`, coincidente con esa navegación. También se ejecutó el control automático de frecuencia de esa ruta. No se editaron propiedades/contactos y no se borró el evento para ocultar la prueba. Se informó al usuario y se detuvieron las navegaciones reales adicionales. Por tanto, «cero escrituras» en el párrafo anterior describe sólo el script de comparación, no toda la revisión visual. Evidencia de esa ficha: `../evidence/sprint3-property-mobile.png`; ancho 375, x=0, documento 375 y flechas sin fondo/borde/sombra. No es evidencia de las nuevas funciones de BD en STAGING.

### Pendientes, riesgos y reversión

1. **Autorización para STAGING**: revisión de las tres migraciones, su aplicación separada y un despliegue controlado. Ninguna de esas acciones está autorizada o realizada en este sprint. Hasta entonces las herramientas privadas nuevas estarán «por habilitar» en la base remota.
2. **Concurrencia real**: dos conexiones PostgreSQL/Supabase simultáneas con cuentas sintéticas; entorno local sólo ofrece PGlite de una conexión, no hay servidor PostgreSQL disponible ni daemon Docker. La exclusión por lock/PK se probó de forma serial y por inspección, no se certifica contención multisesión.
3. **Validación integrada hospedada**: alta/edición/duplicación, identidad privada, directorio y urgencia con dos usuarios y admin reales de prueba; exportación PDF y ficha compartida con nuevas filas privadas; expiración visual con reloj controlado. No usar contactos de personas reales.
4. Tras una respuesta de guardado perdida, no se borran fotos que pudieran estar confirmadas. Puede requerirse conciliación manual de huérfanos; no se añadió un limpiador automático ni se tocaron objetos reales.
5. Límites heredados de Sprint 2 y auditoría continúan vigentes. Este informe no acredita publicación de Sprint 2, activación de su contador de vinculaciones ni GO de producción.

Reversión: volver al checkpoint de aplicación `8414633` mediante un despliegue expresamente autorizado. Conservar las tablas privadas y sus filas bajo RLS; **no DROP, DELETE ni backfill destructivo**. Si fuera necesario detener nuevas escrituras, preparar una migración revisada que revoque sólo las concesiones/RPC nuevas, no los flujos comerciales anteriores. Restaurar el feed previo requiere otra migración revisada; los requerimientos y sus historiales no se borran. La expiración de urgencia nunca altera el estado del requerimiento.

**Recomendación: GO condicionado para revisión y validación en STAGING aislado**, después de autorizar/revisar SQL y despliegue; completar las pruebas multisesión antes de aceptar concurrencia. **NO-GO para producción ni para declarar validación remota completa.** Se detiene el sprint en este punto, sin nuevas acciones remotas implícitas.
