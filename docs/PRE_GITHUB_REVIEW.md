# Revisión pre-GitHub — 2026-10-04

Destino autorizado: **arzalight/qrih, privado**. Plan gratuito. No se habilita producción.

## Resultado de revisión previa

- `.env` contiene sólo nombres públicos de Supabase; de cualquier forma queda excluido completo. `.env*` excluidos salvo `.env.example`, que contiene placeholders y la variable privada sin valor.
- No se detectaron claves privadas Supabase, JWT privilegiados, tokens GitHub, llaves privadas ni conexiones con contraseña en el escaneo inicial de 208 archivos (salida sin valores). Es detección por patrones, no garantía absoluta.
- Dependencias, compilaciones/cachés, estado de Netlify y temporales de Supabase quedan fuera: `node_modules`, `.next`, `.netlify`, `supabase/.temp`, `work`, `outputs`, logs y tsbuildinfo.
- Respaldos `.bak*`, `.backup` y `supabase/migration-backup` se conservan localmente, excluidos del repositorio. No se eliminaron archivos.
- No hay PDFs, archivos comprimidos ni dumps en los candidatos revisados. No se excluyen indiscriminadamente futuros PDFs de documentación: los PDF generados deben permanecer en `outputs/` o `work/`.
- `public/icons/qrih.png` (aprox. 1.3 MB) es un recurso intencional, no temporal. Se conserva. El prototipo HTML/JS/CSS legado se conserva como historial, no es el despliegue Next actual.
- Los inventarios JSON y baseline contienen metadatos de estructura, no una exportación de filas de usuarios/propiedades. El baseline no incluye Auth, fotos ni credenciales.
- `next-env.d.ts` es generado por Next y no se publica. El lockfile sí se versiona para instalaciones reproducibles.

## Migraciones: conservar, no volver a ejecutar

Hay **49 archivos activos**: 001–048 y `20261004052754_049_lockdown_function_privileges.sql`. No se renumeran ni modifican. El respaldo alternativo de 016 no es migración activa.

Staging recibió el baseline verificado seguido de 044–049; no ejecutar 001–043 encima. El historial remoto de la fuente termina en 036, aunque el catálogo ya incluye cambios posteriores. Los timestamps remotos y nombres del staging están documentados en `supabase/staging/README.md`. No usar `db push` ciego ni automatizar migraciones desde Netlify. El baseline exige `public` vacío y no sustituye un respaldo de datos/Storage. El Supabase actual no recibió 044–049.

## Control antes de subir

Ejecutar `node scripts/git-secrets-check.mjs` **después de preparar el índice y antes de cada commit/push**. Revisa el contenido del índice, sin imprimir coincidencias sensibles; rechaza archivos excluidos y patrones de secretos. Si detecta algo, detener la subida. No se deshabilita el escaneo de secretos de Netlify.

## Flujo aprobado / estado

1. Git local: **verificado**; commit inicial `55b7737`, ramas `main`/`develop`, trabajando en `develop`. Índice revisado de 159 archivos, cero hallazgos por patrones. Lint, tipos y 14 tests pasan. Identidad sólo local de GitHub (noreply), sin modificar preferencias globales.
2. GitHub: **privado y subido** https://github.com/arzalight/qrih. `main`: `55b773756066cd3975b3964dc67f106cf15ead4c`; `develop` al conectar: `ee4d465991a0a321ada13ff28e41993364d3253d`. GitHub muestra los archivos/privacidad y ambas ramas tienen upstream local. La salida de `ls-remote` aportada por el usuario coincide con los commits esperados.
3. Staging: **conectado sólo a `develop`**, deployment Git `6ac2be07ce110e3b94a50a2c` READY/publicado. Branch deploys adicionales y Deploy Previews desactivados, logs privados. Plan Free, recargas/overages desactivados; variables del staging intactas. Se repitieron 15 HTTP sin sesión y revisión de nueve chunks. Evidencia: `supabase/staging/git-deployment-verification-2026-10-04.md`.
4. Producción: **no conectada**. `main` reservado para después del GO explícito. Crear Git no modifica el dictamen **NO-GO** del Soft Launch.

Acceso: GitHub CLI quedó autorizado por el usuario. El agente no recupera su token del llavero; esto no probaba revocación. El usuario subió correctamente desde su terminal con el helper oficial. Primer envío: HTTP 400, incompleto; siguiente envío: éxito con HTTP/1.1 + `http.postBuffer=8388608` **sólo en ese comando**, sin causa raíz confirmada, sin cambiar globales/HTTPS/credenciales. No hubo force-push. Esta actualización documental se prepara después del deployment y requiere subir un nuevo commit `develop`; no confundirla con el commit ya publicado.

El código de prueba autenticada sigue opt-in de una sola ejecución; no activar sus flags en los despliegues Git normales.
