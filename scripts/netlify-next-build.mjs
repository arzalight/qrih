import { spawnSync } from 'node:child_process'

// La credencial privilegiada se necesita en runtime, no durante next build.
// Turbopack puede almacenar el entorno completo en su caché privada.
const buildEnv = { ...process.env }
delete buildEnv.SUPABASE_SERVICE_ROLE_KEY
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  env: buildEnv,
  stdio: 'inherit',
})
if (result.error) console.error('No se pudo iniciar la compilación de Next.js.')
process.exitCode = result.status ?? 1
