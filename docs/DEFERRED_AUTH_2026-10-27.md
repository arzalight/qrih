# QRIH — autenticación diferida / 27 octubre 2026

**Dictamen: GO CON CONDICIONES para preparar la validación en STAGING. No aprobación de despliegue ni cierre integral de la funcionalidad.**

## A. Diagnóstico verificado

- Repositorio: `arzalight/qrih`, privado. Base remota consultada: `develop`, commit `ff89d57b49c7b85b892bc069b1798707e22802ae`; árbol `503fe092fd4c6fa6d860c27b135d20f2401ab08c`.
- Rama local: `feature/deferred-auth-forms`. No push, merge, PR ni deploy.
- La carpeta inicial estaba vacía. Git por terminal no tenía credenciales; se recuperaron los 300 archivos de texto con el conector de GitHub y se verificó cada hash de blob. Se reconstruyeron el árbol y el commit exactos de develop, conservando su SHA, como checkout superficial. El icono binario `public/icons/qrih.png` conserva su referencia original en el índice, pero su contenido no está disponible localmente: el conector no devolvió sus bytes. No se reemplazó ni se modificó el icono.
- Next 16.3.6 y dependencias instaladas con `npm ci --ignore-scripts`; se consultaron las guías incluidas de Route Handlers, cookies y useRouter antes de modificar código. No cambios de dependencias productivas ni lockfile.
- `/publicar/page.tsx` ya permitía renderizar el formulario nuevo, pero `PublicarForm` redirigía a login al montar. La duplicación de una propiedad sigue protegida en el servidor.
- `/busco-bodega` ya era público. Su API aceptaba anónimos mediante el cliente privilegiado y guardaba `user_id = null`. Se eliminó esa posibilidad en esta API.
- Publicar insertaba la propiedad desde el navegador, con slug basado en hora; no había una clave estable para reintentos. La edición/duplicación disponen de flujos separados que se conservaron.
- Auth existente: correo/contraseña, `ensureOwnProfile`, callback PKCE y recuperación de contraseña diferenciada. El callback terminaba siempre en Mis propiedades, perdiendo el destino del formulario tras confirmar el correo.
- Imágenes: uploader existente, hasta 7 fotos, originales hasta 20 MiB, transporte optimizado hasta 3 MiB por foto. API de ingestión verificada, comprobación de cuenta activa, decodificación y re-encoding en servidor, procedencia y RPC de galería. Se mantienen las rutas persistentes y el acceso firmado existente.
- Se revisaron `QRIH_AUDIT.md`, los flujos y migraciones relevantes y los reportes Sprint 1. La información histórica no prueba el estado remoto actual. No se reintentó la conexión PostgreSQL de STAGING ni se declara resuelto su fallo de autenticación.

## B. Implementación

| Módulo | Cambio |
| --- | --- |
| `lib/form-draft.ts` | Borradores versionados; campos en localStorage, fotos/File en IndexedDB; caducidad de recuperación de 7 días; descarte; fallback explícito ante cuota/denegación; revisiones para evitar que una escritura antigua sustituya texto reciente. |
| `components/useFormDraft.ts` | Hidratación, guardado automático, captura inmediata del texto y al salir, intención pendiente y UUID estable; vinculación del intento a la cuenta que comienza a enviarlo. |
| `components/DeferredAuthNotice.tsx` | Diálogo nativo accesible, inicio/registro y seguir editando; rutas de retorno constantes. Si la persistencia falla, abre el acceso en otra pestaña para conservar el formulario en memoria. |
| `app/publicar/PublicarForm.tsx` | Acceso y selección local de fotos sin login; validación antes de solicitar cuenta; reserva del registro, fotos secuenciales y finalización autenticada. Recupera el mismo draft del servidor ante un envío parcial. |
| `app/busco-bodega/page.tsx` | Borrador recuperable y autenticación al enviar; UUID estable; bloqueo síncrono contra doble clic; confirmación visible fuera del formulario oculto. El matching opcional no convierte un envío confirmado en un fallo. |
| `lib/property-submission.ts` | Extrae y comparte la proyección/validación original de propiedad entre cliente y servidor; añade rechazo de cantidades inválidas. No reconstruye los campos. |
| `app/api/publicar-propiedad/route.ts` | Valida sesión, cuenta, datos y pertenencia. Reserva una propiedad propia como draft con el UUID del intento; reintentos consultan la misma fila. Finaliza a pending sólo tras verificar la galería esperada. No upsert ni adopción de registros ajenos. |
| `app/api/imagenes/route.ts` | Conserva el flujo anterior para otros usos. La nueva variante con draft_id exige draft propio y posición esperada, y adjunta cada imagen mediante el RPC vigente. No repite automáticamente adjuntos ambiguos. |
| `app/api/requerimientos/route.ts` | Exige sesión no anónima y perfil activo; asigna identidad desde Auth; utiliza la PK como clave de idempotencia y mantiene `status = new`. Reutiliza cuota y escritura privilegiada existentes, filtrando consultas por actor. |
| Login, registro y callback | Conservan `/publicar` o `/busco-bodega` después del acceso/confirmación. Otros destinos del callback mantienen su comportamiento anterior; la recuperación de contraseña conserva su flujo separado. |
| `components/ImageUploader.tsx` | Recupera archivos y títulos locales, recreando/revocando previews también bajo Strict Mode. |
| Pruebas y CSS | Cobertura funcional nueva, actualización de contratos deliberadamente modificados y estilos del diálogo. |

Tras autenticarse se recupera el formulario y se exige confirmación del envío. Es la alternativa segura autorizada: no se publica automáticamente bajo una cuenta distinta en un equipo compartido. Un intento ya vinculado a otra cuenta no se reenvía desde la interfaz; debe iniciarse sesión con ella o descartarse.

Los datos personales no viajan en `next`, ni se guardan contraseñas, tokens o URLs firmadas en el borrador. Es almacenamiento local del navegador, sin cifrado propio. Se informa el límite por navegador/dispositivo y se ofrece descarte para equipos compartidos. La caducidad se comprueba al recuperar; no es un servicio de borrado en segundo plano.

## C. Seguridad y límites

**HECHO VERIFICADO:** no se modificaron SQL, migraciones, RLS, grants, roles, buckets, configuración Auth, variables de aplicación ni secretos. No hubo llamadas de escritura a Supabase o Netlify. La selección de fotos de visitantes no usa Storage ni crea filas remotas.

**AUD-001:** el nuevo retorno del callback acepta exactamente las dos rutas constantes. Login conserva `safeInternalPath`. No se añadieron métodos de autenticación ni se alteró el intercambio PKCE. La configuración de Redirect URLs y el correo real siguen pendientes de aceptación externa.

**AUD-002:** se reutilizan ingestión verificada, procedencia, RPC y rutas privadas existentes; no se introducen URLs públicas ni firmas persistidas. Esto no certifica que el entorno remoto tenga aplicadas las migraciones/configuraciones documentadas ni cierra su auditoría histórica.

**Idempotencia:** el UUID local se utiliza como PK ya existente. Un conflicto no actualiza la fila; sólo puede recuperar una fila del mismo actor. Crear el draft antes de subir fotos permite continuar un envío parcial desde el editor existente. No se necesitan migraciones nuevas para este diseño, según el esquema versionado. Esta conclusión debe contrastarse con el esquema efectivo antes de un despliegue.

**Archivos y ambigüedad:** no se borra un objeto cuando se desconoce si el RPC de adjunto confirmó. La limpieza inmediata sólo procede ante rechazo SQL confirmado y lectura posterior sin referencia. Una interrupción entre Storage y registro de procedencia/galería todavía puede dejar un objeto sin referencia: no existe una transacción conjunta entre Storage y PostgreSQL. La conciliación administrativa de esos casos sigue pendiente; no se promete eliminación automática total. Se prioriza no borrar fotos que podrían haberse confirmado. Los reintentos de un registro ya reservado recuperan su editor y no vuelven a subir toda la galería.

**INFERENCIA:** el contrato versionado permite usar la PK de ambas tablas como clave estable sin cambiar RLS. Las pruebas sintéticas comprueban el comportamiento del código y del SQL aislado; no demuestran permisos, configuración ni conectividad remotos.

## D. Pruebas y evidencias

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: **272 PASS, 0 fallos, 0 omitidas**; suite ampliada con pruebas de autenticación diferida, borradores, sesión caducada y adjuntos ambiguos. Se actualizaron cinco contratos antiguos por cambios deliberados; no se deshabilitaron pruebas.
- `QRIH_PGLITE_MODULE=... npm run test:rls`: **110 PASS**, PostgreSQL temporal, baseline/migraciones y actores sintéticos; cero conexiones a STAGING.
- `scripts/verify-deferred-browser.mjs`: **PASS**, Chromium headless, viewport 390×844, formularios y CSS reales, React/Canvas/IndexedDB reales. Header, Auth, navegación y respuestas HTTP son sustitutos sintéticos. Comprueba selección local sin upload, diálogo con next fijo, recarga de campos/zonas/consentimientos/foto/título, envío autenticado, doble clic, limpieza de ambos borradores, validación HTML, ausencia de errores de navegador y de desbordamiento horizontal. Se inspeccionaron capturas del formulario y del diálogo.
- `npm run build`: **BLOQUEADO** por el guard existente: falta origen válido y clave pública de Supabase STAGING. No se desactivó el control ni se crearon credenciales ficticias para dar el build por aprobado.
- HTTP de Next desplegado y aceptación real en STAGING: **PENDIENTES**. El harness de navegador no sustituye un build de Next ni pruebas contra el servicio real.

Reproducción del navegador: instalar herramientas de prueba fuera del proyecto y proporcionar las rutas de módulo de esbuild y Playwright mediante `QRIH_ESBUILD_MODULE` / `QRIH_PLAYWRIGHT_MODULE`, y el ejecutable local mediante `QRIH_CHROMIUM_EXECUTABLE`; ejecutar `node scripts/verify-deferred-browser.mjs`. Se usaron esbuild 0.25.12, Playwright del runtime y Chromium 153. Las herramientas no se añadieron a las dependencias productivas. Se mantiene la restricción de red local del harness; no carga cuentas ni secretos de la aplicación.

| Caso solicitado | Evidencia local | Validación real |
| --- | --- | --- |
| Visitante nuevo: requerimiento | Formulario, gate, recuperación y envío sintético PASS | PENDIENTE STAGING |
| Visitante nuevo: propiedad con imágenes | IndexedDB/Canvas/recarga/gate y API sintética PASS | PENDIENTE STAGING |
| Registrado que inicia sesión al enviar | Handlers reales con dependencias sintéticas y retorno PASS | PENDIENTE STAGING |
| Sesión activa | API y navegador sintéticos sin gate innecesario PASS | PENDIENTE STAGING |
| Alta y confirmación por correo | Construcción del callback y retorno allowlist PASS | Correo/PKCE reales PENDIENTES |
| Recarga accidental | Texto, zonas, checks y foto/título PASS en Chromium | Safari/iOS/Android PENDIENTES |
| Sesión caducada | 401 entre reserva y foto, sin upload, recuperación de la misma fila PASS | Renovación/caducidad reales PENDIENTES |
| Errores de validación | HTML, rangos, precio, superficie y consentimientos PASS | Aceptación real PENDIENTE |
| Doble clic y reintentos | Bloqueo de UI, concurrencia de API y respuesta perdida PASS | Red/BD reales PENDIENTES |
| Archivo grande o inválido | Límites de API, ingestión y fixtures existentes PASS | Dispositivos/Storage efectivos PENDIENTES |
| Registro de otro usuario | Filtros de actor, ID manipulado y SQL aislado PASS | Dos cuentas reales PENDIENTES |
| Permisos insuficientes | No sesión/anónimo/suspendido y SQL aislado PASS | Roles/configuración reales PENDIENTES |

## Medición propuesta

No se añadió proveedor ni se transmite analítica nueva. Conectar, después de revisar la infraestructura vigente, estos eventos: `form_started`, `form_validated`, `review_submit_clicked`, `auth_opened`, `auth_completed`, `review_submitted` y `form_exit`. Propiedades permitidas: tipo de formulario, versión de flujo y código de resultado constante. Excluir contactos, títulos, direcciones, IDs de publicaciones/usuarios, archivos y contenido del formulario. Un `form_exit` es una señal incompleta de salida, no prueba de abandono definitivo; derivar abandono por ventana de tiempo y no contar usuarios que vuelven a completar.

## E. Siguiente paso y reversión

**GO CON CONDICIONES:** código listo para revisión local. Antes de autorizar STAGING: completar el build mediante el mecanismo de configuración autorizado, confirmar esquema/configuración efectivos y probar el recorrido de ambos formularios con cuenta normal, alta+correo, sesión caducada, fotos y rechazo de acceso ajeno. El estado del fallo de contraseña PostgreSQL continúa PENDIENTE. No cambiarlo ni ejecutar migraciones por suposición.

No se autoriza producción por esta entrega. Reversión: revertir exclusivamente el commit de esta rama; no requiere rollback SQL ni cambios en datos/configuración. No hacer push mientras pueda activar una construcción/despliegue sin autorización.
