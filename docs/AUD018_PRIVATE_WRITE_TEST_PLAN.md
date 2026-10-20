# AUD-018 — siguiente ensayo local: privados y escrituras

Estado: ENSAYO LOCAL COMPLETADO — PASS ACOTADO / ACCESO TEMPORAL CERRADO. Actualizado19oct2026 (CDMX). Código funcional sin cambios.

**Resultado vigente:** [16casos PASS e integridad independiente](aud018-private-write-acceptance-2026-10-19.json), sesión admin-owner legítima. Fixturepending/7asociadas/8objetos conservados, uno sin asociar; ocho WebP/644bytes verificados. Filas previas de17tablas preservadas; sesiones0/refresh0. Listeners3118/3120/3122 cerrados sin detener Rancher/contenedores. Publisher/no-admin HTTP/UIcompleta no inferidos. No pedir otro login ni repetir este gate; quedan aceptación integral/operación/piloto/RCNetlify separado/AUD018NO-GO. Las ventanas y detenciones inferiores son antecedentes.

**Corte vigente:** [resultado y diagnóstico](aud018-private-http-progress-2026-10-19.json). El ensayo16:24:52Z validó panel/admin legítimo y cierre, preservó17tablas y no creó fixture/fotos. Actor admin, no publisher/no-admin HTTP. NextRequest normaliza127a localhost; se corrigió sólo origen/hostname del helper a localhost3120, no el guard de QRIH.18regresiones PASS y preflight401sesión/403ajeno comprobados antes de nueva pantalla. Recargar3118 disponible45min desde16:28:10Z; recibob nuevo, anteriores intactos. Todavía sin aceptación de ingesta/edición/límite7. No repetir restauración/limpieza, AUD018NO-GO.

**Corte vigente19oct:** guard2reglas antes de seis starts, identidad/volúmenes/reglas ajenas conservados;7HTTP4TCP/6namespaces finitos PASS.16huellas app-historial iguales, cuentas4/identidades4/sesiones0/refresh0/propiedad1/galería7/objetos7. [Evidencia](aud018-resume-after-reboot-2026-10-19.json). Acceso http://127.0.0.1:3118/ desde19oct16:20:29Z durante45min; usuario inicia directamente allí para ejecutar el ensayo autorizado. Nuevos recibos fecha19oct sin sobrescribir anteriores. Sin reset/restore/borrado, ensayo autenticado todavía pendiente/AUD018NO-GO. El bloqueo de motor del corte siguiente es histórico y quedó resuelto.

**Corte vigente19oct:** usuario reinició Mac. Motor/socket Rancher no disponibles y sin recibo del ensayo corregido; no se pudo revisar todavía el estado de contenedores/datos. Usuario debe abrir Rancher/esperar motor sin Reset ni borrados. Antes de continuar, verificar identidades/volúmenes/red/guard no persistente y preparar nueva ventana sólo después; no ejecutar recetas de vacío ni restaurar de nuevo. Las disponibilidades3118 de los cortes siguientes son históricas. No pedir credenciales hasta confirmar la nueva pantalla. AUD018 EN REVISIÓN/NO-GO.

**Corte vigente:** usuario confirmó volver a abrir. Guard y conteos READONLY sin datos nuevos;17tests PASS. Helper corregido disponible en http://127.0.0.1:3118/ durante45min desde18oct04:54:14Z, esperando login humano. Mismo alcance, sin repetir todavía escrituras; recibos nuevos sufijob y anteriores intactos. [Reapertura](aud018-private-test-reopen-2026-10-17.json). Bloqueo narrado abajo es histórico y quedó resuelto por autorización, sin bypass. AUD018 EN REVISIÓN/NO-GO.

## Corte vigente tras el intento

La sesión legítima se preparó, pero el ensayo se detuvo al comprobar el panel antes de toda subida/creación. El test esperaba un título distinto al h1 real; además, el relay interpretaba mal respuestas sin body, incluido logout204. Sólo helpers corregidos;17regresiones offline PASS. Recibo original conservado,17tablas previas preservadas, fixture0/fotos0 y conteos independientes de sesiones0/refreshactivos0/propiedad1/Storage7. Refresh negativo posterior no ejecutado: no declararlo PASS por esos conteos. Pantalla anterior cerrada y reapertura bloqueada por control de ejecución ante «no reintentes». Esperar autorización explícita para volver a abrir el mismo ensayo; no bypass/reset/limpieza ni repetir escrituras automáticamente. [Diagnóstico](aud018-private-test-diagnosis-2026-10-17.json). Preparación/URL de la sección siguiente son históricas, no acceso vigente.

El usuario confirmó el alcance propuesto. Se preparó un transporte nuevo y acotado, fuera del repositorio funcional; el relay de sólo lectura anterior no se modificó. Todavía no se ha enviado un login ni ejecutado escrituras de datos de esta fase. AUD-018 sigue ALTO / EN REVISIÓN — NO CORREGIDO; dictamen NO-GO.

## Preparación comprobada — 17 de octubre

Guard/identidades locales activos, 118 archivos de aplicación sin cambios y 58 archivos públicos compilados sin clave privada ni orígenes cloud. Se reutiliza el build aislado recuperado, no el build STAGING. Doce pruebas sintéticas PASS; panel sin sesión rechazado por QRIH original y cuatro mutaciones fuera de alcance rechazadas por la envoltura. Seis comprobaciones agrupadas HTTP/parseo verifican pantalla/script/estado pendiente, origen, CSRF, Host y JWT falso. No es prueba visual de navegador.

Acceso temporal http://127.0.0.1:3118/, desde 18oct04:38:46Z durante 45 minutos. El navegador integrado bloqueó abrirlo; no se evitó esa protección. Usuario abre Safari e introduce credenciales de una cuenta existente en el respaldo. Contraseña, cookies y JWT no se guardan en archivos ni chat; sesión sólo en memoria del servidor durante el ensayo, con cierre al terminar. No pedir de nuevo el permiso del mismo alcance. Si expira, revalidar y preparar otra ventana sin reset/reimportación ni borrar recibos.

Pantalla diagnóstica: automatiza rutas HTTP originales de ingesta/edición y PostgREST con JWT legítimo; no cubre de forma interactiva los formularios de publicación/edición ni todos los actores. Escrituras sólo tras login del usuario. [Evidencia y límites](aud018-private-test-preparation-2026-10-17.json).

## Alcance confirmado por el usuario

Sólo la copia recuperada en los contenedores locales existentes; no STAGING remoto, producción, el conector Supabase de otro proyecto ni Netlify. Sin costos, migraciones, cambios funcionales, commits o push.

Preparar un acceso temporal loopback separado para QRIH y un transporte limitado a las operaciones enumeradas. No convertir el relay público en un proxy general. Revalidar identidad de contenedores, volúmenes, guard y aislamiento antes de abrir acceso. Si Rancher está detenido o cambió el destino, detenerse sin reset, recreación ni reimportación.

Usar una sesión legítima de una cuenta recuperada, introducida por el usuario directamente en la interfaz local; nunca contraseña/JWT en el chat, JWT fabricado ni service_role como sustituto del actor. El login anterior está aprobado como prueba completada: una nueva sesión sólo sería necesaria para este nuevo flujo privado. No crear cuentas externas.

## Datos y efectos permitidos propuestos

- Crear una única propiedad identificada como `PRUEBA LOCAL AUD-018 — NO REAL`, inicialmente borrador, con contenido sintético y propietario autenticado. Conservar su ID para restringir cada edición y envío posterior.
- Subir hasta ocho imágenes sintéticas pequeñas, sin fotografías personales, por la API original. Conservar objetos nuevos y registros de procedencia; no limpiar automáticamente ni sobreescribir objetos recuperados.
- Guardar galería de siete, cambiar portada y editar sólo esa propiedad. Se permite el reemplazo interno de sus filas de `property_images`, no el de la propiedad recuperada previamente.
- Probar el rechazo de una galería de ocho y comprobar que la galería válida anterior sigue intacta. No enviar el formulario normal con más de siete imágenes para provocar limpiezas automáticas; el ensayo negativo debe quedar acotado al guardado de galería y comprobar el error de la aplicación/BD.
- Enviar sólo el fixture a revisión, si las pruebas anteriores pasan. Notificaciones y auditoría derivadas de ese fixture son efectos esperados, deben inventariarse y no borrarse.
- Auth puede crear/cerrar la sesión local nueva y actualizar sus registros operativos. Finalizar con logout local; conservar evidencia sanitizada, no cookies ni tokens.
- La función existente `qrih_take_server_limit` también elimina ventanas de límite de más de un día y crea/incrementa contadores. **Esta purga interna local se incluyó en la confirmación aceptada**, aunque no afecte propiedades ni fotografías. No afirmar que la subida es una operación exclusivamente aditiva.

No modificar cuentas, roles, suspensión, buckets, permisos o políticas. No borrar propiedades, fotografías ni respaldos existentes. Si una ruta intenta una operación fuera de este alcance —incluida limpieza de imágenes tras un fallo— bloquearla y detener el ensayo; no tratar la prueba interrumpida como PASS.

## Evidencia del código revisado

| Archivo | Comportamiento que condiciona el ensayo |
| --- | --- |
| `app/publicar/page.tsx` | Sube imágenes; crea borrador mediante PostgREST; guarda galería con `replace_property_images`; opcionalmente cambia a pending. Ante fallo del insert intenta borrar las imágenes recién subidas. |
| `app/api/imagenes/route.ts` | Exige usuario/cuenta activa, mismo origen y tamaño del formulario; deriva la ruta del usuario y llama a ingesta verificada. No utilizar kind avatar: actualiza perfil y elimina avatar anterior. |
| `lib/verified-media-server.ts` | Valida bytes, recodifica JPEG/PNG/WebP a WebP, genera UUID y ruta por usuario; Storage upload y procedencia servidor. Ante fallo de procedencia intenta eliminar el objeto nuevo. |
| `supabase/migrations/047_verified_media_ingestion.sql` | La cuota media es 50 por ventana de 15 minutos, no siete por propiedad. Incluye purga interna de ventanas antiguas. Sólo se inspeccionó el archivo; no se ejecutó. |
| `supabase/migrations/048_atomic_property_writes.sql` | Límite diferido de siete rutas distintas contando portada y galería; edición atómica sólo owner activo y draft/rejected, con control de updated_at. Sólo se inspeccionó; no se ejecutó. |
| `app/api/editar-propiedad/route.ts` | Rechaza galería fuera de 1–7 antes de guardar. Puede borrar objetos omitidos de la galería; el ensayo conservará todos y bloqueará borrados de Storage. |
| `supabase/migrations/032_block_suspended_account_operations.sql` | `replace_property_images` reemplaza filas de la galería de la propiedad objetivo. Ese reemplazo del fixture es parte de la escritura propuesta, no un ensayo totalmente sin DELETE. |

Una octava subida aislada podría aceptarse correctamente: el límite de siete corresponde a imágenes **asociadas a una propiedad**, no a objetos temporales de la cuenta. No registrar como vulnerabilidad que exista un octavo objeto no asociado. Comprobar tanto frontera API de edición como RPC/constraint de asociación sin inferir una a partir de la otra.

## Matriz de aceptación del lote

| Caso | Evidencia requerida | Estado |
| --- | --- | --- |
| Sesión y Mis propiedades | Sesión real y SSR; sin acceso anónimo a privados | PASS con admin-owner; publisher no inferido |
| Administración | Lectura admin legítima sin elevar roles; rechazo no-admin separado | PASS lectura admin; no-admin NO VERIFICADO sin otra sesión |
| Subidas | WebP/JPEG/PNG recodificados a WebP; hash/tipo/tamaño/procedencia coherentes | PASS; ocho GET/hash/MIME/644bytes independientes |
| Formato falso | Bytes inválidos rechazados sin nuevo objeto/procedencia | PASS |
| Guardado | Borrador sintético y siete fotos asociadas; portada pertenece a galería | PASS |
| Edición y portada | Sólo fixture; recarga y siete rutas conservadas | PASS API original |
| Octava asociación por API | Rechazo sin alterar galería válida ni portada | PASS |
| Octava asociación por RPC | Rechazo con sesión real; siete asociaciones previas intactas | PASS |
| Envío a revisión | Sólo fixture pasa a pending y queda invisible al público | PASS |
| Integridad previa | Preservar hashes de filas previas, no igualdad de tablas completas tras fixtures | PASS17tablas; bytes originales no releídos en este lote |
| Cierre | Logout local/refresh rechazado; deltas/fixtures conservados, accesos cerrados | PASS; sesiones0/refresh0/listeners ausentes |

No afirmar que esta matriz cubre todos los actores/estados HTTP: falta de una sesión admin legítima se registra como NO VERIFICABLE en este lote. No repetir SQL simulado como sustituto de HTTP real. Moderación, suspensión, recuperación de contraseña y renovación natural no están autorizadas ni incluidas aquí.

## Después

Registrar resultados y deltas reales en auditoría/estado maestro; mantener NO-GO hasta cerrar los otros gates. La limpieza de fixtures requiere una autorización posterior con objetivos exactos. Destino piloto/AUD-002 original, aceptación operativa/RPO-RTO/retención/responsable y validación RC en Netlify siguen separados; este plan no los resuelve ni autoriza.
