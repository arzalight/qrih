import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { mkdirSync, chmodSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadLocalStaging, verifyStagingCredentials, localBuildTag, assertLocalBuild } from './local-environment.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const [command, ...args] = process.argv.slice(2)
try {
  if (!['dev', 'build', 'start'].includes(command)) throw new Error('Comando local no permitido.')
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (command !== 'build' && ['-p', '--port'].includes(arg)) {
      const port = args[++i]
      if (!/^\d+$/.test(port || '') || Number(port) < 1024 || Number(port) > 65535) throw new Error('Puerto local inválido.')
    } else if (command === 'dev' && ['--webpack', '--turbo', '--turbopack'].includes(arg)) {
      continue
    } else {
      // No otros directorios, bind público, inspect o envío de traces con env sensible.
      throw new Error('Opción local no permitida; usa sólo puerto o compilador de desarrollo.')
    }
  }
  const { env } = loadLocalStaging(root, { dev: command === 'dev', requirePrivate: command !== 'build' })
  if (command === 'start') assertLocalBuild(root, env)
  if (command !== 'build') await verifyStagingCredentials(env)
  // Cachés de Next pueden contener entorno privado tras volver a cargar .env.local.
  // Nunca versionar/distribuir .next; restringir también su acceso en este equipo.
  mkdirSync(join(root, '.next'), { recursive: true, mode: 0o700 })
  chmodSync(join(root, '.next'), 0o700)
  // Un build no necesita privilegios; no heredarlos en el proceso compilador.
  const childEnv = { ...env }
  childEnv.NODE_ENV = command === 'dev' ? 'development' : 'production'
  if (command === 'build') delete childEnv.SUPABASE_SERVICE_ROLE_KEY
  const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)),
    command, ...(command === 'build' ? [] : ['--hostname', 'localhost']), ...args],
  { cwd: root, env: childEnv, stdio: 'inherit' })
  child.on('error', () => { console.error('No se pudo iniciar Next local.'); process.exitCode = 1 })
  child.on('exit', code => {
    process.exitCode = code ?? 1
    if (command === 'build' && code === 0) {
      try {
        // Metadatos generados, sin claves: impedir servir un build de otro env.
        writeFileSync(join(root, '.next/qrih-local-stage-build.json'),
          JSON.stringify(localBuildTag(env)), { mode: 0o600 })
      } catch {
        console.error('No se pudo certificar el build local de STAGING.')
        process.exitCode = 1
      }
    }
  })
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
} catch (error) {
  // Sólo errores constantes generados por nuestros controles, sin env/objetos SDK.
  console.error(error.message)
  process.exitCode = 1
}
