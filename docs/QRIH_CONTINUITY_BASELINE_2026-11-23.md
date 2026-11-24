# QRIH — Línea Base de Continuidad, Consolidación y Plan B1

- **Fecha:** 2026-11-23
- **Proyecto:** QRO Industrial Hub (QRIH) — Entorno STAGING
- **Directorio autorizado:** `/Users/fabianlira/Documents/ChatGPT/QRIH Inmobiliaria industrial/qrih-staging-deploy`
- **Repositorio:** `arzalight/qrih` (`https://github.com/arzalight/qrih.git`)
- **Rama:** `release/staging-nov-2026`
- **HEAD de referencia:** `653b6720cde83bfc868e254877d0dd5d04386c14` (`fix: harden staging deployment preflight`)

---

## 1. Estado de entorno y aislamiento verificado (Etapa 0)

| Parámetro | Valor verificado | Estado |
|---|---|---|
| Directorio activo | `/Users/fabianlira/Documents/ChatGPT/QRIH Inmobiliaria industrial/qrih-staging-deploy` | Verificado (`pwd` = `--show-toplevel`) |
| Repositorio original `qrih` | No accedido ni modificado | Aislado |
| Remoto Git (`origin`) | `https://github.com/arzalight/qrih.git` | Verificado |
| Rama / `HEAD` | `release/staging-nov-2026` / `653b6720cde83bfc868e254877d0dd5d04386c14` | Verificado |
| Índice staged (`git diff --cached --stat`) | Vacío (0 archivos staged) | Verificado |
| Supabase CLI local (`supabase/.temp/project-ref`) | Ausente (sin vínculo CLI accidental) | Verificado |
| Supabase STAGING autorizado | `mcyxunymhuxyiwklyfpy` (`https://mcyxunymhuxyiwklyfpy.supabase.co`) | Fijo en `scripts/local-environment.mjs` |
| Supabase Producción (`dmtvnwsuhehxfftddsap`) | 0 referencias en `app/`, `lib/`, `components/`, `scripts/`, `netlify.toml`, `package.json` (solo usado como fixture negativo en `tests/local-environment.test.mjs`) | Fuera de alcance / intacto |
| Netlify STAGING (`qrih-staging`, `bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`) | `Build status: Stopped`; `SUPABASE_SERVICE_ROLE_KEY` presente en `Builds`/`Functions`/`Runtime` y 5 contextos; `Specific scopes` bloqueado en plan actual | Confirmado por capturas del usuario |

### Diferencias con el estado anterior (cierre de Fase 6)
- **Antes de crear este documento:** Cero modificaciones adicionales respecto a la auditoría de Fase 6 (exactamente los mismos 11 archivos modificados y 3 no rastreados de Fase 4.2, índice staged vacío).
- **Cambio local introducido en Etapa 0:** Creación exclusiva de este archivo (`docs/QRIH_CONTINUITY_BASELINE_2026-11-23.md`). Ninguno de los 14 archivos de Fase 4.2 fue alterado.
- **Nota operativa sobre `docs/STAGING_ISOLATION_DEPLOY_RUNBOOK_2026-11-23.md`:** La sección 3 de ese runbook (redactado en Fase 4.2) asumía retirar el scope `builds` en Netlify antes de compilar con `forbidPrivate: true`. Tras la auditoría de Fase 6 se confirmó que el plan actual de Netlify bloquea `Specific scopes`; en consecuencia, **`Build status` permanece en `Stopped`** y la eliminación de `SUPABASE_SERVICE_ROLE_KEY` en `Builds` se resolverá retirando la variable de Netlify tras completar B1 (sin debilitar `forbidPrivate: true`).

---

## 2. Inventario Git (Fase 4.2 pendiente de consolidación + baseline Etapa 0)

### Archivos modificados de Fase 4.2 (11)
1. `.gitignore` — añade `.secrets/` para impedir seguimiento de credenciales privadas locales.
2. `package.json` — incorpora `tests/local-consolidation.test.mjs` y `tests/staging-security-isolation.test.mjs` al script `npm test`.
3. `scripts/deployment-preflight.mjs` — refactoriza a `runPreflight()`, falla cerrado, evita cargar `.env.local` en Netlify, exige `forbidPrivate: true` en builds de Netlify y ejecuta `auditBuildArtifacts`.
4. `scripts/git-secrets-check.mjs` — añade `\.secrets` a la regla `forbidden` sin debilitar ninguna detección.
5. `scripts/local-environment.mjs` — incorpora `readPrivateStagingSecret` (`0700`/`0600`, `O_NOFOLLOW`, uid), `assertNoPrivateSecretInEnvFiles`, `findPublicSecretContamination`, `checkNetlifyStaging` (`requirePrivate`, `forbidPrivate`) y rechazo de `SUPABASE_SERVICE_ROLE_KEY` heredada del shell.
6. `scripts/local-next.mjs` — mantiene `delete childEnv.SUPABASE_SERVICE_ROLE_KEY` en `build` y ejecuta `auditBuildArtifacts` antes de emitir `.next/qrih-local-stage-build.json`.
7. `scripts/netlify-next-build.mjs` — valida `assertNoPrivateSecretInEnvFiles` y `checkNetlifyStaging(..., { requirePrivate: false, forbidPrivate: true })`, elimina `SUPABASE_SERVICE_ROLE_KEY` del entorno hijo de `next build` y audita `.next/` al terminar.
8. `scripts/provision-local-staging.mjs` — separa el aprovisionamiento en `.env.local` (público `0600`) y `.secrets/staging.env` (privado `0600` en `.secrets/` `0700`) con verificación previa y reversión atómica en fallo.
9. `tests/admin-seo.test.mjs` — construye dinámicamente `credOrigin` con `new URL(...)` para evitar falso positivo de `credential-uri` en `git-secrets-check.mjs`.
10. `tests/local-consolidation.test.mjs` — amplía cobertura de aprovisionamiento separado, no sobrescritura y limpieza en `finally`.
11. `tests/local-environment.test.mjs` — actualiza fixtures a `.env.local` + `.secrets/staging.env` y añade limpieza en `finally`.

### Archivos no rastreados de Fase 4.2 (3)
12. `docs/STAGING_ISOLATION_DEPLOY_RUNBOOK_2026-11-23.md` — runbook de aislamiento, validación y recuperación.
13. `scripts/artifact-secrets-audit.mjs` — auditor de artefactos `.next/` y `.netlify/` (con limitación conocida en archivos comprimidos).
14. `tests/staging-security-isolation.test.mjs` — 8 suites de aislamiento de entorno, permisos, symlinks, preflight, auditoría por patrones y wrapper de Netlify.

### Archivo no rastreado de Etapa 0 (1 — fuera del lote histórico de 14 archivos)
15. `docs/QRIH_CONTINUITY_BASELINE_2026-11-23.md` — este documento de línea base.

---

## 3. Registro de pruebas ejecutadas y pendientes

### Pruebas ejecutadas en Etapa 1 (2026-11-23, sobre este working tree)
| Prueba / Comando | Resultado | Evidencia |
|---|---|---|
| `npm run lint` | **PASS** | Exit 0, 0 warnings (`app`, `components`, `lib`, `tests`, `proxy.ts`) |
| `npx eslint scripts --max-warnings 0` | **PASS** | Exit 0, 0 warnings |
| `npx tsc --noEmit --incremental false` | **PASS** | Exit 0, 0 errores |
| `git diff --check` | **PASS** | Exit 0, 0 hallazgos de formato/espacios |
| `npm run preflight` | **PASS** | Exit 0; configuración local STAGING validada; 1,690 archivos auditados (`next-static=35`, `next-server=966`, `next-other=60`, `netlify-artifacts=629`), 0 secretos detectados |
| `npm test` | **PASS** | Exit 0; **343/343** pruebas aprobadas (0 fallos, 0 omitidas), incluidas las pruebas de aislamiento |
| `scripts/git-secrets-check.mjs` (índice temporal `GIT_INDEX_FILE` con los 14 archivos de Fase 4.2 + baseline) | **PASS** | Exit 0; `scannedIndexFiles: 367`, `findings: []`; índice Git real verificado vacío (`git diff --cached --stat` vacío) |

### Pruebas históricas de referencia (NO re-ejecutadas en esta etapa)
- `npm run build` local (Next.js 16.4.6): aprobada en Fase 5 (no re-ejecutada para no regenerar artefactos innecesariamente).
- `tests/http-smoke.test.mjs` local (`localhost`): 39/39 PASS en Fase 5 (requiere servidor local levantado).

### Pruebas pendientes (dependientes de etapas B1 o autorización remota)
- `npm run test:rls` (requiere `QRIH_PGLITE_MODULE` para validación SQL local en Etapa 3).
- PoC WASM WebP en Deno Edge Runtime (gate obligatorio antes de Etapa 6 `ingest-verified-media`).
- Pruebas HTTP de `sign-property-images` e `ingest-verified-media` (Etapas 4 y 6).
- Suites live opt-in en STAGING: `tests/staging-live.test.mjs`, `tests/staging-flows.test.mjs` (con bug pendiente en línea 149: falta `request_id`), `tests/staging-upload.test.mjs`.
- Validación remota de `https://qrih-staging.netlify.app` sin `SUPABASE_SERVICE_ROLE_KEY` en Netlify (Etapa 11–12).

---

## 4. Registro de riesgos activos

1. **[ALTO] `SUPABASE_SERVICE_ROLE_KEY` en `Builds` y 5 contextos de Netlify Free:** Mitigado temporalmente por `Build status: Stopped` y por el bloqueo fail-closed `forbidPrivate: true`; se resuelve de raíz en B1.
2. **[MEDIO] Auditor de artefactos no descomprime `.zip`, `.tar.gz`, `.eszip`, `.gz`, `.br`:** Cubierto como entregable obligatorio de Etapa 9; mitigado temporalmente prohibiendo `netlify build`/`netlify deploy` locales.
3. **[MEDIO — BLOQUEO ETAPA 6] Validación WebP completa en Deno Edge Runtime:** Requiere PoC WASM medible en Etapa 5 antes de implementar `ingest-verified-media` (considerando memoria RGBA de imágenes de hasta 40 MP ≈ 160 MB).
4. **[MEDIO] Discrepancia histórica de límites de tamaño de imágenes (3, 4, 5 y 20 MiB):** Debe resolverse contractualmente antes de fijar límites definitivos en Etapa 6.
5. **[BAJO-MEDIO] Bug en `tests/staging-flows.test.mjs:149` (falta `request_id`):** Programado para Etapa 7.
6. **[BAJO-MEDIO] Clave JWT `service_role` legada en `.secrets/staging.env` local:** Migración separada posterior a retiro en Netlify, sin revocar hasta confirmar 0 consumidores.

---

## 5. Registro de estado por etapas

| Etapa | Objetivo | Estado | Dictamen | Próximo paso |
|---|---|---|---|---|
| **Etapa 0** | Revalidación de entorno y baseline | Completada | **GO** | — |
| **Etapa 1** | Auditoría integral y pruebas de Fase 4.2 (14 archivos) | Completada | **GO** | — |
| **Etapa 2** | Preparación del punto de control Git (sin `git add`/commit/push) | Completada (preparación lista) | **GO — Pendiente de autorización expresa para ejecutar `git add`/`commit`** | Esperar autorización expresa del usuario antes de modificar el índice o crear el commit |
| **Etapa 3–12** | Implementación local B1 (RPCs, `sign-property-images`, PoC WASM, `ingest-verified-media`, auditor comprimidos, retiro de clave) | Pendiente | Bloqueada hasta completar consolidación autorizada de Etapa 2 | Nota de dependencias locales detectadas: `deno` no instalado, `supabase` CLI no instalada, `QRIH_PGLITE_MODULE` no definida en el entorno |
