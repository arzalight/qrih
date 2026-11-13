// Explicit one-time provisioning, never part of app startup. No source fallback.
import { constants, openSync, closeSync, readFileSync, fstatSync, writeFileSync, lstatSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { checkLocalStaging, verifyStagingCredentials } from './local-environment.mjs'

export const LOCAL_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
export function stagingValues(text) {
  const values = {}
  const allowed = [...LOCAL_KEYS, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (!match || !allowed.includes(match[1]) || Object.hasOwn(values, match[1])) throw Error()
    let value = match[2]
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1)
    // These three inputs are URL/key tokens, not shell expressions or URLs with passwords.
    if (!/^[A-Za-z0-9_./:-]+$/.test(value)) throw Error()
    values[match[1]] = value
  }
  const selected = Object.fromEntries(LOCAL_KEYS.map(key => [key, values[key]]))
  if (checkLocalStaging(selected).length) throw Error()
  if (values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    && values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== selected.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw Error()
  return selected
}

export async function provision(source, root) {
  const destination = join(root, '.env.local')
  // Never replace an existing file/link, or combine it with other local env layers.
  if (['.env', '.env.local', '.env.production', '.env.production.local', '.env.development', '.env.development.local']
    .some(name => existsSync(join(root, name)))) throw Error()
  const ignored = spawnSync('git', ['check-ignore', '-q', '--', '.env.local'], { cwd: root })
  if (ignored.status !== 0) throw Error()
  const descriptor = openSync(source, constants.O_RDONLY | constants.O_NOFOLLOW)
  let values
  try {
    const metadata = fstatSync(descriptor)
    if (!metadata.isFile() || metadata.uid !== process.getuid() || (metadata.mode & 0o777) !== 0o600) throw Error()
    values = stagingValues(readFileSync(descriptor, 'utf8'))
  } finally { closeSync(descriptor) }
  // Opaque publishable keys must be accepted by the fixed STAGING host before persistence.
  await verifyStagingCredentials(values)
  const output = LOCAL_KEYS.map(key => `${key}=${values[key]}`).join('\n') + '\n'
  const target = openSync(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeFileSync(target, output) } finally { closeSync(target) }
  if ((lstatSync(destination).mode & 0o777) !== 0o600 || readFileSync(destination, 'utf8') !== output) throw Error()
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw Error()
    await provision(resolve(process.argv[2]), dirname(dirname(fileURLToPath(import.meta.url))))
    console.log('PASS — configuración STAGING local creada exclusivamente, modo 600 e ignorada por Git; sin mostrar valores.')
  } catch {
    console.error('Configuración no consolidada. No se sobrescribió ningún archivo; revisar origen, permisos y destino sin compartir claves.')
    process.exitCode = 1
  }
}
