import { spawnSync } from 'node:child_process'
import { assertNoPrivateSecretInEnvFiles, checkNetlifyStaging } from './local-environment.mjs'
import { auditBuildArtifacts } from './artifact-secrets-audit.mjs'

const root = process.cwd()

try {
  assertNoPrivateSecretInEnvFiles(root)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const envErrors = checkNetlifyStaging(process.env, {
  requirePrivate: false,
  forbidPrivate: true,
})
if (envErrors.length) {
  for (const message of envErrors) console.error(message)
  process.exit(1)
}

// La credencial privilegiada se necesita en runtime, no durante next build.
// Turbopack puede almacenar el entorno completo en su caché privada.
const buildEnv = { ...process.env }
delete buildEnv.SUPABASE_SERVICE_ROLE_KEY

const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  env: buildEnv,
  stdio: 'inherit',
})
if (result.error) {
  console.error('No se pudo iniciar la compilación de Next.js.')
  process.exit(1)
}
if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1)
}

// Inspección inmediata de todos los artefactos de compilación (.next).
const audit = auditBuildArtifacts(root, {
  privateKey: '',
  scanNetlify: false,
})
if (!audit.ok) {
  console.error(`Compilación rechazada: se detectaron ${audit.findings.length} hallazgo(s) de secretos en artefactos.`)
  for (const finding of audit.findings) {
    console.error(`- [${finding.area}] ${finding.file}: ${finding.rule}`)
  }
  process.exit(1)
}

process.exitCode = 0
