# Sprint 1 — estabilidad / 26 octubre 2026

Actualización posterior:publicado y validado en STAGING41061a0. Duplicación,notificaciones aisladas,portadas/vista privada y32HTTP remotas PASS;24propiedades previas intactas. [Entrega y pendientes vigentes](SPRINT_1_STAGING_2026-10-26.md). Los apartados de auditoría/local inferiores describen el corte anterior al despliegue.

## Auditoría inicial (antes de implementación)

Base: develop8f8871f,árbol limpio. La carpeta nueva estaba vacía;se creó copia Git local independiente en qrih,rama feature/sprint-1-stability. El repositorio anterior queda intacto. Sin fetch/push/deploy ni operaciones sobre producción. Revisados PROJECT_STATUS,QRIH_FUNCTIONAL_INDEX,QRIH_AUDIT,registro post-RC y código fuente. Dependencias instaladas existentes reutilizadas localmente,sin actualizarlas.

| Problema | Causa/estado confirmado | Archivos | Solución propuesta | Riesgo |
|---|---|---|---|---|
| Duplicar y enviar | Existe RPC idempotente que fuerza draft y copia fotos;formulario oculta envío y vuelve al panel,interrumpe continuación | app/publicar/page.tsx,editor,lib/property-save-server.ts,migración051 | Crear copia draft como hoy y continuar en editor del ID nuevo;allí acciones existentes borrador/revisión,no modificar RPC | Medio:conservar independencia,idempotencia y límites |
| Abrir tarjeta propia | Portada/título no enlazados;detalle público sólo published | app/mis-propiedades/page.tsx | Enlace principal sin envolver botones;vista privada propia para no publicadas con guard servidor | Medio:evitar exponer borradores |
| Doble volver | Página y formulario presentan la misma acción | editar/page.tsx,EditarPropiedadForm | Conservar acción del formulario | Bajo |
| Contador avisos | Header cuenta unread sólo de limit5;historial no tiene botones para marcar | Header,notificaciones/page.tsx | COUNT exacto independiente,lista5,marcado propio individual/todas,evento único de refresco | Medio:ownership/error/concurrencia |
| Deslizar galería | Sólo clic/flechas/teclado,ningún gesto | PropertyImageGallery | Gesto horizontal con umbral y predominio del ejeX,sin cancelar scrollvertical | Bajo |
| Progreso fotos | Hay optimización y mensaje general,no estado de cada transferencia | PublicarForm,editor,ImageUploader,PropertyImageEditor | Estados por foto e indicador indeterminado,sin porcentajes;bloquear selección mientras guarda | Medio:mantener archivos y no doble envío |
| Admin desde perfil | Perfil carga role pero no muestra acceso;servidor admin ya exige roleadmin+active | perfil/page.tsx,admin/*,proxy | Botón sólo roleadmin+active desde perfil del servidor;guards intactos | Bajo |
| Contacto retraído | Existe ResponsiveContactPanel cerrado sólo por CSS móvil | ResponsiveContactPanel,globals.css | Retraído por defecto en todos los anchos,mismo formulario montado | Bajo |
| Etiqueta superficie | covered_area sólo significa superficie techada;no prueba de equivalencia con almacenamiento(que podría excluir oficinas) | formularios,fichas,PDF y esquema | No reemplazo automático;pendiente definición técnica | Riesgo semántico:pendiente |

## Límites y plan

No RLS/permisos/migraciones nuevas previstos:013permite SELECT/UPDATE propio de notifications,046limita lectura y trigger sólo permite read_at;048bloquea INSERT cliente. No se ejecuta SQL remoto. No se usa el conector Supabase de cuenta distinta. Defectos se confirman en código,validación remota aún pendiente. Cualquier vulnerabilidad alta nueva bloqueará sólo superficie afectada.

Documentación oficial contrastada:Supabase select(count exact/head),update con filtros y changelog26oct;endpointmarkdown no compatible con herramienta,se leyó HTML. AvisoTLS12oct afecta clientes anticuados desde10nov,no requiere cambio de SDK en este sprint. Next instalado:guías Server/Client Components yCSS leídas antes de editar. Fuentes:https://supabase.com/docs/reference/javascript/select,https://supabase.com/docs/reference/javascript/update,https://supabase.com/changelog.

## Implementado en código

1. **Duplicación en dos pasos seguros:**se conserva endpoint/RPC051,idempotencia,creación draft,copia independiente de objetos y exclusión de auditorías/contactos/permisos. Tras éxito confirmado,el formulario valida ID devuelto y abre `/mis-propiedades/ID_NUEVO/editar`;allí siguen Guardar borrador y Guardar cambios/enviar a revisión. No se encadena un envío oculto ni se manda a revisión el ID fuente. CTA y explicación hacen explícita la continuación. Se conserva requisito vigente de al menos una fotografía al guardar desde el editor;el duplicador puede crear draft sin fotos,pero deberá añadirse una antes de guardar/enviar desde editor. No se amplía esa regla de negocio en este sprint.
2. **Tarjeta principal navegable:**enlace extendido a portada,título y área principal sin envolver botones. Publicada habilitada→detalle público;otras→nueva vista privada propia `/mis-propiedades/[id]`. Esta ruta valida UUID,getUser,perfil activo y consulta explícita ID+owner_id bajo RLS;404si ajena;no dirección/contactos privados seleccionados,no acciones de publicar ni compartir,firmas existentes autorizadas y efímeras. Proxy existente ya cubre ruta con cache private/no-store.
3. **Regreso único:**se retira enlace duplicado de editar/page,se conserva cancelar/volver en formulario,además de guardar.
4. **Notificaciones:**COUNT exacto/head de todos los unread propios,separado de lista limit5;helper compartido getUser+user_id+read_atNULL,actualiza sólo read_at. Historial tiene individual/todas;menú individual por clic y todas. Evento local refresca contador;polling previo15s conserva limpieza,inFlight/cola evita solapamiento y descartar refresco durante consulta. Error no fabrica marcado exitoso;botón muestra error y permite reintentar. No nueva suscripción Realtime ni generación de avisos.
5. **Galería:**móvil público una imagen,botones/contador;gestos touchstart/touchend/touchcancel en galería y visor,umbral50px,predominio horizontal1.3,gesto se detiene en extremos;multitouch/taps ignorados. No preventDefault en touch,scrollvertical intacto por diseño. Teclado,modal/foco,botones previos y lazy/eager se conservan.
6. **Fotografías:**ImageUploadProgress compartido muestra por foto Pendiente/Subiendo/Completada/Error;progress indeterminado,sin porcentajes ficticios. Nuevas selecciones/reordenado bloqueados mientras envía y envío bloqueado durante optimización;refsincrónico evita doble envío. Fallo mantiene archivos/formulario,protección existente contra borrar objetos con commit incierto intacta. Completada significa transferencia,NO confirmación de publicación. Errores generales de guardado conservan su aviso.
7. **Admin desde perfil:**perfil del servidor incluye account_status;acceso sólo roleadmin+active,obtenidos de profiles propio,no metadata. Guards reales de todas las páginas/operaciones admin intactos.
8. **Contacto:**mismo formulario montado y handlers,no reinicialización;retraído inicialmente en móvil/tableta/escritorio,clic/Enter/Escape/foco.
9. **Etiquetas:**no sustituidas. covered_area es superficie techada y el modelo no acredita equivalencia técnica con almacenamiento. Ninguna columna renombrada. Pendiente confirmación del negocio para cada superficie;descripciones libres no se reescriben.

### Archivos intervenidos

- Página nueva:app/mis-propiedades/[id]/page.tsx.
- app/mis-propiedades/page.tsx y[id]/editar/{page.tsx,EditarPropiedadForm.tsx};app/publicar/{page.tsx,PublicarForm.tsx};app/perfil/page.tsx;app/notificaciones/page.tsx.
- components/{Header,PropertyImageGallery,ImageUploader,PropertyImageEditor}.tsx;nuevos ImageUploadProgress.tsx yNotificationReadButton.tsx;app/globals.css.
- lib/gallery-swipe.ts ynotification-read.ts nuevos. Sin cambios de lib/property-save-server,precios,RPC/RLS,proxy,base de datos ni configuración remota.
- Pruebas:tests/sprint1-stability.test.mjs nueva,prelaunch-ui,image-editor-race,notification-navigation,profile-property-management,aud002-rls,http-smoke;package.json añade nuevas pruebas al comando por defecto y test:ui.

## Validado localmente

- `npm run lint` PASS;`npm run typecheck` PASS;`npm test` **257PASS,0fallos,0omitidas**.13casos nuevos(11estabilidad+2UI) y fixtures existentes actualizados con las dependencias nuevas de handlers;no supresión de pruebas previas. Hash del editor actualizado por cambios autorizados de handler;precios,validación de campos y APIs mantienen regresiones. No se cambian snapshots para ocultar fallos de negocio.
- `npm run test:rls` con PGlite descartable y datos exclusivamente sintéticos:**110PASS,0fallos/omitidas**. Incluye aislamiento entre usuarios de COUNT/lista5/marcado individual/todas,original intacto al duplicar,nuevoID/fotos/estados,rollback/ACL/roles,catálogo/ficha y moneda/unidad. NO pruebas SQL contra la nube.
- Build producción local PASS(incluye TypeScript),preflight PASS(sin credencial privada en bundle),diff-check PASS. Arranque localhost3110 con configuración STAGING existente leída,sin modificar/copiar variables al repositorio.**32HTTP anónimas PASS**,incluye nueva ruta privada UUIDválido→login,inválido→404,sin firmas y cache private/no-store.
- Prueba visual aislada en127.0.0.1:3119 con componentes reales,proveedor falso y fotosSVG sintéticas,sin red externa:375/768/1280sin overflow.375muestra una foto/contador y botón siguiente cambia1→2;visor2→3,cierre y controles se conservan.768/1280muestran3fotos. Contacto cerrado en los3anchos;abrir/escribir/cerrar/reabrir conserva texto;Escape cierra. Tarjeta→#preview,Editar→#edit,Compartir→#share sin navegación accidental al detalle. Menú:11unread/5recientes,marcaruno→10,todas→0y sin badges falsos. Perfil real SSR:adminactivo con acceso,publisher/adminsuspendido/anónimo sin acceso.
- Captura revisada:../evidence/sprint1-mobile-synthetic.png. Herramientas visuales/work ignoradas,datos sintéticos claramente rotulados. Gesto horizontal/vertical/límites probados en funciones reales con eventos/deltas sintéticos;**no se ejecutó gesto nativo en teléfono físico**. No afirmar Safari/touch físico certificado.
- Fichas/PDF y precios MXN/USD cubiertos por suites existentes(HTML/renderizador/ingesta/formato/cálculo);no nueva descarga de PDF remoto ni modificación de textos libres. Catálogo/filtros conservan contratos previos y pruebas.

### Incidencias del entorno resueltas

Inicialmente el preload de configuración fue reiniciado por el segundo cargador Next;se cambió sólo la herramienta local para heredar configuración validada en un proceso hijo. Turbopack rechazó symlink de node_modules fuera de raíz;se reemplazó sólo el enlace local por copia de las dependencias existentes,sin actualizar versiones ni lockfile. El servidor sintético necesitó permiso local de escucha(EPERM inicial);repetido autorizado. Fixtures visuales ignorados no forman parte del producto ni desactivan su comprobación de tipos. No se atribuyen esos errores a fallos del negocio.

## Pendiente de validar en STAGING

- Aceptación autenticada de punta a punta de duplicar→editar→guardar/enviar con inmueble sintético y verificar original;permiso previo para crear ese fixture. No se usaron las23propiedades reales para mutaciones.
- Notificaciones reales con dos cuentas sintéticas;Admin/noAdmin en navegador,portadas firmadas y ruta privada con sesión real. Aislamiento SQL y UI sintética ya comprobados,no equivale a aceptación remota.
- Gestos en teléfono físico(iOS/Android),scrollvertical,rotación y red lenta/error durante envío real aSTAGING. Sólo herramienta aislada hizo cambios de estado de aviso/fotos.
- Definición de covered_area vs área de almacenamiento;no sustitución automática.
- Si se desea guardar desde editor un draft sin ninguna foto,requiere decisión explícita y propuesta SQL versionada:RPC replace_property_images vigente exige1–7. No se debilita ni salta ese contrato.

## Migraciones,riesgos y reversión

**Migraciones necesarias para este alcance:ninguna.** No cambios RLS/permisos. Las políticas existentes013/046ytrigger read_at cubren el marcado;se validaron en PostgreSQL aislado. No nueva vulnerabilidad alta confirmada por esta auditoría acotada;hallazgos anteriores AUD043/AUD018 siguen su estado,este sprint no los cierra.

Riesgos residuales:sin aceptación remota,gestos físicos sin certificar,firmas efímeras requieren renovación por recarga en preview privado,no actualización en tiempo real entre dispositivos(elpolling conserva15s),COUNTse mantieneanteerrorhasta siguientelectura. Duplicado seguro permanece draft hasta acción explícita del editor y revisión administrativa,no se publica automáticamente.

Plan de reversión:mantener develop8f8871f y versión STAGING124958b intactas. Antes de cualquier entrega futura,commits del sprint en rama separada;si aparece regresión,revertir sólo esos commits y construir una entrega de corrección autorizada,no restaurar/borrar datos ni saltar guards. Sin migración no hay rollbackSQL. No se hizo commit/push/deploy en esta fase.

## Estado de entrega

**Implementado en código:**ocho puntos funcionales con límites anteriores;etiqueta conservada de forma deliberada. **Validado localmente:**257+110+32PASS,lint/tipos/build/preflight,responsive sintético. **PendienteSTAGING:**aceptación autenticada ytouch físico. **Producción:**sin autorización ysin cambios. Sprint listo para revisión/validación deSTAGING,no declarar aceptación final ni sprint integralmente certificado hasta completar esas verificaciones. Detener aquí y solicitar autorización del siguiente paso.
