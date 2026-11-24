# QRIH STAGING — Guía de Aislamiento de Secretos, Validación y Recuperación

## 1. Entorno autorizado

- **Proyecto Supabase STAGING:** `mcyxunymhuxyiwklyfpy` (`https://mcyxunymhuxyiwklyfpy.supabase.co`).
- **Sitio Netlify STAGING:** `qrih-staging` (`bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`, `https://qrih-staging.netlify.app`).
- **Separación estricta:** las herramientas locales y de preflight rechazan cualquier origen distinto de STAGING, cualquier clave privada en archivos `.env*`, variables heredadas ambiguas, enlaces simbólicos en credenciales y vínculos CLI hacia otros proyectos.

## 2. Separación de credenciales locales

| Archivo | Contenido permitido | Permisos requeridos | En Git |
| --- | --- | --- | --- |
| `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `0600` (archivo regular, sin symlink) | Ignorado |
| `.secrets/` | Directorio exclusivo para secretos locales | `0700` (propietario actual, sin symlink) | Ignorado |
| `.secrets/staging.env` | Únicamente `SUPABASE_SERVICE_ROLE_KEY=...` | `0600` (propietario actual, sin symlink) | Ignorado |

**Reglas permanentes:**
- Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` en `.env*` ni en variables `NEXT_PUBLIC_*`.
- Nunca exportar `SUPABASE_SERVICE_ROLE_KEY` en el shell local al ejecutar `npm run build`, `npm run dev`, `npm run start` o `npm run preflight` (el cargador local rechaza secretos heredados).
- Nunca imprimir valores de credenciales en logs, pruebas o documentación.

## 3. Separación Build vs Runtime y auditoría de artefactos

- **Build local (`npm run build` → `scripts/local-next.mjs build`):**
  1. Verifica que ningún `.env*` contenga secretos privados ni sea symlink.
  2. Carga únicamente variables públicas de `.env.local` (sin cargar `.secrets/staging.env`).
  3. Elimina `SUPABASE_SERVICE_ROLE_KEY` del proceso hijo de `next build`.
  4. Al concluir `next build`, ejecuta `scripts/artifact-secrets-audit.mjs` sobre `.next/` (`.next/static`, `.next/server`, source maps `.map`, manifiestos y caché).
  5. Emite `.next/qrih-local-stage-build.json` (sólo origen + hash SHA-256 de la clave pública, sin secretos).
- **Build Netlify (`netlify.toml` → `scripts/netlify-next-build.mjs`):**
  1. Ejecuta `npm run lint`, `npm run typecheck`, `npm test` y `npm run preflight` antes de compilar.
  2. Valida que no existan `.env*` locales con secretos, que el destino sea exclusivamente STAGING y que **`SUPABASE_SERVICE_ROLE_KEY` esté ausente en el scope `builds`** (`forbidPrivate: true`).
  3. Mantiene `delete buildEnv.SUPABASE_SERVICE_ROLE_KEY` como defensa en profundidad antes de `next build`.
  4. Audita `.next/` al concluir `next build` por patrones (`sb_secret_*`, JWT `service_role`, PEM, asignaciones literales, identificador cliente y symlinks) y repite `npm run preflight`.

### Configuración mínima recomendada en Netlify STAGING (`qrih-staging`)

| Variable | Tipo | Contextos | Scopes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública (`is_secret: false`) | `production` | `builds`, `functions`, `runtime`, `post_processing` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública (`sb_publishable_*`, `is_secret: false`) | `production` | `builds`, `functions`, `runtime`, `post_processing` |
| `SUPABASE_SERVICE_ROLE_KEY` | Privada (`sb_secret_*`, `is_secret: true`) | Sólo `production` | Sólo `functions`, `runtime` (retirar `builds` y contextos `dev`/`preview`) |

> **Orden obligatorio de activación en Fase 6:** antes de disparar un build con `forbidPrivate: true`, retirar el scope `builds` de `SUPABASE_SERVICE_ROLE_KEY` en Netlify (manteniendo `functions` y `runtime` en `production`).

### Migración local de JWT `service_role` legado a `sb_secret_*` dedicada

1. En Supabase STAGING (`mcyxunymhuxyiwklyfpy` → *Project Settings → API Keys*), crear una clave secreta `sb_secret_*` dedicada exclusivamente a desarrollo local (separada de la clave de Netlify STAGING).
2. En terminal personal (nunca en el chat), reemplazar únicamente la línea `SUPABASE_SERVICE_ROLE_KEY=...` dentro de `.secrets/staging.env` conservando permisos `0700` en `.secrets/` y `0600` en `.secrets/staging.env`.
3. Verificar localmente con `npm run preflight`, `npm run start -- --port 3115` y `QRIH_SMOKE_ORIGIN=http://localhost:3115 npm run test:http`.
4. Confirmar que no existan scripts externos ni servicios dependientes del JWT `service_role` legado antes de desactivarlo o revocarlo en Supabase STAGING.
- **Runtime local (`npm run start -- --port 3115` / `npm run dev`):**
  1. Exige certificación vigente de `.next/qrih-local-stage-build.json` (para `start`).
  2. Carga `SUPABASE_SERVICE_ROLE_KEY` exclusivamente desde `.secrets/staging.env`.
  3. Verifica ambas claves contra `https://mcyxunymhuxyiwklyfpy.supabase.co/rest/v1/properties_public?select=id&limit=0` antes de abrir el puerto `localhost`.

## 4. Procedimiento reproducible de validación local

```sh
npm run lint
npx eslint scripts --max-warnings 0
npm run typecheck
npm test
npm run build
npm run preflight
```

Para comprobar el runtime local sin exponer red externa:

```sh
npm run start -- --port 3115
# En otra terminal:
QRIH_SMOKE_ORIGIN=http://localhost:3115 npm run test:http
```

## 5. Procedimiento de recuperación y reversión

### A. Si falla el preflight por secreto en `.env*` o `.netlify/`
1. No desactivar validaciones ni forzar el despliegue.
2. Mover cualquier `SUPABASE_SERVICE_ROLE_KEY` detectada en `.env*` a `.secrets/staging.env` (`chmod 700 .secrets && chmod 600 .secrets/staging.env .env.local`).
3. Si `.netlify/` local contiene artefactos antiguos con `.env.local` incrustado, eliminar `.netlify/` tras confirmación explícita y volver a ejecutar `npm run preflight`.

### B. Si falla o presenta regresión un despliegue en Netlify STAGING
1. Confirmar que los builds automáticos de `qrih-staging` permanecen detenidos (*Build & deploy → Stop builds*).
2. En Netlify (`https://app.netlify.com/projects/qrih-staging/deploys`), seleccionar el último deploy estable verificado (referencia previa al lote: `6ae3a73bacc48837d36d69f1`) y pulsar **Publish deploy** (reversión inmediata sin rebuild ni cambios en Supabase).
3. Verificar `https://qrih-staging.netlify.app/api/indicadores-publicos` y ejecutar `QRIH_SMOKE_ORIGIN=https://qrih-staging.netlify.app npm run test:http`.
4. Si la causa fue un cambio en repositorio, revertir en rama `release/staging-nov-2026` mediante `git revert` (sin operaciones destructivas).
