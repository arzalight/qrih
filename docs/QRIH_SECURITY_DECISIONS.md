# QRIH — Registro de Decisiones Técnicas y de Seguridad (B1)

- **Fecha:** 2026-11-24
- **Rama:** `release/staging-nov-2026`

## SD-01 — Mantener `forbidPrivate: true` sin excepciones en Netlify Builds
- **Decisión:** Nunca debilitar `forbidPrivate: true` en `scripts/deployment-preflight.mjs` ni en `scripts/netlify-next-build.mjs` para sortear el bloqueo de `Specific scopes` en Netlify Free.
- **Justificación:** Mantener `Build status: Stopped` y completar B1 elimina `SUPABASE_SERVICE_ROLE_KEY` de Netlify a costo \$0 y con menor superficie de ataque que pagar por separación de scopes.

## SD-02 — `qrih_record_public_property_view` como RPC PostgreSQL (sin Edge Function)
- **Decisión:** Implementar el registro de vistas públicas mediante `public.qrih_record_public_property_view(uuid)` (`SECURITY DEFINER`, `SET search_path = ''`) con doble límite interno: primero por propiedad (`60 / 15 min`) y segundo global defensivo (`600 / 15 min` vía `view_global`).
- **Justificación:** Evita depender de IP/fingerprint manipulables del navegador, evita consumir cuotas de Edge Functions por bots en `/bodegas/[slug]`, acota el crecimiento de `property_views` a ≤ 2,400 filas/hora y conserva el comportamiento *best-effort* que jamás bloquea la ficha pública.

## SD-03 — `sign-property-images` con `verify_jwt: false` y validación estricta en código
- **Decisión:** Mantener `verify_jwt = false` en `supabase/config.toml` y exigir dentro de `core.ts`: (1) comparación en tiempo constante de `apikey`, (2) rechazo de `SUPABASE_SERVICE_ROLE_KEY` como token entrante, (3) validación obligatoria vía `auth.getUser(token)` para cualquier `Authorization: Bearer` distinto de la clave pública (rechazando con `401` sin degradar a `anon` ante tokens inválidos/expirados/anónimos), (4) autorización exclusiva mediante `qrih_authorized_image_paths`, (5) respuesta `403` uniforme sin oráculo de existencia y (6) CORS por lista blanca estricta (nunca `*`).

## SD-04 — Validación WebP en 2 capas y techo de dimensiones en Edge Functions
- **Decisión (verificada en Deno Edge Runtime real de Supabase STAGING — Etapa 5 GO):** Exigir **Capa 1** (parser estructural RIFF/VP8/VP8L/VP8X sin asignación RGBA, rechazando animación y bombas de descompresión) + **Capa 2** (decodificación completa vía `npm:@jsquash/webp@1.5.0/decode.js` + `webp_dec.wasm` resuelto localmente vía `import.meta.resolve`, con polyfill mínimo de `globalThis.ImageData`). Fijar cota de dimensiones en Edge Function a `maxDim = 2560`, `maxPixels = 6_553_600` (≤ 25 MiB RGBA; medido en Deno Edge Runtime real en `< 90 ms` warm decode y meseta estable de `108 MiB` external bajo 8 iteraciones consecutivas, frente a `144.07 MiB` en un solo `4096×4096`).
- **Resolución propuesta de límites históricos de tamaño (3 / 4 / 5 / 20 MiB) antes de Etapa 6:**
  - Mantener `lib/image-optimizer.ts` cliente en entrada ≤ 20 MiB → salida optimizada ≤ 1920 px y ≤ 3 MiB.
  - Mantener `POST /api/imagenes` en **3 MiB** para `property` y `avatar` (preservando `tests/deferred-auth.test.mjs:200`).
  - En `lib/property-save-server.ts` (`duplicate`), pasar cualquier imagen heredada > 3 MiB o > 1920 px por `sharp.rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 })` antes de invocar `ingest-verified-media`.
  - Fijar en `ingest-verified-media` un límite único y consistente de **3 MiB** para `property-images` y **3 MiB** (o techo 5 MiB si se acuerda alinear con `ProfileAvatarForm` sin optimizador) para `profile-images`.

## SD-05 — Auditoría en memoria de artefactos comprimidos (Etapa 9)
- **Decisión:** Inspeccionar `.zip`, `.tar.gz`, `.tgz`, `.tar`, `.gz`, `.br` y `.eszip` directamente en memoria mediante `node:zlib` y parsers puros sin escribir archivos temporales a disco.
- **Protecciones aplicadas:** Límites de entrada (64 MiB), por entrada descomprimida (16 MiB), total acumulado (64 MiB), entradas máximas (5,000), profundidad máxima (3), razón de compresión máxima (100× para > 64 KiB, protección ZIP bomb), detección de symlinks internos y path traversal.
