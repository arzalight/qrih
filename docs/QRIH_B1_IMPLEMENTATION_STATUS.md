# QRIH — Estado de Implementación B1

- **Última actualización:** 2026-11-24
- **Rama / Despliegue STAGING verificado:** `release/staging-nov-2026` · commit `88cefc98ababb2a16455a0e3f6c6a2af6ab52296` · Netlify deploy `6b05b5b7c6d4f75a486f0d90` (`ready`, 50 s)
- **Producción (`dmtvnwsuhehxfftddsap`):** Intacta / fuera de alcance
- **Netlify STAGING (`qrih-staging`):** **Cero secretos** (`SUPABASE_SERVICE_ROLE_KEY` retirada; sólo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

---

## 1. Matriz de estado por etapas

| Etapa | Alcance | Estado | Dictamen | Artefactos creados/modificados | Pruebas ejecutadas |
|---|---|---|---|---|---|
| **Etapa 0** | Revalidación de entorno y baseline | Completada | **GO** | `docs/QRIH_CONTINUITY_BASELINE_2026-11-23.md` | Verificación Git, aislamiento producción |
| **Etapa 1** | Auditoría integral Fase 4.2 (14 archivos) | Completada | **GO** | — | `lint`, `eslint scripts`, `tsc`, `preflight`, `npm test` (343/343), `git-secrets-check` (367 archivos, 0 hallazgos) |
| **Etapa 2** | Consolidación Git local autorizada (sin `push`) | Completada | **GO** | Commit `be326b1` (14 archivos Fase 4.2) | `git-secrets-check` sobre índice real (366 archivos, 0 hallazgos) |
| **Etapa 3** | 3 RPCs SQL (`qrih_admin_metrics_snapshot`, `qrih_submit_demand_request`, `qrih_record_public_property_view`) | **Completada y aplicada en STAGING** (`20261124150507`, `b1_privileged_rpcs`) | **GO (local + STAGING)** | `supabase/migrations/20261123235000_b1_privileged_rpcs.sql`, `tests/b1-rpcs-rls.test.mjs` | PGlite **4/4 PASS** + STAGING real: catálogo `pg_proc` (`SECURITY DEFINER`, `search_path=''`), matriz `EXECUTE`, security advisors sin alertas inesperadas y smoke PostgREST (`401` anon en admin/demand/limit; `200 false` en view). |
| **Etapa 4** | Edge Function `sign-property-images` (`verify_jwt: false` + validación estricta) | **Completada y desplegada en STAGING** (`v1`, `ACTIVE`, `verify_jwt: false`) | **GO (local + STAGING)** | `supabase/config.toml`, `supabase/functions/sign-property-images/core.ts`, `supabase/functions/sign-property-images/index.ts`, `tests/b1-sign-property-images.test.mjs` | Local **6/6 PASS** + STAGING live: `401` apikey/JWT inválido (sin degradar a anon), `403` uniforme/CORS, `400` traversal/TTL, `200 OK` + `HEAD 200 image/webp` en firma real; lote de 5 imágenes (15/15 PASS): **`p50 = 599.33 ms`, `p95 = 1173.15 ms`** (con RTT cliente→US-East). Runtime inyecta `sb_publishable_*` en `SUPABASE_ANON_KEY`. |
| **Etapa 5** | Auditoría y PoC WASM para WebP (GATE OBLIGATORIO) | Completada y validada en **Deno Edge Runtime real de Supabase STAGING** (`b1-webp-wasm-poc`, luego neutralizada `410 Gone` + `verify_jwt: true`) | **GO (ETAPA 6 DESBLOQUEADA)** | PoC ejecutado y retirado en STAGING (`mcyxunymhuxyiwklyfpy`); scripts reproducibles en scratch externo (`@jsquash/webp@1.5.0`, `package.json` intacto) | **12/12 casos PASS** + **8/8 soak warm-isolate `2560×2560` PASS** en `supabase-edge-runtime-1.79.1 (Deno v2.1.4)` (ver sección 2). |
| **Etapa 6** | Edge Function `ingest-verified-media` (2 fases + rollback por `operationId`) | **Completada y desplegada en STAGING** (`v1`, `ACTIVE`, `verify_jwt: false`) | **GO (local + STAGING)** | `supabase/config.toml`, `supabase/functions/ingest-verified-media/{core.ts,index.ts}`, `tests/b1-ingest-verified-media.test.mjs` | Local **4/4 PASS** (default + `@jsquash/webp@1.5.0` WASM real) + STAGING live **7/7 PASS** (`OPTIONS 204`, origen ajeno `403`, `GET 405`, sin `apikey` `401`, sin sesión `401`, `Bearer` público/anon `401`, JWT inválido `401`). |
| **Etapa 7** | Corrección contractual `tests/staging-flows.test.mjs:149` y clasificación de suites | Completada localmente | **GO** | `tests/staging-flows.test.mjs` (`request_id: randomUUID()` por envío, alineado con `app/busco-bodega/page.tsx:75`) | `npm run lint` PASS; ejecución live clasificada como remota/opt-in (ver sección 3) |
| **Etapa 8** | Migración de los 7 call sites en Next.js y retiro de `lib/supabase-privileged-server.ts` | **Completada y desplegada en STAGING** (`88cefc9`) | **GO (local + STAGING)** | Migrados: `app/api/indicadores-publicos/route.ts`, `lib/admin-metrics.ts`, `app/api/requerimientos/route.ts`, `app/bodegas/[slug]/page.tsx`, `lib/property-image-urls.ts`, `lib/verified-media-server.ts`, `app/api/imagenes/route.ts`, `lib/property-save-server.ts`; eliminado `lib/supabase-privileged-server.ts`; nuevo `tests/b1-next-migration.test.mjs` | **0 referencias** a `SUPABASE_SERVICE_ROLE_KEY` o cliente privilegiado en `app/`, `lib/`, `components/`, `proxy.ts`; `lint`, `typecheck`, `npm test` (**358/358 PASS**), `next build` limpio sin secreto y verificación live en `https://qrih-staging.netlify.app`. |
| **Etapa 9** | Auditoría de artefactos comprimidos (`.zip`, `.tar.gz`, `.eszip`, `.gz`, `.br`) | Completada y activa en CI | **GO** | `scripts/artifact-secrets-audit.mjs`, `tests/b1-compressed-artifact-audit.test.mjs` | **2/2 suites PASS** + `npm run preflight` PASS (1,696 archivos post-build, 0 hallazgos). |
| **Etapas 10–12** | Consolidación CI, retiro de `SUPABASE_SERVICE_ROLE_KEY` en Netlify, `git push` y verificación live de STAGING | **COMPLETADAS** (`deploy 6b05b5b7c6d4f75a486f0d90`, `ready`) | **GO (B1 CERRADO EN STAGING)** | `package.json` (358 pruebas en `npm test`); variable `SUPABASE_SERVICE_ROLE_KEY` eliminada en Netlify `qrih-staging`; rama `release/staging-nov-2026` en `88cefc9` | Live en `https://qrih-staging.netlify.app`: `/` (`200`, 12 firmas, `1009 ms` warm), `/inventario` (`200`, 46 firmas, `1294 ms`), `/bodegas/[slug]` (`200`, 14 firmas, `property_views` `182 → 184`, `view_global_hits = 2`), `HEAD` firma `200 image/webp`, `/api/indicadores-publicos` (`200`, `properties: 23`), `/admin` `307 → /login`, `/api/requerimientos` y `/api/imagenes` `401` sin sesión, `noindex, nofollow` global y `0` fugas de secretos. |

---

## 2. Resultados medibles del PoC WASM WebP (Etapa 5 — GO)

### 2.1 Validación en Supabase Deno Edge Runtime real (`mcyxunymhuxyiwklyfpy`)

Desplegado temporalmente como `b1-webp-wasm-poc` (sin acceso a DB, Storage ni `SUPABASE_SERVICE_ROLE_KEY`), ejecutado sobre **`supabase-edge-runtime-1.79.1 (compatible with Deno v2.1.4)` · V8 `11.6.189.12`**, y **neutralizado inmediatamente después** (`v3`, `410 Gone`, `verify_jwt: true`, `401 UNAUTHORIZED_NO_AUTH_HEADER` verificado; eliminación definitiva de la función vacía pendiente de 1 clic en Supabase Dashboard por ausencia de `delete_edge_function` en MCP).

- **Paquete y bundling verificados:** `npm:@jsquash/webp@1.5.0/decode.js` (requiere extensión explícita `.js` porque el paquete carece de `exports` en `package.json`).
- **Carga de `.wasm` sin llamadas externas a CDN:** `import.meta.resolve("npm:@jsquash/webp@1.5.0/codec/dec/webp_dec.wasm")` resuelve localmente a `file:` dentro del bundle (`webp_dec.wasm` = `137.96 KiB`).
- **Cold init WASM (`WebAssembly.compile` + `init`):** **`3.15 – 3.24 ms`**.
- **Polyfill requerido (verificado):** `hadGlobalImageData: false` en Deno Edge Runtime; polyfill mínimo de `globalThis.ImageData` (5 líneas) validado en producción del runtime.

| Caso (Deno Edge Runtime real) | Comprimido | Dimensiones | RGBA | HTTP | Resultado / Capa | `decodeMs` | `totalMs` | `externalMiB` (antes → después) |
|---|---:|---|---:|---:|---|---:|---:|---|
| `1_cold_80x60` | 86 B | 80×60 | 0.02 MiB | `200` | PASS (cold, init 3.24 ms) | 4.27 ms | 8.40 ms | 2.96 → 19.11 |
| `2_warm_80x60` | 86 B | 80×60 | 0.02 MiB | `200` | PASS (cold isolate 2, init 3.15 ms) | 4.33 ms | 8.41 ms | 2.96 → 19.11 |
| `3_hd_1920x1080` | 3.7 KiB | 1920×1080 | 7.91 MiB | `200` | PASS (cold, init 3.23 ms) | 36.64 ms | 40.88 ms | 2.96 → 27.01 |
| `4_alpha_1920x1920` | 6.8 KiB | 1920×1920 | 14.06 MiB | `200` | PASS (warm) | 60.88 ms | 61.08 ms | 27.01 → 48.20 |
| `5_cap_2560x2560` | 11.5 KiB | 2560×2560 | 25.00 MiB | `200` | PASS (warm) | 88.46 ms | 88.71 ms | 48.20 → 69.79 |
| `6_stress_4096x4096` | 29.2 KiB | 4096×4096 | **64.00 MiB** | `200` | PASS (techo arriesgado en ráfaga) | 231.57 ms | 231.88 ms | 19.11 → **144.07** |
| `7_neg_bomb_40mp` (`6400×6400`) | 71.2 KiB | 6400×6400 | ~156 MiB (evitado) | `400` | **RECHAZADO Capa 1** (`DIMENSIONS_EXCEED_LIMIT`) | — | **1.15 ms** | 2.96 → **3.03** |
| `8_neg_fake_png` | 127 B | — | 0 | `400` | **RECHAZADO Capa 1** (`INVALID_RIFF_HEADER`) | — | 0.17 ms | 3.03 → 3.03 |
| `9_neg_fake_html` | 38 B | — | 0 | `400` | **RECHAZADO Capa 1** (`INVALID_RIFF_HEADER`) | — | 0.14 ms | 69.79 → 69.72 |
| `10_neg_truncated` | 76 B | — | 0 | `400` | **RECHAZADO Capa 1** (`TRUNCATED_OR_TRAILING_RIFF`) | — | 0.13 ms | 19.11 → 19.11 |
| `11_neg_animated_vp8x` | 30 B | — | 0 | `400` | **RECHAZADO Capa 1** (`ANIMATED_WEBP_FORBIDDEN`) | — | 0.12 ms | 19.11 → 19.11 |
| `12_neg_corrupt_bitstream` | 3.7 KiB | 1920×1080 | 0 | `400` | **Evasión Capa 1 → RECHAZADO Capa 2 WASM** (`Decoding error`) | — | **5.99 ms** | 3.03 → 19.17 |

- **Prueba de estabilidad warm-isolate (8 iteraciones consecutivas `2560×2560`):** **8/8 `200 OK`**, `decodeMs` warm **`85.71 – 88.40 ms`** (`102.4 – 104.9 ms` cold), `heapUsedMiB` constante **`7.59 – 7.91 MiB`**, `externalMiB` estabilizado por GC de V8 en meseta **`108.11 MiB`** (`58.29 → 83.11 → 108.12 → 108.11 MiB`), sin fugas ni OOM.

### 2.2 Dictamen Etapa 5: **GO** (desbloquea Etapa 6)
1. La arquitectura de **2 capas** (Capa 1 parser estructural RIFF/VP8/VP8L/VP8X sin asignación RGBA + Capa 2 `npm:@jsquash/webp@1.5.0/decode.js` con `webp_dec.wasm` empaquetado localmente) funciona de forma nativa, rápida y estable dentro del **Supabase Deno Edge Runtime real**.
2. El límite de seguridad **`maxDim = 2560` / `maxPixels = 6_553_600` (≤ 25 MiB RGBA)** queda certificado empíricamente (`< 90 ms` decode, meseta estable `~108 MiB` external + `8 MiB` heap), mientras `4096×4096` (`144.07 MiB` external en una sola decodificación) se rechaza deliberadamente en Capa 1.
3. Referencia complementaria: el PoC previo en `Node.js v24.21.0` V8 WASM obtuvo resultados coherentes (`3.63 ms` cold init, `56.37 ms` HD, `83.00 ms` `1920×1920`, `0.18 ms` rechazo de bitstream corrupto).

---

## 3. Clasificación de suites de integración (Etapa 7)

| Suite | Bug / Hallazgo | Clasificación | Ejecutable localmente | Requisitos |
|---|---|---|---|---|
| `tests/staging-flows.test.mjs` | **Corregido** en líneas 149 y 208 (`request_id: randomUUID()` por envío conforme al contrato real de `app/busco-bodega/page.tsx:75`) | Remota / Opt-in | No | `QRIH_LIVE_STAGING_TEST=1`, `NETLIFY`, `QRIH_LIVE_RUN_ID`, `SUPABASE_SERVICE_ROLE_KEY`, STAGING vacío (`properties = 0`) y despliegue vivo |
| `tests/staging-live.test.mjs` | Sin bugs detectados | Remota / Opt-in | No | Igual que `staging-flows` |
| `tests/staging-upload.test.mjs` | Sin bugs detectados | Remota / Opt-in | No | Igual que `staging-flows` |
| `tests/b1-rpcs-rls.test.mjs` | Nueva suite Etapa 3 | Local (PGlite) | **Sí** (4/4 PASS) | `QRIH_PGLITE_MODULE` apuntando a `@electric-sql/pglite/dist/index.js` |
| `tests/b1-sign-property-images.test.mjs` | Nueva suite Etapa 4 | Local (Node 24) | **Sí** (6/6 PASS) | Ninguna dependencia externa |
| `tests/b1-ingest-verified-media.test.mjs` | Nueva suite Etapa 6 | Local (Node 24 + opcional WASM real) | **Sí** (4/4 PASS) | Ninguna dependencia externa (`QRIH_WEBP_DECODE_MODULE` opcional para WASM real) |
| `tests/b1-next-migration.test.mjs` | Nueva suite Etapa 8 | Local (Node 24) | **Sí** (3/3 PASS) | Ninguna dependencia externa |
| `tests/b1-compressed-artifact-audit.test.mjs` | Nueva suite Etapa 9 | Local (Node 24) | **Sí** (2/2 PASS) | Ninguna dependencia externa |

---

## 4. Acciones operativas menores pendientes (sin bloqueo)

1. **Ahorro de créditos Netlify:** Volver a fijar `Build status` en `Stopped` en Netlify Dashboard (`qrih-staging → Project configuration → Build & deploy → Build settings`) hasta el próximo release que desees publicar.
2. **Limpieza opcional de stub PoC (1 clic en Dashboard):** Eliminar permanentemente la función vacía `b1-webp-wasm-poc` (ya neutralizada en `v3` con `verify_jwt: true` y `410 Gone`) desde Supabase Dashboard (`mcyxunymhuxyiwklyfpy → Edge Functions → b1-webp-wasm-poc → Delete`).
3. **Prueba manual con cuenta autenticada en STAGING:** Verificar inicio de sesión, `/admin` (métricas vía `qrih_admin_metrics_snapshot`), alta de requerimiento (`qrih_submit_demand_request`) y carga de imagen/avatar (`ingest-verified-media`) desde el navegador en `https://qrih-staging.netlify.app`.
4. **Rotación posterior de clave local (R-05):** Retirar o rotar la clave JWT `service_role` legada en `.secrets/staging.env` local cuando concluyan las pruebas administrativas opt-in.
