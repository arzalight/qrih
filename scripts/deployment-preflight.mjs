import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import {
  assertNoPrivateSecretInEnvFiles,
  checkNetlifyStaging,
  loadLocalStaging,
} from './local-environment.mjs'
import { auditBuildArtifacts } from './artifact-secrets-audit.mjs'

export function runPreflight({
  root = process.cwd(),
  env = process.env,
  log = console.log,
  errorLog = console.error,
} = {}) {
  const isNetlifyBuild = env.QRIH_NETLIFY_BUILD === 'true'
  let activeEnv = env

  // Falla cerrado inmediatamente si la configuración de entorno no es válida.
  if (isNetlifyBuild) {
    try {
      assertNoPrivateSecretInEnvFiles(root)
    } catch (error) {
      errorLog(error.message)
      return { ok: false, stage: 'env-files', audit: null }
    }

    const errors = checkNetlifyStaging(env, {
      requirePrivate: false,
      forbidPrivate: true,
    })
    for (const name of [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]) {
      log(`${name}: ${env[name] ? 'presente' : 'FALTA'}`)
    }
    log(
      `SUPABASE_SERVICE_ROLE_KEY (build): ${
        env.SUPABASE_SERVICE_ROLE_KEY
          ? 'PRESENTE (PROHIBIDA EN BUILD)'
          : 'ausente (aislada para runtime)'
      }`
    )
    if (errors.length) {
      for (const message of errors) errorLog(message)
      return { ok: false, stage: 'netlify-env', audit: null }
    }
    log('Configuración Netlify STAGING: validada')
    log('Credencial privada: ausente en build; uso reservado exclusivamente a functions/runtime.')
  } else {
    try {
      const loaded = loadLocalStaging(root, {
        dev: env.NODE_ENV !== 'production',
        requirePrivate: true,
      })
      activeEnv = loaded.env
      log('Configuración local STAGING: validada')
      for (const name of [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ]) {
        log(`${name}: ${activeEnv[name] ? 'presente' : 'FALTA'}`)
      }
    } catch (error) {
      errorLog(error.message)
      return { ok: false, stage: 'local-env', audit: null }
    }
  }

  // Auditoría integral de artefactos generados (.next/static, .next/server, maps, cache y .netlify local).
  const audit = auditBuildArtifacts(root, {
    privateKey: isNetlifyBuild ? '' : activeEnv.SUPABASE_SERVICE_ROLE_KEY || '',
    scanNetlify: !isNetlifyBuild,
  })

  if (!audit.hasNextBuild && audit.areasScanned.length === 0) {
    log('Artefactos de build (.next): pendiente de build')
  } else {
    const summary = audit.areasScanned.map(a => `${a.area}=${a.files}`).join(', ')
    if (audit.ok) {
      log(`Artefactos inspeccionados (${audit.scannedFiles} archivos: ${summary}): sin secretos detectados`)
    } else {
      errorLog(`Artefactos RECHAZADOS (${audit.findings.length} hallazgo(s) en ${summary}):`)
      for (const finding of audit.findings) {
        errorLog(`- [${finding.area}] ${finding.file}: ${finding.rule}`)
      }
    }
  }

  log('Supabase/Storage/Auth/Netlify activos: NO comprobados por este script.')
  return { ok: audit.ok, stage: audit.ok ? 'ok' : 'artifacts', audit }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runPreflight()
  process.exitCode = result.ok ? 0 : 1
}
