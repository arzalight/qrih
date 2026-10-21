# QRIH — Preparación de copia previa a052

20oct2026. **CAPTURA Y SEGUNDA COPIA COMPLETADAS Y VERIFICADAS.** [Recibo independiente](backup-verification-2026-10-20.json).51tablas/66objetos/8.071.288bytes cifrados, retorno Drive idéntico/owner; tres generaciones conservadas. Capturador consumido, NO repetir. [Integración posterior](COMMERCIAL_INTEGRATION_2026-10-20.md):052 ya aplicada una vez, cinco correcciones de moneda autorizadas, no restore ni nuevo deploy aún. La preparación inferior es histórica, no una solicitud vigente de contraseña/captura.

## Antecedente — preparación anterior a la captura

Usuario confirma «Sí, nuevo respaldo cifrado local + Drive»: BD/Auth/fotos de QRIH STAGING `mcyxunymhuxyiwklyfpy`; carpeta privada Drive existente `1r_wDsqI2qRVDvSOaxqCqYN9FL-IFgdzq`. No borrado de generaciones, clave subida, producción ni pagos. La autorización de continuar hasta RC permanece vigente, condicionada a controles posteriores.

## Preparación verificada

- Rama `feature/commercial-sharing-currency`, HEAD `34c003121544d2e4844fbeeeb686a40d647fa699`; develop `7b392d8`, main `55b7737` sin integrar. Código/pruebas `715e42a` ya en GitHub; documentación posterior a este corte no equivale a migración o aceptación cloud.
- Nuevo adaptador privado `capture-staging-20261020.mjs` y control `capture-release-20261020.mjs`, fuera del repo. Derivados por cambios mecánicos de fecha, rama/corte y propósito a052; rutinas de cifrado/TLS/cobertura/lectura/validación conservadas. No se reactivan ni modifican los capturadores anteriores o sus recibos consumidos.
-15tests de autorización/corte/cuota/expiración/one-use/salidas sanitizadas PASS y39checks de pipeline sintético PASS. No red, clave real ni extracción de STAGING en esos ensayos. Clientes PostgreSQL17.11: hashes, firmas y versión de tres binarios PASS.
- Sesión del dashboard QRIH autenticada: proyecto exacto QRIH Staging, región us-west-1, Healthy, última migración051 y organización Free. Aviso global de incidencia investigado: al consultar, referido a reinicios en us-east-2, no evidencia de afectación de QRIH; no promesa de disponibilidad futura. [Estado](https://status.supabase.com/).
- Cuota Supabase observada: egreso0,06/5GB, BD29/500MB, archivos0,01/1GB. Drive observado:11,25/15GB usados, margen suficiente. Metadatos del folder devuelven sólo permiso user:owner. Revalidar si vence el recibo; no pagar ni borrar para liberar espacio.
- Herramientas usan SSL verify-full con CA verificada, conexión fija al pooler STAGING en READ ONLY y entorno limpio; contraseña sólo en prompt PostgreSQL del terminal personal, nunca Node/modelo/argv/env. Clave privada de cifrado sólo leída por age para verificación local, no por el modelo ni subida.
- Captura exige mismo corte de código y metadatos/huellas del origen antes/después. Si cambian datos, esquema, fotos, permisos, cuota o corte: detener y conservar generación incompleta cifrada; no subir ni restaurar. No reintentar por inferencia.

## Paso del usuario

Ejecutar una vez el nuevo adaptador con `--capture` en el terminal personal. Durante la captura no editar/publicar/cargar fotos ni modificar código. PostgreSQL pide contraseña oculta para controles inicial/final y dump; no se guarda. Compartir únicamente `PASS_CAPTURA_LOCAL` o la categoría de detención, sin contraseña, enlaces o datos.

La autorización de un uso caduca a las dos horas de preparar su recibo y la cuota a doce horas. Si caduca sin capturar, renovar únicamente controles/recibo vigente con la misma autorización humana; no ejecutar herramientas antiguas ni ocultar fallos.

## Después

Verificar independientemente el paquete nuevo (hashes, cobertura BD/Auth/fotos y cifrado), subir **sólo su bundle cifrado** una vez al folder privado, comprobar permisos/tamaño/hash mediante readback. La preparación no demuestra captura completa ni segunda copia. El backup lógico no incluye configuración/secretos de proveedores; la [documentación oficial](https://supabase.com/docs/guides/platform/backups) distingue metadatos de Storage de sus bytes, incluidos separadamente por este adaptador.

Sólo entonces preflight nuevo y052 una vez, comparación histórica, aceptación localhost y RC autorizado en Netlify Free. Sin restore/repetir recuperación/AUD040 ni GO por inferencia.
