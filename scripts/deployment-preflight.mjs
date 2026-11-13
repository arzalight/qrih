
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import {
  checkLocalStaging,
  STAGING_ORIGIN,
  STAGING_PROJECT_REF,
} from './local-environment.mjs'

const isNetlifyBuild = process.env.QRIH_NETLIFY_BUILD === 'true'

// En local se cargan y validan las variables de .env.local.
// En Netlify se utilizan exclusivamente las variables del entorno del build.
if (!isNetlifyBuild) {
  const require = createRequire(import.meta.url)

  require('@next/env').loadEnvConfig(
    process.cwd(),
    process.env.NODE_ENV !== 'production',
    { info() {}, error() {} },
    true
  )
}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

let failed = false

for (const name of required) {
  const ok = Boolean(process.env[name])
  console.log(`${name}: ${ok ? 'presente' : 'FALTA'}`)
  if (!ok) failed = true
}

function jwtPayload(value) {
  try {
    return JSON.parse(
      Buffer.from(value.split('.')[1], 'base64url').toString()
    )
  } catch {
    return null
  }
}

const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const privateKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// La clave pública debe tener formato válido.
// Para claves JWT también comprobamos que pertenezcan a STAGING.
if (publicKey.startsWith('sb_publishable_')) {
  if (
    publicKey.length <= 'sb_publishable_'.length ||
    /\s/.test(publicKey)
  ) {
    console.error('La clave publicable tiene un formato inválido.')
    failed = true
  }
} else if (publicKey) {
  const payload = jwtPayload(publicKey)

  if (
    payload?.role !== 'anon' ||
    payload?.ref !== STAGING_PROJECT_REF
  ) {
    console.error(
      'La variable pública no contiene una clave anónima válida de STAGING.'
    )
    failed = true
  }
}

// En Netlify sólo comprobamos que la credencial privada esté configurada.
// El build de Next no necesita esta credencial y el wrapper la elimina
// antes de iniciar el proceso hijo.
// En local se mantiene la validación estricta de checkLocalStaging.
if (isNetlifyBuild) {
  console.log(
    'Credencial privada: presencia comprobada; formato reservado para runtime.'
  )
} else {
  const linkedFile = 'supabase/.temp/project-ref'
  const linkedRef = existsSync(linkedFile)
    ? readFileSync(linkedFile, 'utf8').trim()
    : null

  for (const error of checkLocalStaging(process.env, { linkedRef })) {
    console.error(error)
    failed = true
  }
}

// Validación del origen de Supabase.
try {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error()
  }

  if (isNetlifyBuild && url.origin !== STAGING_ORIGIN) {
    throw new Error()
  }
} catch {
  console.error(
    'El origen de Supabase debe ser HTTPS canónico y apuntar a STAGING.'
  )
  failed = true
}

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : [join(dir, entry.name)]
  )
}

if (existsSync('.next/static')) {
  const isMasked = /^\*+/.test(privateKey)

  const leaking = files('.next/static').some(file => {
    const content = readFileSync(file, 'utf8')

    return (
      content.includes('SUPABASE_SERVICE_ROLE_KEY') ||
      (!isMasked && privateKey && content.includes(privateKey))
    )
  })

  console.log(
    `Bundle cliente: ${
      leaking
        ? 'RECHAZADO'
        : 'sin referencia/valor de la credencial privada examinada'
    }`
  )

  failed ||= leaking
} else {
  console.log('Bundle cliente: pendiente de build')
}

console.log(
  'Supabase/Storage/Auth/Netlify activos: NO comprobados por este script.'
)

process.exitCode = failed ? 1 : 0
