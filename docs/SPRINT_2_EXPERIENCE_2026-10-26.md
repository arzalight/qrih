# Sprint 2 — experiencia, descubrimiento e indicadores

## Fase A: diagnóstico previo a cambios

Árbol limpio en develop `ff89d57`;`41061a0` es su padre funcional y corresponde al Sprint1 aprobado. Rama nueva `feature/sprint-2-experience` desde ff89d57. Sin cambios descartados,main/producción ni despliegues. Los datos sintéticos de Sprint1 se conservan sin nuevas escrituras remotas.

| Superficie / archivos | Causa comprobada | Propuesta | Riesgo |
|---|---|---|---|
| Inicio / app/page.tsx,properties_public | Se muestran6tarjetas,no contador;vista pública filtra published+cuentaactiva+publications_enabled | COUNT exacto/head sobre la misma vista,sin contar tarjetas ni joins;estado error distinto de0 | Bajo;no crear regla de vigencia paralela |
| Login/registro/perfil / app/login,app/registro,app/perfil,lib/safe-navigation | Login existente con loading/errores,pero básico;perfil anónimo muestra mensaje sin Header ni retorno;next ya se valida | Mejorar presentación,mensajes español y retorno /perfil,conservarAuth/PKCE/recuperación;next seguro explícito prevalece sobre destino porrol | Medio;no segundoAuth ni redirects externos |
| Vinculaciones / property_contact_authorizations,RPC032/046 | status authorized+responded_at se escribe tanto al aceptar manualmente como porautoaprobación;sin actor/origen durable,no conversación ni respuesta comercial libre persistida | Propuesta versionada de ledger privado:una fila por solicitud al pasar pending→authorized por dueño activo,desde habilitación;agregado numérico servidor. Sin backfill ni ejecución remota | Medio;dependencia deBD pendiente,mostrar no disponible,no0ficticio |
| Similares / lib/matching,app/bodegas/[slug] | FiltroSQL yJS exigenmunicipioexacto+±25%,limitan3;sin etapas;datos faltantes descartan todo | Descubrimiento progresivo dentro del municipio:mismas operación/zona prioritarias,±25%,±50%,hasta relación0.5–2;sólo6públicas como máximo. No geografía cercana inventada ni cambio de matching requerimientos | Medio;no volver a sugerir5440m²para234m² |
| Administración / components/Header,AdminPropertiesTable | Raildesktop224px existente,sincontracción;tabla reinicia página ante nueva referencia de properties | Contracción accesible sóloenAdmin,estado de sesión,navegación intacta;conservar página durante refresh y ajustar sólo al reducir resultados | Bajo;presentación noautoriza |
| Admin refresco / app/admin/page,asesores/page | No actualización automática;listadosSSR,detalles contienen formularios/actions | RefreshRSC30s sóloenlistados autorizados,pausa oculto/dirty/foco/selección/busy,no duplicados,cleanup. Noauto-refresh formulariosdeedición/moderación/configuración | Medio;mantener filtros/página/foco |
| Solicitar información / ResponsiveContactPanel,PropertyContactForm,API,RPC046 | Sprint1 ya cerrado todosanchos,formúnico,Auth/ownership/rate-limit/restauración | Verificar,mantener implementación y envío existente;pruebas sintéticas locales,ningún contacto real | Bajo |
| Vigencia / migrations045/046,properties_public | expired es estado excluido;verification_due_at es fecha de revisión,no hay regla implementada de vencimiento temporal ni columna pública | Conservar visibilidad vigente del catálogo;no convertir fecha de revisión en caducidad ni alterar propiedades | Dependencia de negocio si se desea caducidad porfecha |

## Dependencia antes de implementar indicadores

El total de propiedades no necesita migración:usa la proyección pública existente. La cifra de vinculaciones **no puede deducirse con fiabilidad del histórico**. Se prepara propuesta SQL fuera del directorio de migraciones ejecutables;no se aplica a ninguna BD remota. El código consume sólo un RPC de agregado de servidor cuando exista;hasta entonces muestra «Registro por habilitar». Esta limitación debe acompañar cualquier recomendación de despliegue. No usar autorización automática ni notificaciones como evidencia comercial.

Documentación contrastada:Next instalado(Server/Client,CSS,RouteHandlers,useRouter);Supabase [select/count](https://supabase.com/docs/reference/javascript/select),[SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) y[changelog](https://supabase.com/changelog). Markdown del changelog no compatible,se leyó HTML;sin cambio deSDK/dependencias. Guías deSupabase/Postgres usadas para aislar agregado/ledger y no abrir contactos privados.

## Implementado en código (local, sin commit/push/deploy)

1. **Acceso:**login con identidad QRIH,bienvenida,beneficio de acceso,tarjeta limpia responsive,registro/recuperación existentes,carga,validación nativa y errores españoles sin imprimir errores SDK. Ref síncrona impide doble envío. No nuevo Auth. Perfil anónimo redirige a login con `next=/perfil`;panel conserva pestaña válida,notificaciones,solicitudes,editor,preview,duplicación y páginas Admin conservan destino local seguro. Login respeta `next` explícito antes del destino por rol;admin activo sin next mantiene /admin. ServerActions de moderación conservan su autorización y fallback previo;no se reconstruyen formularios POST al expirar sesión.
2. **Indicadores:**`/api/indicadores-publicos` devuelve únicamente properties,connections,connectionsStatus. COUNT exacto/head de properties_public,statuspublished,sin depender de las6tarjetas ni joins. Cliente sin cookies,consulta inicial y60s visibles,sin solapamiento,abort/cleanup y texto de carga/error distinto de0;cache CDN máximo60s. Agregado de vinculaciones mediante RPC privado servidor sólo cuando exista;ausente muestra«Registro por habilitar»,no un cero inventado. Respuesta real local:properties22,connectionsnull,not_enabled.
3. **Vinculaciones:**usuario confirmó explícitamente **sólo solicitudes aceptadas**,no rechazos. [Propuesta SQL v1](proposals/sprint-2-confirmed-connections.sql) fuera de supabase/migrations:ledger privado conPK por autorización,trigger sólo UPDATEpending→authorized con responded_at,dueñoJWT activo y propiedad correspondiente. Sin INSERTautoaprobado,sistemas,backfill o dobleconteo. Contador histórico acumulado desde habilitación,no limitado a propiedades actualmente activas. Datos del ledger inaccesibles a anon/authenticated/service_role porSELECT directo;RPC fijo sólo service_role,entrega bigint. **No instalada ni autorizada para ejecución remota**. Antes de convertirla en migración real:generar con CLI,revisar ACL/advisors,validar contra RPC046/032 en staging autorizado y comprobar rollback/dependencias. No se afirma una migración aplicada ni un contador comercial ya habilitado.
4. **Similares:**misma operación y municipio siguen siendo límites. Dentro de ellos,orden de etapas:misma zona±25%,otra zona±25%,misma zona±50%,otra zona±50%,misma zona hasta relación0.5–2,otra zona hasta0.5–2. Por etapa prioriza cercanía de superficie y características industriales disponibles(techado/andenes/altura),con desempate estable. Máximo6,IDactual y duplicados excluidos;sin inventar moneda,presupuesto ni vecindad geográfica. Demanda/requerimientos conservan sus límites declarados y scoring previo. SQL sólo consulta properties_public,published y rango envolvente;portadas autorizadas y precios/tarjetas existentes. Sin candidatas válidas continúa el estado vacío;error de consulta tiene mensaje distinto.
5. **Admin contraíble:**rail existente224→88px sólo desde1200px,iconos/nombres accesibles/title,estado sessionStorage de la sesión;mobile conserva menú y etiquetas. SóloHeaderadministration renderizado por páginas ya autorizadas;no nuevo permiso. Tabla contenida con desplazamiento horizontal,sin desbordar documento.
6. **Admin30s:**componente sólo en listados /admin y/admin/asesores,después de guards activos. Refresco RSC(no recarga completa),sin nueva dependencia ni Realtime. Filtros URL y página de tabla conservados;el formulario de filtros sin aplicar/foco editable/selección de texto/acción busy/submit o pestaña oculta pausan las lecturas. Navegación o filtros aplicados nuevos reinician el control. No recarga automática en edición/moderación/configuración de formularios. Transición en curso bloquea otro refresh;cleanup al salir. Mantiene DOM/estado de clientes;las portadas pueden renovar sus firmas efímeras de seguridad.
7. **Solicitar información:**no reimplementado. Mismo componente retraído todosanchos,mismo formulario montado,handlers/API/RPC sin cambios. Verificados abrir/cerrar/reabrir con texto conservado y envío sintético local→Solicitudpendiente. No contactos remotos creados.

## Archivos modificados

- Inicio/indicadores:app/page.tsx,nuevoapp/api/indicadores-publicos/route.ts,components/PublicIndicators.tsx,lib/public-indicators.ts,lib/visible-polling.ts.
- Acceso:app/login/page.tsx,app/perfil/page.tsx,lib/safe-navigation.ts;retornos en app/{mis-propiedades,notificaciones,publicar}/page.tsx,mis-propiedades/[id]/{page,editar/page,solicitudes/page}.tsx y páginas deAdmin(principal,asesores,detalledepropiedad/asesor,historial,configuración).
- Descubrimiento:lib/matching.ts,app/bodegas/[slug]/page.tsx. UI:components/Header.tsx,AdminPropertiesTable.tsx,nuevoAdminAutoRefresh.tsx,app/globals.css.
- Pruebas:nuevas tests/sprint2-experience.test.mjs y sprint2-metrics-rls.test.mjs;auth-navigation,http-smoke,prelaunch-ui y comandos package.json. Sin dependencias/lockfile nuevos.
- Documentos:este informe,propuestaSQL,PROJECT_STATUS,NEXT_STEPS,QRIH_FUNCTIONAL_INDEX,QRIH_AUDIT. Sin cambios de migraciones ejecutables,precios,guardado de propiedades,AuthPKCE,roles oRLS existente.

## Validado localmente

| Verificación | Resultado |
|---|---|
| Aplicación/autenticación/retornos/roles/cálculos/edición/duplicación/notificaciones/ficha/PDF | **267PASS,0fallos/omitidas**;incluye10pruebas Sprint2 |
| PostgreSQL aislado(PGlite) | **111PASS,0fallos/omitidas**;incluye propuesta ledger sin backfill,autoaprobación,rechazo,ajeno,suspendido o dobleconteo |
| HTTP local3110 | **33PASS,0fallos/omitidas**;retornos307seguro,auth/endpoints denegados,agregado sin cookies ni PII |
| Lint,TypeScript,build ypreflight | PASS;bundlecliente sin credencial privada,diff-checkPASS |
| Login real local anónimo | /perfil→/login?next=%2Fperfil;registro conserva next,recuperación intacta;375pxsin overflow,captura revisada |
| Inicio real local | 22propiedades;vinculaciones«Registro por habilitar»;375pxsin overflow,captura revisada |
| Admin UI aislada con componentes reales | 375/768/1280sin overflow;rail88px,nombres accesibles yestado conservado al recargar;timerreal refresca0→1,tabla mantienePágina2;filtro pendiente conserva texto ydetiene actualización al menosunintervalo visible |
| Contacto UI aislado | Retraído inicialmente;mensaje conservado al cerrar/reabrir,móvil375px;envío alservidor ficticio devuelve Solicitudpendiente. No envío a propiedad real |
| Integridad remota sólolectura | HuellasSHA256idénticas de26filasantes/después,incluidas24originales contra baselineSprint1;0escrituras remotas en este sprint |

Correcciones de pruebas esperadas por el nuevo contrato:no se eliminaron casos. Login incorpora ref/next explícito;similares pasa de3/±25%a6/progresivo;perfil/panel/notificaciones anónimos pasan aviso200→redirect307con next validado. Hash de lógica autenticada del panel **comparado byte a byte con41061a0** yconservado,separando sólo el bloque anónimo cambiado;contratos de formularios de propiedad ycontacto intactos. Pruebas iniciales identificaron fixtures con expectativa antigua y un error sintáctico de onChange,corregidos antes del build final. No se ocultaron fallos de negocio.

Lectura pública sin visitar fichas(ni generar vistas):22disponibles;antes7fichas sin similares,directamente aplicando el nuevo algoritmo6sin similares y1recuperada. Las6restantes no tienen candidatas comparables bajo límites seguros;no se fuerza el mínimo3. Ninguna publicada tiene verification_due_at pasada en esta lectura. Esa fecha sigue siendo de revisión,no se introduce una caducidad de negocio nueva.

Evidencias revisadas fuera deGit:../evidence/sprint2-login-mobile.png,../evidence/sprint2-home-indicators-mobile.png,../evidence/sprint2-admin-collapsed.png(esta última **datos ficticios42/7**,no cifras reales). Herramientas/fixtures/huellas ignoradas ysin credenciales en código/documentos. Una primera navegación a localhost encontró una sesión previamente existente;se leyó perfil sin modificarlo y se usó127.0.0.1para la revisión anónima aislada,no se cerró la sesión del usuario.

## Riesgos y pendientes

- **Vinculaciones pendiente de BD:**no existe evidencia fiable para histórico;se entrega propuesta,no cifra. Su activación no está lista para un despliegue completo sin revisión/autorización específica. Respuestas fuera de QRIH no se cuentan sin evidencia persistente.
- Similares no cruza municipios ni deduce distancias sin catálogo geográfico aprobado;fuente sin operación/municipio/superficie positiva muestra vacío. Lectura candidata está limitada a1000filas del municipio/rango;si el catálogo supera ese volumen,requiere paginación/consulta de ranking antes de garantizar cobertura exhaustiva.
- Indicadores pueden tardar aproximadamente60s mientras la pestaña esté visible,máscache60s en CDN;no Realtime. Un fallo muestra«No disponible»,no dato fabricado. El usuario con filtros sin aplicar conserva su formulario ypausa el refresco hasta cambiar/aplicar navegación.
- **Heredados Sprint1:**gesto nativo iOS/Android en teléfono físico yaceptación visual con administrador enSTAGING siguen pendientes. La prueba Admin aislada/noAdmin local no los sustituye. covered_area/almacenamiento yguardado de borrador sin foto no cambiaron.
- Sin prueba end-to-end remota de nuevas vinculaciones/contactos en este sprint,sin carga/RTO/producción. AUD043/AUD018conservan límites anteriores. No nuevo GO de producción.

## Plan de validación en staging (requiere autorización;no ejecutado)

1. Revisar diff de feature/sprint-2-experience,decidir si autorizar únicamente UX con«Registro por habilitar»o aprobar propuesta deBD por separado. Convertir propuesta a migración sólo tras revisar yautorizar,advisors y pruebas aisladas.
2. Autorizar commit/integración develop y **un** build del sitio qrih-staging,confirmandoFree/builds detenidos ySHA;nunca main/producción implícitos.
3. Comprobar33HTTP remotas actualizadas,login→perfil/otrasrutas,next externo denegado,roles sin elevación,indicador22o total público real al momento yestados de error/carga.
4. En cuentas/propiedades exclusivamente sintéticas autorizadas:contacto anónimo/login,solicitud pendiente,autoaprobación excluida,aceptación manual una vez,reintento concurrente yrechazo excluidos;verificar que no se convierta histórico. Comparar propiedad/user/contactos reales sin mutarlos.
5. Admin con cuenta existente autorizada:rail desktop/móvil,30s,paginación/filtros/foco/selección/pestañaoculta/error/acción en curso;no conceder admin a cuentas nuevas para probar.
6. Validación física iOS/Android yregresión de similar/editar/duplicar/publicar/avisos/ficha;datos reales sólolectura,capturas redactadas yhuellas antes/después. Detenerse yreportar resultado,no producción automática.

## Recomendación y separación de estados

- **Implementado/local validado:**UX,conteo público,similares,Admin yregresión indicados arriba. Rama independiente con cambios locales,sin commit/push/deploy;origin/develop permaneceff89d57 yorigin/main55b7737.
- **GO condicionado para revisión UX en staging:**pruebas disponibles pasan,sin regresiones detectadas. Requiere autorización de despliegue yaceptar explícitamente el estado«Registro por habilitar».
- **NO-GO para activar el indicador completo de vinculaciones o declarar Sprint2 publicado:**propuestaSQL no instalada ni revisada contraSTAGING remoto;sin autorización de cambiosBD/deploy.
- **Producción:**pendiente de autorización yvalidación separadas. No desplegada ni modificada.

Vista local de revisión preparada en http://127.0.0.1:3110/login?next=%2Fperfil;el servidor local compilado3110 queda disponible para revisión. La pestaña de pruebas sintéticas fue cerrada ysu servidor3119 detenido;emulación responsive restablecida. No se cerró la sesión previamente existente del usuario ni se solicitó ningún buildNetlify.
