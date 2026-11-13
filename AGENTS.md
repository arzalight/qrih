<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:QRIH-project-rules -->

# QRIH — Reglas permanentes del proyecto

## A. Fuente única de verdad

- Repositorio oficial y privado: `arzalight/qrih`. GitHub es la fuente central de sincronización entre Work y la computadora del usuario.
- Directorio local oficial: `/Users/fabianlira/Documents/ChatGPT/QRIH Inmobiliaria industrial/qrih`.
- No crear clones permanentes, proyectos paralelos ni nuevas copias oficiales de QRIH.
- Los directorios temporales de Work en la nube son espacios de ejecución, no versiones oficiales ni sustitutos de la carpeta del Mac.
- Integrar los cambios aprobados mediante GitHub. No asumir que Work en la nube puede modificar directamente los archivos del Mac; verificar y comunicar qué copia se actualizó.

## B. Control de versiones

- `main`: producción. `develop`: integración. `feature/*`: desarrollo.
- Antes de modificar archivos, verificar directorio de ejecución, repositorio/remoto, rama, commit actual y cambios pendientes, incluidos los archivos sin seguimiento.
- Revisar las instrucciones existentes y preservar el bloque autogenerado delimitado por `BEGIN:nextjs-agent-rules` y `END:nextjs-agent-rules`, sin eliminarlo ni alterarlo.
- No sobrescribir trabajo existente ni incorporar archivos pendientes ajenos a la tarea.
- No hacer merges a `main` o `develop` sin autorización explícita.
- No ejecutar operaciones destructivas de Git.

## C. Protección de entornos

- Mantener separados LOCAL, STAGING y PRODUCCIÓN; confirmar el destino antes de cualquier operación sobre un entorno.
- No ejecutar despliegues ni migraciones remotas sin autorización explícita para la operación y el entorno.
- No activar builds de Netlify.
- Antes de publicar cambios que puedan activar automatizaciones, confirmar el estado remoto real de Netlify, incluido que los builds automáticos de `qrih-staging` siguen detenidos. Un registro histórico o `[skip netlify]` no sustituye esa verificación.
- Si no se puede confirmar ese estado, preparar y validar el cambio, pero detenerse antes de publicarlo.

## D. Seguridad

- Preservar Supabase Auth, PostgreSQL y sus políticas RLS, Supabase Storage, roles y permisos, datos privados, estados de moderación y auditorías de seguridad existentes.
- No debilitar controles de autorización para facilitar funcionalidades.
- No exponer secretos ni credenciales en código, commits, documentación, salidas o registros.

## E. Modificaciones de código

Antes de implementar nuevas funcionalidades:

1. Revisar la arquitectura existente y las instrucciones aplicables.
2. Identificar componentes reutilizables.
3. Evaluar riesgos de regresión.
4. Modificar únicamente lo necesario dentro del alcance autorizado.
5. Ejecutar las pruebas pertinentes, revisando previamente sus efectos y respetando las restricciones de la tarea.
6. Documentar resultados y limitaciones.

No reconstruir funcionalidades existentes innecesariamente.

## F. Carpetas y archivos temporales

- No crear nuevas copias permanentes de QRIH.
- Las pruebas deben utilizar directorios temporales controlados y limpiar únicamente sus propios recursos identificados, dentro del alcance autorizado.
- Evitar dejar carpetas residuales fuera del proyecto. Si una prueba requiere escrituras o recursos incompatibles con las restricciones de la tarea, no ejecutarla y comunicar la limitación.
- No eliminar archivos desconocidos sin inspección ni alterar archivos sin seguimiento ajenos a la tarea.

## G. Entregables

Cada tarea debe terminar informando:

- Repositorio y rama.
- Directorio de ejecución.
- Commit inicial y final.
- Archivos modificados.
- Pruebas ejecutadas y sus resultados o limitaciones.
- Cambios pendientes.
- Riesgos identificados.
- Estado de sincronización entre GitHub y la copia local.
- Dictamen: GO, GO CON CONDICIONES o NO-GO, indicando su alcance.

Distinguir expresamente entre HECHO VERIFICADO, INFERENCIA y PENDIENTE. No presentar como actualizado, probado, publicado o sincronizado algo que no se haya verificado.

<!-- END:QRIH-project-rules -->
