# Entrega Git → Netlify staging — 2026-10-04

## Identidad de la entrega comprobada

- Repositorio: https://github.com/arzalight/qrih, **privado**, confirmado en GitHub después de recargar.
- `main`: `55b773756066cd3975b3964dc67f106cf15ead4c`.
- `develop` al conectar: `ee4d465991a0a321ada13ff28e41993364d3253d`.
- Ambos upstream locales configurados; salida `ls-remote` proporcionada por el usuario coincide.
- Netlify existente: `qrih-staging`, ID `bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`.
- Repo enlazado `arzalight/qrih`; rama principal del **sitio de staging**: `develop`.
- Deployment `6ac2be07ce110e3b94a50a2c`, build `6ac2be07ce110e3b94a50a2a`: **READY/publicado**, commit exacto de `develop`, sin error del build. UI mostró publicación 14:59, America/Mexico_City.
- URL: https://qrih-staging.netlify.app. Netlify denomina `production` al contexto principal de este sitio: **no significa producción QRIH**, ni conexión de `main`.

## Restricciones verificadas por panel + API

- `repo_branch=develop`; `allowed_branches=[develop]`: sólo rama principal, sin branch deploys adicionales.
- `skip_prs=true`: Deploy Previews desactivados. UI: «Don’t deploy pull requests».
- `private_logs=true`; repositorio privado. No se añadieron colaboradores ni deploy keys manuales.
- Cuenta/site **Free**, recargas automáticas false y overages false. No se cambió plan, no se contrató servicio ni se afirma saldo actual.
- Variables existentes preservadas; URL pública apunta exclusivamente a `mcyxunymhuxyiwklyfpy`.
- `SUPABASE_SERVICE_ROLE_KEY` permanece secreto en Netlify, con valor sólo en el contexto principal del staging. No se exportó a Git, al workspace ni a este documento.
- No existen flags persistentes `QRIH_LIVE*` de pruebas mutantes. No se ejecutaron nuevas migraciones, cuentas ni uploads durante esta conexión; Supabase actual intacto.

## Verificación del deployment

- Pipeline existente de `netlify.toml`, detectado en `develop`: lint → tipos → 14 unit tests → preflight → wrapper Next → preflight. Build completado; panel: «No exposed secrets detected». No se desactivó detector ni validación TLS.
- **15/15 HTTP sin sesión PASS** (`tests/http-smoke.test.mjs`) contra la URL canónica con este deployment publicado: login/registro 200, admin 307 a login, vistas privadas con aviso, APIs protegidas 401, demanda malformada 400. No se enviaron altas/ediciones válidas.
- Home/inventario 200; nueve JS públicos inspeccionados, cero patrones de clave privada, nombre de variable privada o referencia al Supabase actual.
- `/.env` y `/.next/server/app/page.js`: 404.
- `/_next/cache/`: 308 al normalizar slash; `/_next/cache`: 404. La primera comprobación esperaba 404 inmediato y falló por ese redirect; se verificó explícitamente el destino del mismo origen. No se detectó exposición de caché.
- No se repitió la matriz autenticada mutante. Sus 24 PASS anteriores constan en `deployment-verification-2026-10-04.md` y corresponden a la versión funcional compatible previa.

## Límites / siguiente acción

**NO-GO** para Soft Launch: correo/confirmación, contactos completos, TTL real, UI integral, concurrencia/cold-start y recuperación siguen pendientes. Producción no conectada a `main`.

Esta evidencia se subió después como commit `4efa7cbbc7d19d2ed596c2e8f2855c77489d818b`: usuario confirmó push y panel verificó publicación automática `6ac2c0c2f1aeb800083fcdc6`. Después del ensayo ampliado se restauró Git normal `6ac2c7192fc6c22b218dadef`, mismo commit. Ver `flows-verification-2026-10-04.md`: 42 PASS con límites explícitos y upload nuevo bloqueado; NO-GO sin cambio. El informe ampliado/pruebas/preflight de esta sesión están locales hasta siguiente subida. Mantener secretos en el llavero/proveedor, no copiarlos para sortear limitaciones del agente.
