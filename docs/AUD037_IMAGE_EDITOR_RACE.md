# AUD-037 — Carrera de edición de fotografías durante optimización

2026-10-08. **MEDIO / CONFIRMADO Y CORREGIDO LOCAL — SIN STAGING NETLIFY NI GO EXTERNO.** IDs IMG-001/002 y PROP-002/005 conservados. No nueva funcionalidad/arquitectura, Storage, RLS, SQL, credenciales, cuotas o dependencias.

**Versionado autorizado:** `f55ab65ec3ef1df56421eec847fa64fb417e4f61`, sólo dos componentes, suite y su adición al comando test. Código final/pruebas del lote en6efd78e;114unit/lint completo/tipos reejecutados PASS. Documentación aparte, sin integración develop/main/push/deploy. Login/panel real inmediato y recarga observados, no ensayo UI de esta carrera ni refresh tras caducidad. El build/preflight/humo inferiores son del lote anterior; no nueva compilación del SHA.

## Problema identificado antes de modificar aplicación

ImageUploader y PropertyImageEditor completaban optimizeImage con `[...images, ...optimized]`, usando el array capturado antes del await. Quitar una fotografía, cambiar su título o reordenar mientras la conversión continuaba actualizaba el estado, pero la terminación tardía volvía al snapshot anterior. En publicación podía revivir un preview ya revocado; en edición podía restaurar una foto retirada o la portada previa antes de guardar. No pérdida persistente/incident real demostrado.

Reproducción: handlers reales extraídos por AST del TSX, React/state/Canvas ficticios, optimización pendiente controlada. Seleccionar c → quitar a → titular b → terminar conversión: ambos entregaban a,b,c en vez de b,c. **2/2 regresiones fallaron antes del cambio**; no requests/Storage reales. React confirma que el estado capturado por un handler no cambia tras un setState: [useState](https://react.dev/reference/react/useState).

## Corrección mínima

- Leer imagesRef.current al admitir selección y al reconciliar el resultado; conservar cambios recientes y nuevo orden/portada.
- Ref síncrona selectionInFlight evita un segundo lote en curso, sin depender del siguiente render. Selector/máximo actual siguen iguales.
- Acotar resultado al espacio disponible; liberar sólo previews blob que no se incorporan, no fotos de Storage.
- Al desmontar, cancelar publicación de resultado tardío y liberar previews de este procesamiento. Referencias existentes/URL firmada no se revocan.
- No bloquear edición de títulos/quitar/reordenar durante optimización; esos cambios ahora se conservan.

Archivos: components/ImageUploader.tsx, components/PropertyImageEditor.tsx, tests/image-editor-race.test.mjs; package.json sólo añade la suite al comando test existente, lock/dependencias intactos.

## Pruebas y límites

**14 nuevas PASS**: quitar/titular durante await en ambos, selección simultánea/desbloqueo, máximo7/sin procesar octavo, conversión fallida/reintento, desmontaje/resultados tardíos y liberación exactamente una vez, selección vacía/inválida; orden/portada y ruta existente del editor preservados. Handlers/cleanup reales, estado y conversión simulados: no navegador real, memoria del navegador medida ni edición persistida de una cuenta real.

Tras AUD-037/038: **114 unit PASS** (incluye14 de esta suite y9 AUD-038, no sumarlos de nuevo), lint completo/tipos/build/preflight y25 HTTP localhost sin sesión PASS. 43SQL aisladas del lote anterior conservadas, no nueva migración ni SQL remoto. Hubo bloqueos sandbox de red/localhost; servidor y humo con alcance autorizado fuera del sandbox pasaron sin relajar código/guards. Ajuste final de indentación AUD-038 no cambia semántica; no se afirma SHA RC/artefacto firmado/versionado.

Runtime localhost3107 contra Supabase STAGING fijo permanece activo; login personal y persistencia del panel tras recarga ya observados, sin alta/correo/cambio de contraseña por agente. Prueba real prolongada/callback positivo/validación de RC externo pendientes. Supabase orientó separación actor/RLS/firmas respecto al estado de UI: no usar key privilegiada ni datos reales para fabricar esta prueba. AUD-018 pausado, NO-GO conservado; commit local autorizado no implica integración/push/deploy/producción.
