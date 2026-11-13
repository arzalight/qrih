# Respaldo STAGING y ensayo nuevo — preparación / 27oct2026

## Estado: DETENIDO ANTES DE LA CAPTURA

Actualización posterior a la intervención humana y consolidación local: el verificador devolvió `AUTH_NO_VERIFICADA`. El usuario confirma haber usado la contraseña correcta. Los logs del pooler STAGING mostraron dos rechazos para postgres (10:24:53 y 10:26:20, hora mostrada por el panel), sin prueba concluyente de causa ni bloqueo en esa ventana. No se restableció contraseña ni se intentó conexión directa. El destino de sesión, puerto 5432, usuario postgres.mcyxunymhuxyiwklyfpy y TLS verify-full se conservan. La configuración propia de B ya permite iniciar la aplicación sin A; esto no resuelve la autenticación PostgreSQL ni acredita recuperación. Los apartados inferiores conservan la secuencia histórica de preparación.

El usuario autorizó una nueva copia cifrada de BD, usuarios Auth y fotografías de STAGING, una segunda copia privada en Drive y recuperación en un destino nuevo aislado. **No autorizó migraciones, despliegues, producción ni sobrescribir respaldos.** No se interpretan las autorizaciones de octubre anteriores como controles de ejecución vigentes.

Esta inspección no exportó filas, fotografías ni usuarios; no descifró datos reales, no creó paquetes ni destino, no subió archivos ni cambió permisos. No ejecutó SQL, migraciones, despliegues, reseteos o cambios de contraseña. Las cuatro migraciones de Sprint 3 siguen pendientes.

## Comprobaciones actuales, sin secretos ni datos personales

| Control | Evidencia actual | Resultado |
|---|---|---|
| Único origen permitido | Proyecto Supabase `mcyxunymhuxyiwklyfpy`; HTTPS fijo del mismo proyecto | Identidad esperada fijada |
| Credenciales de aplicación | Guard local y dos consultas de límite cero al origen fijo, sin imprimir claves/cuerpos | PASS para acceso de aplicación, no para PostgreSQL |
| Gestión de proyecto | Metadatos del ID exacto por conector Supabase: permiso denegado | BLOQUEADO; no se intentó otro proyecto ni eludir permisos |
| Dashboard STAGING | Panel autenticado del proyecto exacto muestra QRIH Staging; Session pooler: aws-0-us-west-1.pooler.supabase.com, puerto 5432, base postgres, usuario postgres.mcyxunymhuxyiwklyfpy | PASS de identidad y parámetros vigentes; no se revelaron claves ni cambió contraseña |
| Conexión SQL | Cliente revisado fija esos mismos parámetros, TLS verify-full y transacción read-only; autenticación humana aún pendiente | PENDIENTE; dashboard y código no sustituyen una conexión autenticada real |
| Handoff humano | scripts/check-staging-postgres.mjs fija hash del verificador revisado, limpia entorno y exige terminal interactivo; 44 comprobaciones sintéticas PASS, sintaxis y diff-check PASS | Sin conexión, exportación ni restauración; contraseña sólo en prompt oculto |
| Clientes PostgreSQL | Verificación actual de hashes, firma y versión de psql/pg_dump/pg_restore: tres binarios 17.11 | PASS; sin conexión |
| Herramienta de cifrado | SHA-256 de age coincide con la versión revisada anteriormente | PASS de integridad del ejecutable, no nuevo ensayo de descifrado |
| Acceso local | Directorios de backups/claves: propietario local esperado, modo 700, sin ACL adicional listada; identidad/recipient/CA: 600 | PASS de permisos observados; identidad privada no leída |
| Capacidad local | Aproximadamente 171 GiB disponibles en el volumen de backups | Espacio observado; no reserva ni autorización de gasto |
| Drive | Metadatos actuales de la carpeta existente: folder, una entrada user/owner; ninguna entrada anyone/domain devuelta | Permiso restringido observado; no enlace público creado |
| Drive, alcance pendiente | El conector no devolvió capacidad efectiva canAddChildren ni cuota disponible | PENDIENTE de verificación; no upload para probar a ciegas |
| Motor de destino | Contexto Docker de socket Unix local, sin invocar host remoto; motor no disponible | BLOQUEADO: ningún destino nuevo creado ni aislamiento funcional acreditado |
| Preservación | Bundle cifrado del 20oct conserva SHA-256 histórico | PASS; no sobrescrito ni reutilizado como copia actual |

La clave de aplicación permite comprobar REST/Storage en el origen fijo; **no sustituye contraseña PostgreSQL, permisos de gestión ni prueba de recuperación**. No se leyó una contraseña de BD ni se buscó en almacenes de secretos. El certificado de CA tiene un nombre histórico que contiene «prod»; ese nombre no determina un destino. Sólo sería admisible con host/usuario del proyecto STAGING confirmados y TLS verificado, nunca para conectarse a producción.

## Por qué no se ejecuta el capturador anterior

El adaptador del 20oct está fijado a la rama/commit y controles de cuota, cobertura y autorización de aquel corte. Los controles de uso único son antiguos/consumidos y el código actual es distinto. **No se cambió ni desbloqueó ese adaptador.** Su hash actual se conserva en el recibo de esta inspección.

Antes de una nueva captura hace falta un adaptador/recibo nuevo revisado y probado con datos sintéticos, ligado al proyecto correcto, ventana, cuota, cobertura actual y código vigente. No basta cambiar una fecha o saltar un guard. Tampoco se asume que un dump amplio de schemas cumpla la nueva exclusión de secretos sin revisar tablas/columnas y objetos sensibles.

## Alcance propuesto del respaldo — no ejecutado

### Incluir

- Esquema y filas de aplicación vigentes de STAGING: propiedades, perfiles, imágenes/referencias, requerimientos, contactos, autorizaciones, notificaciones, estadísticas/auditoría y configuración no secreta. Incluir cualquier tabla privada instalada realmente; **no instalar Sprint 3 para respaldarlo**.
- Estructura, funciones/triggers, constraints/FK, índices, RLS, ACL, grants, secuencias, roles propios sin contraseñas e historial real de migraciones. No suponer que baseline equivale a copia de datos.
- Usuarios Auth e identidades necesarias para recuperar las cuentas con los UUID existentes; hashes de contraseña de usuarios únicamente dentro del paquete cifrado. Son datos sensibles de usuarios incluidos en el alcance autorizado, no contraseñas de conexión de la aplicación. Revisar proveedores, dependencias y campos cifrados antes de capturar; cualquier dependencia de secreto externo no resuelta detiene el proceso.
- Inventario completo y bytes de `property-images` y `profile-images`, con bucket, rutas, procedencia, tipo, tamaño y SHA-256 en manifiesto cifrado. El respaldo SQL contiene metadata, **no los bytes de Storage** ([documentación oficial](https://supabase.com/docs/guides/platform/backups)).

### Excluir expresamente

- `.env*`, credenciales de aplicación, claves API/service_role, contraseña de conexión PostgreSQL, JWT signing keys/JWK privados, SMTP, tokens de gestión, credenciales OAuth de aplicación, secretos Vault, contraseñas de roles y cadenas de suscripciones/servidores externos con credenciales.
- Identidad privada de cifrado y cualquier copia de su contenido; no se sube a Drive ni se inserta en manifiesto, logs o Git.
- Sesiones activas, refresh/access tokens y OTP/enlaces de recuperación de un solo uso: se propone omitir sus **datos operativos** del paquete y recrearlos vacíos al recuperar. No se eliminan del origen. Se conservan estructura/dependencias necesarias. No se promete continuidad de sesiones existentes.
- Valores secretos incrustados en definiciones/columnas inesperadas: inventario previo, reglas de exclusión y detección de valores conocidos en memoria. Si no se puede separar un secreto sin romper recuperación, detenerse; no copiarlo por estar cifrado ni omitirlo silenciosamente y declarar backup completo.

La lista definitiva de tablas/columnas/exclusiones y su efecto en Auth deberá sellarse tras la lectura administrativa segura. La exclusión de secretos es un requisito de aceptación, no una garantía ya demostrada. Los límites sobre sesiones se documentarán en el manifiesto para no confundir este backup con una imagen íntegra del proveedor.

## Cifrado, acceso e integridad previstos

1. Ventana coordinada sin escrituras/cargas; no suspender cuentas ni activar mantenimiento por inferencia. Metadata/fingerprints antes y después y consistencia entre BD y objetos. Un cambio detectado invalida el corte.
2. PostgreSQL read-only, TLS verify-full, origen fijado y sin redirecciones; la contraseña sólo la introduce el humano en el prompt oculto del proceso, nunca en chat, argumentos, variables compartidas o archivos de respaldo.
3. Cifrado autenticado con age antes de persistir cualquier dato real. Directorio nuevo exclusivo 700 y archivos 600, fuera de Git; nombres nuevos y apertura exclusiva, sin overwrite. Datos descifrados sólo en memoria o tránsito protegido al destino de recuperación, con límites/tiempos y errores filtrados.
4. Manifiesto sensible cifrado: alcance exacto, exclusiones, fingerprints, cantidades, rutas, tamaños/hashes, versiones y hora del corte. Recibo público local sólo agregado: estados y hashes del ciphertext, sin personas, rutas de fotos o credenciales.
5. Descifrado de prueba mediante age bajo custodia aprobada, sin leer identidad en el agente ni mostrar plaintext. Comparar hashes/tamaños de cada parte y paquete. Un checksum coincidente no sustituye descifrado/restauración.
6. Segunda copia como **archivo nuevo** cifrado en la carpeta privada existente: comprobar permisos completos/capacidad antes de subir, no compartir ni crear enlaces públicos. Verificar metadata, bytes y SHA-256 mediante lectura autenticada posterior. No tocar generaciones anteriores, no subir claves.

## Procedimiento del ensayo nuevo — no ejecutado

1. Habilitar motor local y comprobar primero estado/autoarranque/red de los entornos existentes sin resetearlos. Crear identificador, red y volúmenes **nuevos**; comprobar destino vacío y distinto de todo entorno activo/recuperado. Nunca usar producción ni STAGING vivo como destino.
2. Aislar correo/webhooks, integraciones y salidas hacia servicios remotos. Servicios internos o listeners sólo loopback, credenciales de prueba locales nuevas fuera del backup y sin reutilizar secretos de STAGING/producción. No publicar puertos en red local ni crear proyecto de pago.
3. Restaurar únicamente el estado capturado (no ejecutar las cuatro migraciones nuevas): schemas/datos/roles propios/ACL/historial con versión compatible. Evitar grants permisivos por defaults del destino y comprobar catálogo/RLS después. Revalidar constraints si hubo carga controlada con triggers deshabilitados.
4. Restaurar fotos mediante API del destino, conservando rutas/procedencia y privacidad. No insertar sólo metadata que simule bytes existentes. Verificar todos los hashes/tamaños y relaciones con propiedades/usuarios.
5. Comparar con el snapshot, no con una base viva que puede cambiar: todas las filas/PK/valores, secuencias, FK, funciones, permisos/RLS y objetos. Comprobar privacidad A/B con cuentas sintéticas de ensayo. Cualquier escritura de prueba queda sólo en el destino aislado y se registra aparte.
6. Probar acceso legítimo de usuario con intervención humana segura si hace falta; sesiones antiguas no se reactivan. Galería y PDF deben usar exclusivamente datos/bytes del destino aislado, sin fuga a servicios reales.
7. Medir fases/tiempo total y antigüedad real del corte; reportar RPO/RTO observado, fallos y límites sin prometer cifras antes del ensayo. Conservar backups, destino y evidencia; ninguna limpieza/borrado de volúmenes sin identificar y autorizar su alcance.

## Bloqueos y siguiente intervención

No se puede confirmar aún el conjunto de conexiones/recuperación exigido. Se detuvo la ejecución antes de capturar, siguiendo la condición del usuario.

Se necesita:

1. Dashboard y parámetros confirmados en esta revisión. Falta completar autenticación PostgreSQL en un terminal personal con entrada oculta mediante `node scripts/check-staging-postgres.mjs`. **No enviar claves/contraseñas por chat ni crear tokens globales para sortear un permiso denegado.** El conector de gestión sigue sin acceso; la comprobación del dashboard se hizo con la sesión humana existente. El panel de terminal de Codex fue solicitado, pero no hay un prompt de contraseña ejecutándose todavía.
2. Arranque controlado del motor local después de revisar sus guards/autoarranque existentes; no puede asumirse que un contexto Unix sin motor sea ya un destino aislado recuperable.
3. Confirmación de ventana sin escrituras y capacidad/permisos efectivos de Drive; luego sellar el nuevo capturador y sus pruebas sintéticas antes de extraer.

La autorización de respaldo/ensayo está registrada; falta resolver estos controles, no una autorización de migración o despliegue. **Resultado: preparación documental y comprobaciones parciales completadas; respaldo actualizado y ensayo todavía NO ejecutados.**

El sondeo explícito del socket Unix de Rancher también confirmó motor no disponible. No se inició Rancher ni servicios/volúmenes anteriores. Los recibos históricos de autoarranque desactivado y firewall no acreditan aislamiento actual: el firewall de la VM no persiste al reinicio y debe revisarse antes de arrancar servicios con datos recuperados. Ningún entorno anterior se considera vacío ni se reutilizará como destino nuevo.
