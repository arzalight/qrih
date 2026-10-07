# AUD-035 — Builds automáticos de staging detenidos

2026-10-06, America/Mexico_City. **ALTO operativo/costos / CORREGIDO — VERIFICADO.** Autorización del usuario «sí, adelante» después de explicar la necesidad de detener los builds de staging para usar GitHub sin publicaciones de desarrollo.

- Único destino: qrih-staging, bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859.
- Cliente SDK oficial con credencial del almacén oficial, sin copiarla/imprimirla. Previo: repo arzalight/qrih, develop y plan Free con recargas/overages off.
- Cambio único PATCH: build_settings.stop_builds = true. Sin nuevo sitio, desconexión de Git, upgrade, cambio de variables, cancelación de despliegues o solicitud de build/deploy.
- GET posterior confirma true. Comparación previa/posterior conserva repo_url, repo_branch, allowed_branches, private_logs, cmd y dir; mismo deploy publicado y SHA f67fa46fd62f0fbbbaba2b243f0e5455dc5083e8. No publicación nueva ni recuperación de créditos.
- Helper operativo con errores/salidas filtrados permanece fuera del repositorio; ningún error SDK crudo o header Authorization registrado. Sin cambio Supabase/main/producción.

Ahora se pueden publicar ramas/commits de desarrollo en GitHub sin el trigger automático de builds de ese sitio. Se debe volver a comprobar stop_builds antes del push, ya que relink/reactivación externa puede cambiarlo. No se hizo push como prueba de esta configuración ni se afirma bloqueo de deploys manuales: éstos siguen prohibidos sin autorización explícita.

Para un RC posterior: autorización nueva del usuario, guards de cuota/Free y SHA, procedimiento de publicación revisado; no reactivar builds por fecha/renovación de créditos. Mantener sitio publicado y datos intactos. [Control oficial de builds](https://docs.netlify.com/build/configure-builds/stop-or-activate-builds/).

AUD-034 es otra corrección, en rama fix/aud-034-local-staging; el cierre de AUD-035 no certifica localhost, respaldo, RC ni Soft Launch. NO-GO externo conservado.
