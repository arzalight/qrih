# AUD-038 — Resultado incierto tras escritura / limpieza posterior

2026-10-08. **MEDIO / CONFIRMADO Y CORREGIDO LOCAL — SIN OPERACIONES REALES DE DATOS.** IDs PROP-003/005/IMG-002 y riesgo residual AUD-007 conservados. No cambios de RPC, transacción/arquitectura, políticas, campos, Storage, configuración ni dependencias.

**Corte posterior:** integrado en develop4302fef por fast-forward autorizado; build exacto4302fef/preflight/25HTTP anon PASS, entradas167/huella iguales al código6efd78e. Sin pérdida de respuesta/edición/eliminación real provocadas. Documentación posterior aparte, sin push/Netlify/main/producción. [Registro RC](RC_CANDIDATE_2026-10-08.md); afirmaciones de integración/build pendientes inferiores son históricas.

**Versionado autorizado:** `0ca5a698c74f2d077814329ed41dab676dd3e80d`, sólo dos handlers, suite y su adición al comando test. Código final/pruebas del lote en6efd78e;114unit/lint completo/tipos reejecutados PASS. Documentación aparte, sin integración develop/main/push/deploy. Login/panel real inmediato y recarga observados, no escritura ni eliminación real para probar este error.

## Evidencia previa a corrección

Edición/eliminación aseguraban conservación de los datos anteriores al recibir error del RPC. Edición también intentaba eliminar fotos nuevas subidas por el propio handler aunque una pérdida de respuesta no demostrase rollback. Si el RPC sí devolvía éxito pero la limpieza Storage lanzaba excepción, el handler no controlaba ese fallo y podía responder error pese a la escritura ya confirmada.

Dos tests de handlers reales con Supabase ficticio fallaron antes del cambio: edición emite remove(newPath) después de simular commit+respuesta perdida; eliminación responde «se conservan» pese al commit ficticio. **Confirmado el intento/mensaje, no un borrado real de fotos referenciadas ni explotación**: Storage del actor mantiene restricciones RLS y prueba anterior deniega objetos en uso. La ruta normal de UI sube por separado; limpieza de uploadedImages se activa en el modo multipart compatible del handler, también cubierto.

[PostgREST](https://docs.postgrest.org/en/stable/references/transactions.html) documenta commit de una transacción exitosa y rollback de un error de BD. La pérdida de respuesta es otro caso: inferimos que un error de transporte no demuestra cuál sucedió. No se ejecutó SQL para provocar una pérdida real.

## Corrección mínima e impacto

- RPC devuelve error: mensaje constante «no pudimos confirmar… recarga antes de reintentar», sin prometer rollback ni reintento automático; códigos400 existentes preservados.
- RPC lanza excepción:503 con ese mensaje constante, no objeto SDK/datos privados.
- Edición no elimina fotos nuevas después de intentar RPC con resultado incierto. Mantiene limpieza de este intento si un upload falla **antes** de enviar RPC; éxito confirmado sigue limpiando sólo rutas anteriores.
- Limpieza posterior a commit confirmado: error devuelto o excepción producen éxito con warning existente, no falso fracaso. Eliminación conserva log constante sin detalles privados.

**Riesgo residual explícito:** ante cualquier error del RPC de edición se conservan nuevas fotos privadas para conciliar; incluso un rechazo verdadero puede dejar huérfanos. No se implementa limpieza automática/retención/grants como compensación. Posterior inventario READ ONLY y borrado identificado/autorizado siguen AUD-007. No idempotencia nueva ni revocación de firma/objeto en uso eludida.

Archivos: app/api/editar-propiedad/route.ts, app/api/eliminar-propiedad/route.ts, tests/property-write-errors.test.mjs; package.json incorpora suite, sin lock modificado.

## Verificación y límites

**9 tests PASS**: respuesta perdida en ambas rutas; excepciónRPC503/sin reintento; rechazo sin commit/error honesto; negativos de servicio/sesión/ownership; éxito edición/versión/RPC y limpieza anterior; éxito eliminación/ownership/rutasRPC; fallo/throw de limpieza en ambas conserva200+warning; fallo segundo upload pre-RPC limpia sólo primer objeto sintético del intento. Estado de commit simulado/handlers reales, no DB/Storage reales ni prueba de RLS actual.

114unit/lint completo/tipos/build/preflight y25 HTTP compilado localhost sin sesión PASS del lote conjunto anterior.43SQL aisladas conservadas; no deploy. Sandbox bloqueó inicialmente sockets; arranque guardado y HTTP fuera del sandbox pasaron, sin corregir aplicación por ese bloqueo. Última indentación posterior al build, semántica igual; nueva compilación del SHA candidato pendiente. Login legítimo y persistencia inmediata del panel tras recarga ya observados, renovación prolongada/callback positivo pendientes; no contraseña/correo/alta/nuevo actor por agente. Supabase orientó mantener identidad validada/privilegios/RLS y separar errores de transporte de permisos; AUD-018 sigue pausado/NO-GO.
