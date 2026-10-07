import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'

export const STAGING_PROJECT_REF = 'mcyxunymhuxyiwklyfpy'
export const STAGING_ORIGIN = `https://${STAGING_PROJECT_REF}.supabase.co`

function jwtPayload(value) {
  try { return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()) }
  catch { return null }
}

// Sólo lectura local. Nunca interpolar valores privados en diagnósticos.
export function checkLocalStaging(env, { requirePrivate = true, linkedRef = null } = {}) {
  const errors = []
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || '')
    if (url.origin !== STAGING_ORIGIN || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      errors.push('El desarrollo local debe apuntar exclusivamente a Supabase STAGING.')
    }
  } catch { errors.push('Falta un origen válido de Supabase STAGING.') }
  const publicKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const publicJwt = jwtPayload(publicKey)
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)
      && !(publicJwt?.role === 'anon' && publicJwt.ref === STAGING_PROJECT_REF)) {
    errors.push('Falta una clave pública de STAGING válida.')
  }
  const privateKey = env.SUPABASE_SERVICE_ROLE_KEY || ''
  const privateJwt = jwtPayload(privateKey)
  if ((requirePrivate || privateKey) && !/^sb_secret_[A-Za-z0-9_-]+$/.test(privateKey)
      && !(privateJwt?.role === 'service_role' && privateJwt.ref === STAGING_PROJECT_REF)) {
    errors.push('Falta una clave privada de STAGING válida; introdúcela sólo en el archivo local.')
  }
  if (env.SITE_ID || env.NETLIFY === 'true') errors.push('El control de desarrollo local no debe ejecutarse como Netlify.')
  if (linkedRef && linkedRef !== STAGING_PROJECT_REF) errors.push('La CLI local está vinculada a otro proyecto; no usar comandos --linked.')
  return errors
}

export function loadLocalStaging(root, { dev = true, requirePrivate = true } = {}) {
  // Mismo cargador/orden que el Next instalado: env heredado > .env.*.local > .env.
  const require = createRequire(import.meta.url)
  const { loadEnvConfig } = require('@next/env')
  loadEnvConfig(root, dev, { info() {}, error() {} }, true)
  const file = join(root, 'supabase/.temp/project-ref')
  const linkedRef = existsSync(file) ? readFileSync(file, 'utf8').trim() : null
  const errors = checkLocalStaging(process.env, { requirePrivate, linkedRef })
  if (errors.length) throw new Error(errors.join('\n'))
  return { env: process.env, linked: Boolean(linkedRef) }
}

// Claves modernas son opacas: comprobar pertenencia en el host fijo de staging.
// La raíz REST (OpenAPI) puede estar reservada aunque la clave sea válida.
// Consultar la proyección pública con limit=0: no devuelve filas ni requiere
// abrir catálogo/tablas privadas. No leer/imprimir cuerpo ni headers.
export async function verifyStagingCredentials(env, fetcher = fetch) {
  for (const name of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    try {
      const response = await fetcher(`${STAGING_ORIGIN}/rest/v1/properties_public?select=id&limit=0`, {
        headers: { apikey: env[name] }, cache: 'no-store', redirect: 'error',
        signal: AbortSignal.timeout(8000),
      })
      await response.body?.cancel()
      if (!response.ok) throw new Error()
    } catch { throw new Error('No se pudo verificar la configuración de STAGING; no se inició la aplicación.') }
  }
}

export function localBuildTag(env) {
  return { origin: STAGING_ORIGIN,
    publicKeyHash: createHash('sha256').update(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').digest('hex') }
}

export function assertLocalBuild(root, env) {
  try {
    const actual = JSON.parse(readFileSync(join(root, '.next/qrih-local-stage-build.json'), 'utf8'))
    const expected = localBuildTag(env)
    if (actual.origin !== expected.origin || actual.publicKeyHash !== expected.publicKeyHash) throw new Error()
  } catch { throw new Error('Primero ejecuta npm run build con la configuración local de STAGING.') }
}
