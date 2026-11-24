import {
  constants,
  existsSync,
  readFileSync,
  openSync,
  closeSync,
  fstatSync,
  lstatSync,
} from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'

export const STAGING_PROJECT_REF = 'mcyxunymhuxyiwklyfpy'
export const STAGING_ORIGIN = `https://${STAGING_PROJECT_REF}.supabase.co`

const ENV_FILES_BLOCKED_FOR_SECRETS = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local',
  '.env.test',
  '.env.test.local',
]

let loadedPrivateSecretValue = null

function jwtPayload(value) {
  try {
    if (typeof value !== 'string') return null
    const parts = value.split('.')
    if (parts.length !== 3 || !parts[1]) return null
    return JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    )
  } catch {
    return null
  }
}

function isServiceRoleJwtValue(value) {
  const payload = jwtPayload(value)
  return payload?.role === 'service_role'
}

function isValidCanonicalHttpsUrl(raw) {
  try {
    const url = new URL(raw || '')
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}

function validatePublicKey(publicKey) {
  if (!publicKey) return false
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)) return true
  const payload = jwtPayload(publicKey)
  return payload?.role === 'anon' && payload?.ref === STAGING_PROJECT_REF
}

function validatePrivateKey(privateKey) {
  if (!privateKey) return false
  if (/^sb_secret_[A-Za-z0-9_-]+$/.test(privateKey)) return true
  const payload = jwtPayload(privateKey)
  return payload?.role === 'service_role' && payload?.ref === STAGING_PROJECT_REF
}

function findPublicSecretContamination(env, privateKey = '') {
  const errors = []
  const unmaskedPrivate = privateKey && !/^\*+/.test(privateKey) ? privateKey : ''
  for (const [key, rawValue] of Object.entries(env)) {
    if (!key.startsWith('NEXT_PUBLIC_')) continue
    const value = typeof rawValue === 'string' ? rawValue.trim() : ''
    if (/SERVICE_ROLE|SECRET/i.test(key)) {
      errors.push(`Variable pública prohibida detectada: ${key}.`)
      continue
    }
    if (!value) continue
    if (
      /^sb_secret_[A-Za-z0-9_-]+$/.test(value) ||
      isServiceRoleJwtValue(value) ||
      (unmaskedPrivate && value === unmaskedPrivate)
    ) {
      errors.push(`Una variable NEXT_PUBLIC_* (${key}) contiene una credencial privada.`)
    }
  }
  return errors
}

// Lee exclusivamente el secreto local separado. No acepta enlaces,
// propietarios ajenos, permisos amplios ni variables adicionales.
export function readPrivateStagingSecret(root) {
  const directory = join(root, '.secrets')
  const file = join(directory, 'staging.env')
  let descriptor

  try {
    const dirStat = lstatSync(directory)
    const uid = typeof process.getuid === 'function' ? process.getuid() : null

    if (
      uid === null ||
      !dirStat.isDirectory() ||
      dirStat.uid !== uid ||
      (dirStat.mode & 0o777) !== 0o700
    ) throw new Error()

    descriptor = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW)
    const stat = fstatSync(descriptor)

    if (
      !stat.isFile() ||
      stat.uid !== uid ||
      (stat.mode & 0o777) !== 0o600
    ) throw new Error()

    const content = readFileSync(descriptor, 'utf8')
    const values = {}

    for (const line of content.split(/\r?\n/)) {
      if (!line.trim() || line.trimStart().startsWith('#')) continue

      const match = line.match(
        /^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*([A-Za-z0-9_.-]+)\s*$/
      )

      if (!match || Object.hasOwn(values, 'SUPABASE_SERVICE_ROLE_KEY')) {
        throw new Error()
      }

      values.SUPABASE_SERVICE_ROLE_KEY = match[1]
    }

    if (!values.SUPABASE_SERVICE_ROLE_KEY) throw new Error()

    return values.SUPABASE_SERVICE_ROLE_KEY
  } catch {
    throw new Error(
      'No se pudo leer el secreto local de STAGING. Revisa .secrets/staging.env y sus permisos.'
    )
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

// Impide que Next.js cargue una credencial privada desde sus archivos
// de entorno. El secreto sólo puede proceder de .secrets/staging.env.
export function assertNoPrivateSecretInEnvFiles(root) {
  for (const name of ENV_FILES_BLOCKED_FOR_SECRETS) {
    const file = join(root, name)
    let stat
    try {
      stat = lstatSync(file)
    } catch {
      continue
    }

    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(
        `El archivo de entorno ${name} es un enlace simbólico o tipo inválido y fue rechazado.`
      )
    }

    let descriptor
    let content
    try {
      descriptor = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW)
      content = readFileSync(descriptor, 'utf8')
    } finally {
      if (descriptor !== undefined) closeSync(descriptor)
    }

    if (/^\s*(?:export\s+)?SUPABASE_SERVICE_ROLE_KEY\s*=/m.test(content)) {
      throw new Error(
        `Se detectó una credencial privada en ${name}. Debe trasladarse a .secrets/staging.env antes de iniciar Next.js.`
      )
    }

    if (/^\s*(?:export\s+)?NEXT_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET)[A-Z0-9_]*\s*=/m.test(content)) {
      throw new Error(
        `Se detectó una variable NEXT_PUBLIC_* prohibida en ${name}.`
      )
    }

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      let val = trimmed.slice(eq + 1).trim()
      if (/^(["']).*\1$/.test(val)) val = val.slice(1, -1)
      if (/^sb_secret_[A-Za-z0-9_-]+$/.test(val) || isServiceRoleJwtValue(val)) {
        throw new Error(
          `Se detectó un valor de credencial privada dentro de ${name}. Debe residir únicamente en .secrets/staging.env.`
        )
      }
    }
  }
}

// Sólo lectura local. Nunca interpolar valores privados en diagnósticos.
export function checkLocalStaging(
  env,
  { requirePrivate = true, linkedRef = null } = {}
) {
  const errors = []

  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || '')

    if (
      url.origin !== STAGING_ORIGIN ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      errors.push(
        'El desarrollo local debe apuntar exclusivamente a Supabase STAGING.'
      )
    }
  } catch {
    errors.push('Falta un origen válido de Supabase STAGING.')
  }

  const publicKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!validatePublicKey(publicKey)) {
    errors.push('Falta una clave pública de STAGING válida.')
  }

  const privateKey = env.SUPABASE_SERVICE_ROLE_KEY || ''
  if ((requirePrivate || privateKey) && !validatePrivateKey(privateKey)) {
    errors.push(
      'Falta una clave privada de STAGING válida; introdúcela sólo en el archivo local.'
    )
  }

  if (publicKey && privateKey && publicKey === privateKey) {
    errors.push('La clave pública y la clave privada no pueden ser idénticas.')
  }

  errors.push(...findPublicSecretContamination(env, privateKey))

  if (env.SITE_ID || env.NETLIFY === 'true') {
    errors.push(
      'El control de desarrollo local no debe ejecutarse como Netlify.'
    )
  }

  if (linkedRef && linkedRef !== STAGING_PROJECT_REF) {
    errors.push(
      'La CLI local está vinculada a otro proyecto; no usar comandos --linked.'
    )
  }

  return errors
}

// Validación estricta para entorno Netlify STAGING (build y preflight).
// Conserva compatibilidad con requirePrivate=true por defecto; el build de Netlify
// invoca explícitamente { requirePrivate: false, forbidPrivate: true }.
export function checkNetlifyStaging(
  env,
  { requirePrivate = true, forbidPrivate = false } = {}
) {
  const errors = []

  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || '')
    if (
      url.origin !== STAGING_ORIGIN ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      errors.push(
        'El origen de Supabase en Netlify STAGING debe ser HTTPS canónico y apuntar exclusivamente al proyecto autorizado.'
      )
    }
  } catch {
    errors.push('Falta un origen válido de Supabase STAGING en Netlify.')
  }

  const publicKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!validatePublicKey(publicKey)) {
    errors.push('La variable pública no contiene una clave anónima válida de STAGING.')
  }

  const privateKey = env.SUPABASE_SERVICE_ROLE_KEY || ''
  const isMasked = /^\*+/.test(privateKey)
  if (forbidPrivate) {
    if (privateKey) {
      errors.push(
        'SUPABASE_SERVICE_ROLE_KEY no debe estar presente en el scope builds de Netlify; restríngela a functions y runtime.'
      )
    }
  } else if (requirePrivate && !privateKey) {
    errors.push('Falta SUPABASE_SERVICE_ROLE_KEY en la configuración de Netlify STAGING.')
  } else if (privateKey && !isMasked) {
    if (!validatePrivateKey(privateKey)) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY no corresponde a una credencial privada válida de STAGING.')
    }
    if (publicKey && publicKey === privateKey) {
      errors.push('La clave pública y la clave privada en Netlify están cruzadas o son idénticas.')
    }
  }

  errors.push(...findPublicSecretContamination(env, privateKey))

  if (env.URL && !isValidCanonicalHttpsUrl(env.URL)) {
    errors.push('La variable URL de Netlify debe ser un origen HTTPS canónico sin ruta ni credenciales.')
  }

  if (env.QRIH_INDEXING_ENABLED === 'true') {
    errors.push('QRIH_INDEXING_ENABLED no debe estar habilitado en STAGING.')
  }

  return errors
}

export function loadLocalStaging(
  root,
  { dev = true, requirePrivate = true } = {}
) {
  // Primero bloquea secretos o symlinks en archivos que Next.js podría cargar.
  assertNoPrivateSecretInEnvFiles(root)

  // Bloquea credencial privada heredada del shell en modo local (configuración ambigua).
  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    (!requirePrivate || process.env.SUPABASE_SERVICE_ROLE_KEY !== loadedPrivateSecretValue)
  ) {
    throw new Error(
      'Se detectó SUPABASE_SERVICE_ROLE_KEY heredada en el entorno del shell. En local sólo puede cargarse desde .secrets/staging.env.'
    )
  }

  // Mismo cargador/orden que el Next instalado.
  const require = createRequire(import.meta.url)
  const { loadEnvConfig } = require('@next/env')

  loadEnvConfig(root, dev, { info() {}, error() {} }, true)

  // La clave privada nunca se toma de .env.local ni del entorno heredado.
  if (requirePrivate) {
    const secret = readPrivateStagingSecret(root)
    process.env.SUPABASE_SERVICE_ROLE_KEY = secret
    loadedPrivateSecretValue = secret
  } else {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    loadedPrivateSecretValue = null
  }

  const file = join(root, 'supabase/.temp/project-ref')
  const linkedRef = existsSync(file)
    ? readFileSync(file, 'utf8').trim()
    : null

  const errors = checkLocalStaging(process.env, {
    requirePrivate,
    linkedRef,
  })

  if (errors.length) {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    loadedPrivateSecretValue = null
    throw new Error(errors.join('\n'))
  }

  return {
    env: process.env,
    linked: Boolean(linkedRef),
  }
}

// Claves modernas son opacas: comprobar pertenencia en el host fijo de staging.
// La raíz REST (OpenAPI) puede estar reservada aunque la clave sea válida.
// Consultar la proyección pública con limit=0: no devuelve filas ni requiere
// abrir catálogo/tablas privadas. No leer/imprimir cuerpo ni headers.
export async function verifyStagingCredentials(env, fetcher = fetch) {
  for (const name of [
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]) {
    try {
      const response = await fetcher(
        `${STAGING_ORIGIN}/rest/v1/properties_public?select=id&limit=0`,
        {
          headers: { apikey: env[name] },
          cache: 'no-store',
          redirect: 'error',
          signal: AbortSignal.timeout(8000),
        }
      )

      await response.body?.cancel()

      if (!response.ok) throw new Error()
    } catch {
      throw new Error(
        'No se pudo verificar la configuración de STAGING; no se inició la aplicación.'
      )
    }
  }
}

export function localBuildTag(env) {
  return {
    origin: STAGING_ORIGIN,
    publicKeyHash: createHash('sha256')
      .update(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
      .digest('hex'),
  }
}

export function assertLocalBuild(root, env) {
  try {
    const actual = JSON.parse(
      readFileSync(
        join(root, '.next/qrih-local-stage-build.json'),
        'utf8'
      )
    )

    const expected = localBuildTag(env)

    if (
      actual.origin !== expected.origin ||
      actual.publicKeyHash !== expected.publicKeyHash
    ) {
      throw new Error()
    }
  } catch {
    throw new Error(
      'Primero ejecuta npm run build con la configuración local de STAGING.'
    )
  }
}
