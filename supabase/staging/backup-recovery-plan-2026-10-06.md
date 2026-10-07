# AUD-018 — Plan de respaldo y recuperación a $0

Fecha: 2026-10-06, America/Mexico_City. **ALTO de operación / EN REVISIÓN — NO CORREGIDO.** Documento de diseño; ningún dump, descarga de archivos o restore realizado en este corte.

## Alcance y evidencia comprobada

El usuario autorizó revisar el respaldo y diseñar recuperación aislada mientras Netlify recupera cuota. No autoriza aún exportar datos sensibles, instalar herramientas, crear proyectos, restaurar servicios activos ni modificar original/main/producción. Primero ensayar con staging; posteriormente se necesitará un respaldo independiente del entorno elegido para el piloto. Un respaldo de staging no protege el original.

Lectura agregada de staging `mcyxunymhuxyiwklyfpy`, mediante transacción READ ONLY y ROLLBACK:

| Elemento | Corte comprobado | Limitación |
|---|---|---|
| PostgreSQL | 17.11; release del proyecto 17.11.0.002 | Elegir cliente PG 17 compatible y stack local compatible con Auth/Storage; no bajar automáticamente de versión. |
| Base | 12,990,131 bytes; 15 tablas public; qrih_private existe | Tamaño físico, no tamaño de dump ni prueba de integridad/restauración. |
| Auth / perfiles | 4 usuarios, 4 identidades, 3 perfiles | No leer hashes, tokens, correos ni datos personales en la conversación. No crear el perfil faltante: conteos distintos no demuestran un defecto. |
| Propiedades / fotos | 1 propiedad, 7 property_images, 7 qrih_verified_uploads | Conteos, no comparación íntegra del grafo. |
| Storage | 7 objetos; 803,872 bytes reportados; 0 tamaños desconocidos | Metadatos, no descarga ni hash nuevo de los bytes. |
| Buckets | property-images privado/WebP/20 MiB; profile-images público/WebP/5 MiB | Conservar configuración y privacidad; no convertir ambos en públicos para recuperar. |
| ACL / historial | 14 políticas Storage; 8 registros de migración | Revisar definiciones/grants, no sólo cantidades; historia remota no coincide necesariamente con timestamps locales. |
| Auth / cifrado | 0 triggers Auth no internos que llaman fuera de auth/storage; 0 secretos Vault | No prueba ausencia de toda personalización o cifrado. Vault vacío no permite descartar requisitos de claves de Auth/MFA sin inventario. |

Extensiones instaladas observadas: pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1. Sin referencias a encrypt/decrypt/pgp_sym, Vault, ltree o btree_gist en app/components/lib/baseline/migraciones revisados. Se consultó el changelog y la advertencia PG 17.11 sobre índices/cifrados; no se ejecutó reindex, cambio de extensión o de claves. Compatibilidad real del destino sigue pendiente.

`baseline-2026-10-03.sql` declara expresamente que no contiene filas/Auth/objetos/configuración. La secuencia profiles_public_id_seq reconstruida empieza en 100001: para recuperar datos existentes hay que conservar y verificar sus contadores reales, no reutilizar ese inicio. Las suites previas baseline+044–050 son pruebas de reconstrucción/fixtures, **no restauración de un respaldo completo**; no se repitieron ni reclasificaron aquí. No se encontró un respaldo completo verificable en los artefactos examinados; no se afirma que el usuario carezca de copias en otro lugar.

## Paquete que debemos obtener, fuera de Git

| Pieza | Contenido obligatorio | Validación de cobertura |
|---|---|---|
| Estructura y permisos | Esquemas de aplicación public y qrih_private, enums, secuencias, constraints/FKs, índices, funciones, triggers, RLS, grants/default privileges y roles propios | Comparar catálogo normalizado de origen/destino; revisar excepciones SECURITY DEFINER y falta de EXECUTE a anon. No sobrescribir roles administrados del proveedor. |
| Datos de aplicación | Todas las tablas de aplicación, incluyendo contactos/autorizaciones, demandas/postulaciones, avisos/auditoría/settings, qrih_verified_uploads y qrih_rate_windows | Comparación local privada por PK/campos y conteos, huérfanos/duplicados y contadores; no limitarse a properties. |
| Auth | Usuarios con UUID originales, identidades, hashes necesarios para login y dependencias de Auth según versión | Son datos altamente sensibles. Exportar cifrado sin mostrarlos; una lista por Auth Admin API no respalda contraseñas/identidades completas. Inventariar MFA/campos cifrados y claves requeridas. Recuperación de sesiones/tokens es decisión de seguridad separada, no prometer sesiones anteriores válidas. |
| Storage | Todos los buckets, configuración, políticas, inventario paginado completo, rutas, propietarios/procedencia, MIME, tamaños y bytes | Archivo por bucket+ruta; SHA-256 de todos los bytes; manifest privado sin URLs firmadas. Incluir profile-images aunque este corte no tenga archivos allí. Detectar huérfanos sin borrarlos. |
| Historial | Esquema/filas supabase_migrations y correspondencia con baseline+044–050, incluyendo versión remota de 050 | Preservar historia real; no ejecutar 001–043 encima del baseline ni reaplicar 044–050 sobre un esquema ya actualizado. |
| Operación | Versión/SHA/lockfile, configuración Auth/redirects/SMTP, esquemas expuestos, buckets, variables necesarias de Netlify y configuración de despliegue | Separar inventario no secreto de valores sensibles. Guardar estos últimos sólo en almacén seguro/cifrado; no copiar credenciales revocadas ni reutilizar llaves productivas en el destino. |

Supabase recomienda exportación y copia externa para Free; el respaldo de base **no contiene los bytes de Storage**. [Backups oficiales](https://supabase.com/docs/guides/platform/backups).

El dump de esquema de la CLI excluye esquemas administrados; no asumir que un único schema.sql contiene las políticas Storage o Auth personalizadas. Verificar el contenido real de cada exportación, capturar personalizaciones aparte y preservar grants: los permisos predeterminados del destino podrían volver a abrir tablas al restaurar. [Referencia CLI](https://supabase.com/docs/reference/cli/supabase-db-dump).

## Secuencia propuesta — no ejecutada

1. **Preparar destino local desechable.** Stack Supabase local/PG 17 compatible, servicios enlazados sólo a loopback, sin SMTP real, webhooks ni conexiones al original. Sin nuevo proyecto cloud/plan/Netlify. Confirmar espacio, versiones, licencias gratuitas aplicables y permiso de instalación antes de instalar. PGlite sirve para fixtures, no acredita recuperación completa de Auth/Storage.
2. **Autorizar origen, custodia y ventana.** Primera exportación exclusivamente staging; UUID del origen fijo y destino local distinto. Elegir carpeta privada fuera del checkout y segunda copia independiente ya disponible a $0. Una carpeta adicional en el mismo disco no es protección contra pérdida del equipo. Acordar ventana sin escrituras/cargas para un corte coherente de BD y archivos; un dump SQL y varias descargas no son un snapshot atómico conjunto. No activar mantenimiento ni suspender cuentas automáticamente.
3. **Exportar con errores filtrados.** Usar mecanismo oficial de dump validado para la versión instalada, exportación de roles propios/esquema/datos/historia y suplemento de personalizaciones administradas. Verificar explícitamente cobertura Auth y qrih_private. No presentar cadenas con contraseña, usar --debug ni volcar excepciones/headers. Credencial mediante almacén o archivo de conexión privado 600 sólo después de autorización; sin secretos en argumentos de comandos copiados al chat. No resetear la contraseña de BD para facilitar este diseño.
4. **Copiar archivos y sellar paquete.** Sólo lectura mediante API Storage autorizada, paginación completa y rutas originales; ningún upload/remove en origen. Comparar inventario antes/después, descargar todo, calcular tamaños/hashes y cifrar con formato autenticado mantenido. Validar descifrado y segunda copia. Hashes solos no son cifrado; ZIP con contraseña no se acepta automáticamente. Manifest/rutas/hashes de contenido sensibles permanecen cifrados, reporte público sólo agregados. Si cambia el origen durante captura, no declarar corte coherente.
5. **Restaurar sólo destino local vacío.** Rechazar cualquier host remoto, mismo origen/destino o destino con datos. Arrancar schemas administrados compatibles, evitar defaults permisivos y restaurar roles propios/esquema/ACL/datos/historia con fallo inmediato y transacciones donde corresponda. Si se deshabilitan triggers durante carga, sólo en la sesión aislada, reactivarlos y validar FKs/efectos faltantes después: triggers deshabilitados no comprueban integridad. No enviar correos ni ejecutar integraciones restauradas. No alterar roles del origen.
6. **Restaurar Storage por API, reconciliar procedencia.** Mantener property-images privado desde su creación y profile-images según configuración autorizada. No insertar/manipular storage.objects mediante SQL como sustituto de subir bytes. Conservar backup de metadatos para reconciliar, pero evitar importarlos ciegamente antes del upload: podrían simular existencia sin bytes o causar conflictos. Los registros de aplicación, UUID/rutas y qrih_verified_uploads deben seguir coincidiendo; un upload privilegiado puede dejar owner_id nulo y requiere comprobar el fallback de procedencia existente de 047. No regenerar rutas/UUID de usuarios ni persistir firmas.
7. **Ejecutar matriz y registrar recuperación.** Una ejecución por lote, evidencia local con errores sin PII/credenciales. Medir duración real y pérdida máxima entre copias; RTO/RPO se proponen después de medir, no prometer cifras sin ensayo. Conservar backup cifrado y destruir únicamente el destino desechable mediante aprobación/target exacto, nunca original/staging activo. Después del ensayo staging, preparar backup del entorno del piloto con autorización específica antes del corte.

La guía oficial distingue datos, personalizaciones administradas e historial; compatibilidad y cifrado del destino se revisan antes de importar. [Restauración CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). [Recuperación en stack local/self-hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform). El stack local se propone sólo para ensayo, no como nueva arquitectura de producción.

## Matriz de aceptación de recuperación

Todos los casos siguientes están **PENDIENTES DE EJECUCIÓN**. Las pruebas de seguridad anteriores no equivalen a ejecución después del restore.

| Caso | Criterio de aprobación |
|---|---|
| Paquete cifrado/copia independiente | Descifrado correcto; tamper/copia truncada rechazados; claves separadas y ninguna PII/clave en Git/log público. |
| Coherencia temporal | Ventana e inventarios documentados; BD/archivos sin cambios incompatibles entre capturas. |
| Esquema completo | Tablas/enums/FKs/índices/secuencias/qrih_private/funciones/triggers e historial corresponden al origen elegido. |
| Datos y relaciones | PK/UUID y campos iguales en comparación privada; todas las tablas cubiertas; cero huérfanos o duplicados nuevos. |
| Secuencias | Próxima inserción sintética local no colisiona con datos recuperados; ningún INSERT de prueba remoto. |
| Auth | Cuentas/identidades/UUID y roles de negocio conservados; login local controlado de cuenta autorizada funciona sin leer su contraseña en el chat. No alta remota adicional. |
| Sesiones/cifrados/MFA | Política de sesiones documentada; datos cifrados utilizables si existen; no reutilizar JWT/SMTP/secretos originales para aprobar el ensayo. |
| ACL/RLS | Anon sin tablas privadas/RPC reservadas; propietario/solicitante/admin según reglas actuales; esquema privado no expuesto. Sin abrir grants para resolver errores. |
| Storage completo | Todos los objetos descargados/restaurados: bytes, SHA-256, MIME y rutas iguales; buckets/privacidad/límites iguales. |
| Procedencia de fotos | storage_path/main_image_path→objeto válido y owner/procedencia correctos; qrih_verified_uploads conservado; máximo 7 y portada en galería. |
| No publicación | draft/pending/rejected/paused/expired y cuenta suspendida sin acceso público según reglas vigentes; pending_update conforme lógica existente, no nueva regla. |
| URL pública antigua / firmas | En bucket privado la antigua URL pública falla; firma autorizada funciona/vence; no firma almacenada en BD. |
| App local recuperada | Inventario/ficha/galería/PDF/edición/notificaciones/contactos y postulación compatible funcionan con datos recuperados y sin abrir contactos privados. |
| Aislamiento / $0 | Origen sin escrituras, no correo real ni webhook, no acceso remoto desde restore, sin gasto/deploy/cambio de plan. |
| RTO/RPO y repetibilidad | Tiempo medido; responsable/frecuencia/retención/custodia acordados; segundo intento aislado reproducible sin usar servicios activos. |

## Prerrequisitos pendientes

- `pg_dump`, `psql` y `docker` no están en PATH; Docker.app no se encontró en /Applications. No demuestra ausencia en otras ubicaciones. No se instaló ni arrancó software.
- CLI instalada: wrapper de `--version`/ayudas falló intentando escribir telemetría fuera de permisos. El binario Go subyacente devuelve 2.119.0, pero su ayuda de db sólo lista diff; no valida el flujo completo db dump del wrapper. Se detuvieron esos intentos; ninguna exportación. Preparar CLI/estado local seguro o cliente PG nativo antes de capturar; no conceder acceso amplio a la carpeta personal como atajo.
- La conexión SQL completa, custodia cifrada, segunda copia y política de sesiones aún no están preparadas/verificadas. No extraer credenciales del proveedor ni pedirlas por conversación.
- Autorización siguiente requerida: preparar entorno local gratuito y exportar **únicamente staging**, cifrado/fuera de Git, para restaurar en el destino local nuevo. La aprobación de este diseño no se interpreta como permiso para exportar/restaurar original.

**Dictamen conservado: NO-GO externo. AUD-018 no se cierra por este documento, los conteos o el baseline.** AUD-031 sigue pendiente de entrega por cuota Netlify; este trabajo no consume publicaciones ni cambia esa condición.
