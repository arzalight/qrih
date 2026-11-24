import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  STAGING_ORIGIN,
  STAGING_PROJECT_REF,
  assertNoPrivateSecretInEnvFiles,
  checkLocalStaging,
  checkNetlifyStaging,
  readPrivateStagingSecret,
  verifyStagingCredentials,
} from '../scripts/local-environment.mjs'
import { auditBuildArtifacts } from '../scripts/artifact-secrets-audit.mjs'
import { runPreflight } from '../scripts/deployment-preflight.mjs'

const preflightScript = fileURLToPath(new URL('../scripts/deployment-preflight.mjs', import.meta.url))
const netlifyBuildScript = fileURLToPath(new URL('../scripts/netlify-next-build.mjs', import.meta.url))
const localEnvUrl = new URL('../scripts/local-environment.mjs', import.meta.url).href

const realLikeJwt = (role, ref) => [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ role, ref })).toString('base64url'),
  'syntheticSignatureOnlyForTesting',
].join('.')

const SYNTHETIC_PUBLIC = 'sb_publishable_syntheticStagingKey01'
const SYNTHETIC_PRIVATE = ['sb', 'secret', 'syntheticStagingKey01'].join('_')

function createValidLocalProject() {
  const dir = mkdtempSync(join(tmpdir(), 'qrih-sec-iso-'))
  writeFileSync(
    join(dir, '.env.local'),
    `NEXT_PUBLIC_SUPABASE_URL=${STAGING_ORIGIN}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${SYNTHETIC_PUBLIC}\n`,
    { mode: 0o600 },
  )
  const secretsDir = join(dir, '.secrets')
  mkdirSync(secretsDir, { mode: 0o700 })
  chmodSync(secretsDir, 0o700)
  const secretFile = join(secretsDir, 'staging.env')
  writeFileSync(secretFile, `SUPABASE_SERVICE_ROLE_KEY=${SYNTHETIC_PRIVATE}\n`, { mode: 0o600 })
  chmodSync(secretFile, 0o600)
  return { dir, secretsDir, secretFile }
}

function runPreflightSubprocess(cwd, extraEnv = {}) {
  return spawnSync(process.execPath, [preflightScript], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, NODE_ENV: 'production', ...extraEnv },
  })
}

test('seguridad: credenciales públicas y privadas incorrectas, proyecto ajeno y claves cruzadas', () => {
  const prodUrl = 'https://prod-project-ref.supabase.co'
  const prodAnon = realLikeJwt('anon', 'prod-project-ref')
  const prodService = realLikeJwt('service_role', 'prod-project-ref')
  const stagingAnon = realLikeJwt('anon', STAGING_PROJECT_REF)
  const stagingService = realLikeJwt('service_role', STAGING_PROJECT_REF)

  // Credenciales públicas incorrectas
  for (const badPub of ['', 'not-a-key', 'sb_publishable_', 'sb_publishable_bad key', 'sb_publishable_$$$', prodAnon, stagingService]) {
    assert.ok(checkLocalStaging({
      NEXT_PUBLIC_SUPABASE_URL: STAGING_ORIGIN,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: badPub,
      SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE,
    }).length > 0)
  }

  // Credenciales privadas incorrectas
  for (const badPriv of ['', 'not-a-key', 'sb_secret_', 'sb_secret_bad key', prodService, stagingAnon, SYNTHETIC_PUBLIC]) {
    assert.ok(checkLocalStaging({
      NEXT_PUBLIC_SUPABASE_URL: STAGING_ORIGIN,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: SYNTHETIC_PUBLIC,
      SUPABASE_SERVICE_ROLE_KEY: badPriv,
    }).length > 0)
  }

  // Proyecto Supabase incorrecto / ejecución accidental contra producción
  assert.ok(checkLocalStaging({
    NEXT_PUBLIC_SUPABASE_URL: prodUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SYNTHETIC_PUBLIC,
    SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE,
  }).length > 0)

  // Claves cruzadas o contaminadas en NEXT_PUBLIC_*
  assert.ok(checkLocalStaging({
    NEXT_PUBLIC_SUPABASE_URL: STAGING_ORIGIN,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SYNTHETIC_PUBLIC,
    SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE,
    NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE,
  }).length > 0)

  assert.ok(checkLocalStaging({
    NEXT_PUBLIC_SUPABASE_URL: STAGING_ORIGIN,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SYNTHETIC_PUBLIC,
    SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE,
    NEXT_PUBLIC_CUSTOM_TOKEN: stagingService,
  }).length > 0)
})

test('seguridad: variables heredadas ambiguas rechazadas (runtime y build)', () => {
  const { dir } = createValidLocalProject()
  try {
    // SUPABASE_SERVICE_ROLE_KEY heredada en el shell local debe ser rechazada
    const resRuntime = runPreflightSubprocess(dir, { SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE })
    assert.equal(resRuntime.status, 1)
    assert.match(resRuntime.stderr, /heredada/)
    assert.ok(!resRuntime.stdout.includes(SYNTHETIC_PRIVATE))
    assert.ok(!resRuntime.stderr.includes(SYNTHETIC_PRIVATE))

    // En modo build (requirePrivate: false), tampoco debe aceptarse heredada
    const resBuild = spawnSync(process.execPath, [
      '--input-type=module', '-e',
      `import { loadLocalStaging } from ${JSON.stringify(localEnvUrl)}; loadLocalStaging(${JSON.stringify(dir)}, { dev: false, requirePrivate: false });`,
    ], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH, NODE_ENV: 'production', SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE },
    })
    assert.notEqual(resBuild.status, 0)
    assert.ok(!resBuild.stderr.includes(SYNTHETIC_PRIVATE))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('seguridad: permisos inseguros y enlaces simbólicos en .secrets y .env* rechazados', () => {
  const { dir, secretsDir, secretFile } = createValidLocalProject()
  try {
    // Permisos amplios en staging.env (0644)
    chmodSync(secretFile, 0o644)
    assert.throws(() => readPrivateStagingSecret(dir), /No se pudo leer el secreto local/)
    chmodSync(secretFile, 0o600)

    // Permisos amplios en .secrets (0755)
    chmodSync(secretsDir, 0o755)
    assert.throws(() => readPrivateStagingSecret(dir), /No se pudo leer el secreto local/)
    chmodSync(secretsDir, 0o700)

    // Enlace simbólico para staging.env
    const externalSecret = join(dir, 'outside.env')
    writeFileSync(externalSecret, `SUPABASE_SERVICE_ROLE_KEY=${SYNTHETIC_PRIVATE}\n`, { mode: 0o600 })
    rmSync(secretFile)
    symlinkSync(externalSecret, secretFile)
    assert.throws(() => readPrivateStagingSecret(dir), /No se pudo leer el secreto local/)

    // Enlace simbólico para directorio .secrets
    rmSync(secretsDir, { recursive: true, force: true })
    const externalDir = join(dir, 'outside-dir')
    mkdirSync(externalDir, { mode: 0o700 })
    writeFileSync(join(externalDir, 'staging.env'), `SUPABASE_SERVICE_ROLE_KEY=${SYNTHETIC_PRIVATE}\n`, { mode: 0o600 })
    symlinkSync(externalDir, secretsDir)
    assert.throws(() => readPrivateStagingSecret(dir), /No se pudo leer el secreto local/)

    // Enlace simbólico para .env.local
    const realEnv = join(dir, 'real.env')
    writeFileSync(realEnv, `NEXT_PUBLIC_SUPABASE_URL=${STAGING_ORIGIN}\n`, { mode: 0o600 })
    rmSync(join(dir, '.env.local'))
    symlinkSync(realEnv, join(dir, '.env.local'))
    assert.throws(() => assertNoPrivateSecretInEnvFiles(dir), /enlace simbólico/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('seguridad: secretos en archivos .env* rechazados y preflight falla cerrado sin continuar', () => {
  const { dir } = createValidLocalProject()
  try {
    // 1. SUPABASE_SERVICE_ROLE_KEY en .env.local
    writeFileSync(
      join(dir, '.env.local'),
      `NEXT_PUBLIC_SUPABASE_URL=${STAGING_ORIGIN}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${SYNTHETIC_PUBLIC}\nSUPABASE_SERVICE_ROLE_KEY=${SYNTHETIC_PRIVATE}\n`,
    )
    const res = runPreflightSubprocess(dir)
    assert.equal(res.status, 1)
    assert.match(res.stderr, /Se detectó una credencial privada en \.env\.local/)
    // Falla cerrado: no debe imprimir validaciones posteriores ni estados engañosos
    assert.doesNotMatch(res.stdout, /NEXT_PUBLIC_SUPABASE_URL:/)
    assert.doesNotMatch(res.stdout, /Artefactos inspeccionados/)
    assert.ok(!res.stderr.includes(SYNTHETIC_PRIVATE))

    // 2. Valor sb_secret_ oculto bajo otra variable en .env.production
    writeFileSync(join(dir, '.env.local'), `NEXT_PUBLIC_SUPABASE_URL=${STAGING_ORIGIN}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${SYNTHETIC_PUBLIC}\n`)
    writeFileSync(join(dir, '.env.production'), `SOME_KEY=${SYNTHETIC_PRIVATE}\n`)
    assert.throws(() => assertNoPrivateSecretInEnvFiles(dir), /credencial privada dentro de \.env\.production/)
    rmSync(join(dir, '.env.production'))

    // 3. JWT service_role dentro de .env.development
    writeFileSync(join(dir, '.env.development'), `OTHER_TOKEN=${realLikeJwt('service_role', STAGING_PROJECT_REF)}\n`)
    assert.throws(() => assertNoPrivateSecretInEnvFiles(dir), /credencial privada dentro de \.env\.development/)
    rmSync(join(dir, '.env.development'))

    // 4. Variable NEXT_PUBLIC_* prohibida en .env.local
    writeFileSync(join(dir, '.env.local'), `NEXT_PUBLIC_SUPABASE_URL=${STAGING_ORIGIN}\nNEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=foo\n`)
    assert.throws(() => assertNoPrivateSecretInEnvFiles(dir), /NEXT_PUBLIC_\* prohibida/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('seguridad: auditoría de artefactos detecta secretos en cliente, servidor, source maps, cache y .netlify', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qrih-artifacts-test-'))
  try {
    mkdirSync(join(dir, '.next/static/chunks'), { recursive: true })
    mkdirSync(join(dir, '.next/server/app'), { recursive: true })
    mkdirSync(join(dir, '.next/cache'), { recursive: true })

    // Estado limpio: servidor puede mencionar el nombre de variable runtime (sin valor literal)
    writeFileSync(join(dir, '.next/static/chunks/main.js'), 'console.log("ok")')
    writeFileSync(join(dir, '.next/server/app/route.js'), 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;')
    writeFileSync(join(dir, '.next/cache/meta.json'), '{"ok":true}')
    let audit = auditBuildArtifacts(dir, { privateKey: SYNTHETIC_PRIVATE, scanNetlify: true })
    assert.equal(audit.ok, true)
    assert.equal(audit.findings.length, 0)

    // 1. Secreto / identificador en bundle cliente
    writeFileSync(join(dir, '.next/static/chunks/leak.js'), 'const x = process.env.SUPABASE_SERVICE_ROLE_KEY;')
    audit = auditBuildArtifacts(dir, { privateKey: SYNTHETIC_PRIVATE })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some(f => f.area === 'next-static' && f.rule === 'client-secret-identifier'))
    rmSync(join(dir, '.next/static/chunks/leak.js'))

    // 2. Valor exacto en source map de cliente
    writeFileSync(join(dir, '.next/static/chunks/app.js.map'), JSON.stringify({ sourcesContent: [SYNTHETIC_PRIVATE] }))
    audit = auditBuildArtifacts(dir, { privateKey: SYNTHETIC_PRIVATE })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some(f => f.area === 'next-static' && f.file.endsWith('.map')))
    rmSync(join(dir, '.next/static/chunks/app.js.map'))

    // 3. Secreto (JWT service_role) en artefacto servidor y source map de servidor
    const jwtSecret = realLikeJwt('service_role', STAGING_PROJECT_REF)
    writeFileSync(join(dir, '.next/server/app/page.js.map'), JSON.stringify({ sourcesContent: [jwtSecret] }))
    audit = auditBuildArtifacts(dir, { privateKey: SYNTHETIC_PRIVATE })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some(f => f.area === 'next-server' && f.rule === 'sourcemap-service-role-jwt'))
    rmSync(join(dir, '.next/server/app/page.js.map'))

    // 4. Valor de secreto en .next/cache (sin necesidad de conocer privateKey -> patrón sb_secret_)
    writeFileSync(join(dir, '.next/cache/env-dump.bin'), `cached=${SYNTHETIC_PRIVATE}`)
    audit = auditBuildArtifacts(dir, { privateKey: '' })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some(f => f.area === 'next-other' && f.rule === 'supabase-secret-key'))
    rmSync(join(dir, '.next/cache/env-dump.bin'))

    // 5. Enlace simbólico en artefacto de build
    const target = join(dir, 'target.js')
    writeFileSync(target, 'console.log(1)')
    symlinkSync(target, join(dir, '.next/static/chunks/link.js'))
    audit = auditBuildArtifacts(dir, { privateKey: SYNTHETIC_PRIVATE })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some(f => f.rule === 'symlink-in-artifact'))
    rmSync(join(dir, '.next/static/chunks/link.js'))

    // 6. .env.local con secreto copiado dentro de .netlify/functions-internal
    mkdirSync(join(dir, '.netlify/functions-internal/___netlify-server-handler'), { recursive: true })
    writeFileSync(
      join(dir, '.netlify/functions-internal/___netlify-server-handler/.env.local'),
      `SUPABASE_SERVICE_ROLE_KEY=${SYNTHETIC_PRIVATE}\n`,
    )
    audit = auditBuildArtifacts(dir, { privateKey: SYNTHETIC_PRIVATE, scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some(f => f.area === 'netlify-artifacts' && f.rule === 'env-file-with-private-secret'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('seguridad: auditoría por patrones sin clave real detecta sb_secret_* y JWT service_role sin filtrar valores', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qrih-pattern-audit-'))
  try {
    mkdirSync(join(dir, '.next/static/chunks'), { recursive: true })
    mkdirSync(join(dir, '.next/server/app'), { recursive: true })
    mkdirSync(join(dir, '.next/cache'), { recursive: true })

    const syntheticSecret = ['sb', 'secret', 'syntheticPatternOnly998877'].join('_')
    const syntheticJwt = realLikeJwt('service_role', STAGING_PROJECT_REF)
    const buildEnv = {
      QRIH_NETLIFY_BUILD: 'true',
      NEXT_PUBLIC_SUPABASE_URL: STAGING_ORIGIN,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: SYNTHETIC_PUBLIC,
      URL: 'https://qrih-staging.netlify.app',
    }

    const cases = [
      ['.next/static/chunks/bundle.js', `const s = "${syntheticSecret}";`, 'supabase-secret-key'],
      ['.next/server/app/route.js', `const s = "${syntheticSecret}";`, 'supabase-secret-key'],
      ['.next/server/app/route.js.map', JSON.stringify({ sourcesContent: [syntheticSecret] }), 'sourcemap-supabase-secret-key'],
      ['.next/cache/pack.bin', `leaked=${syntheticSecret}`, 'supabase-secret-key'],
      ['.next/static/chunks/jwt.js', `const j = "${syntheticJwt}";`, 'service-role-jwt'],
      ['.next/server/app/jwt.js', `const j = "${syntheticJwt}";`, 'service-role-jwt'],
      ['.next/static/chunks/jwt.js.map', JSON.stringify({ sourcesContent: [syntheticJwt] }), 'sourcemap-service-role-jwt'],
      ['.next/cache/jwt.bin', `token=${syntheticJwt}`, 'service-role-jwt'],
    ]

    for (const [rel, content, expectedRule] of cases) {
      const full = join(dir, rel)
      writeFileSync(full, content)
      const audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: false })
      assert.equal(audit.ok, false)
      assert.ok(audit.findings.some(f => f.file === rel && f.rule === expectedRule))

      const logs = []
      const errs = []
      const preflight = runPreflight({ root: dir, env: buildEnv, log: m => logs.push(m), errorLog: m => errs.push(m) })
      assert.equal(preflight.ok, false)
      assert.equal(preflight.stage, 'artifacts')
      const combined = [...logs, ...errs].join('\n')
      assert.ok(!combined.includes(syntheticSecret))
      assert.ok(!combined.includes(syntheticJwt))
      rmSync(full)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('seguridad: configuración Netlify (build sin secreto, compatibilidad runtime, producción y wrapper aislado)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qrih-netlify-test-'))
  try {
    const baseNetlifyBuild = {
      QRIH_NETLIFY_BUILD: 'true',
      NEXT_PUBLIC_SUPABASE_URL: STAGING_ORIGIN,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: SYNTHETIC_PUBLIC,
      URL: 'https://qrih-staging.netlify.app',
    }

    // Build de Netlify válido: sin SUPABASE_SERVICE_ROLE_KEY
    assert.deepEqual(checkNetlifyStaging(baseNetlifyBuild, { requirePrivate: false, forbidPrivate: true }), [])
    const logs = []
    const errs = []
    const okResult = runPreflight({ root: dir, env: baseNetlifyBuild, log: m => logs.push(m), errorLog: m => errs.push(m) })
    assert.equal(okResult.ok, true)
    assert.equal(errs.length, 0)
    assert.ok(logs.some(line => line.includes('ausente (aislada para runtime)')))

    // Compatibilidad conservada para consumidores que llaman checkNetlifyStaging sin opciones (requirePrivate=true)
    const runtimeEnv = { ...baseNetlifyBuild, SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE }
    assert.deepEqual(checkNetlifyStaging(runtimeEnv), [])
    assert.deepEqual(checkNetlifyStaging({ ...baseNetlifyBuild, SUPABASE_SERVICE_ROLE_KEY: '********' }), [])
    assert.ok(checkNetlifyStaging(baseNetlifyBuild).length > 0)
    assert.ok(checkNetlifyStaging({ ...baseNetlifyBuild, SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PUBLIC }).length > 0)
    assert.ok(checkNetlifyStaging({ ...baseNetlifyBuild, SUPABASE_SERVICE_ROLE_KEY: realLikeJwt('service_role', 'prod-ref') }).length > 0)

    // Casos inválidos en build de Netlify (incluyendo secreto en build en texto claro o enmascarado)
    const badBuildCases = [
      { ...baseNetlifyBuild, NEXT_PUBLIC_SUPABASE_URL: 'https://prod-ref.supabase.co' },
      { ...baseNetlifyBuild, SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE },
      { ...baseNetlifyBuild, SUPABASE_SERVICE_ROLE_KEY: '********' },
      { ...baseNetlifyBuild, NEXT_PUBLIC_SUPABASE_ANON_KEY: realLikeJwt('service_role', STAGING_PROJECT_REF) },
      { ...baseNetlifyBuild, URL: 'http://qrih-staging.netlify.app' },
      { ...baseNetlifyBuild, URL: 'https://qrih-staging.netlify.app/subpath' },
      { ...baseNetlifyBuild, QRIH_INDEXING_ENABLED: 'true' },
      { ...baseNetlifyBuild, NEXT_PUBLIC_EXTRA: SYNTHETIC_PRIVATE },
    ]
    for (const badEnv of badBuildCases) {
      assert.ok(checkNetlifyStaging(badEnv, { requirePrivate: false, forbidPrivate: true }).length > 0)
      const caseErrs = []
      const res = runPreflight({ root: dir, env: badEnv, log: () => {}, errorLog: m => caseErrs.push(m) })
      assert.equal(res.ok, false)
      assert.equal(res.stage, 'netlify-env')
      assert.ok(!caseErrs.join('\n').includes(SYNTHETIC_PRIVATE))
    }

    // Wrapper netlify-next-build ejecutado en directorio aislado: rechaza antes de invocar next build
    const isolatedRejectCases = [
      {
        env: { ...baseNetlifyBuild, NEXT_PUBLIC_SUPABASE_URL: 'https://prod-ref.supabase.co' },
        match: /proyecto autorizado/,
      },
      {
        env: { ...baseNetlifyBuild, SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE },
        match: /scope builds/,
      },
      {
        env: { ...baseNetlifyBuild, SUPABASE_SERVICE_ROLE_KEY: '********' },
        match: /scope builds/,
      },
    ]
    for (const item of isolatedRejectCases) {
      const res = spawnSync(process.execPath, [netlifyBuildScript], {
        cwd: dir,
        encoding: 'utf8',
        env: { PATH: process.env.PATH, ...item.env },
      })
      assert.equal(res.status, 1)
      assert.match(res.stderr, item.match)
      assert.ok(!res.stderr.includes(SYNTHETIC_PRIVATE))
      assert.equal(existsSync(join(dir, '.next')), false)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('seguridad: fallos de autenticación y errores de conexión nunca exponen secretos', async () => {
  const credentials = {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SYNTHETIC_PUBLIC,
    SUPABASE_SERVICE_ROLE_KEY: SYNTHETIC_PRIVATE,
  }
  const failingFetchers = [
    async () => new Response(`{"message":"bad key ${SYNTHETIC_PRIVATE}"}`, { status: 401 }),
    async () => new Response('Forbidden', { status: 403 }),
    async () => { throw new Error(`ECONNREFUSED with ${SYNTHETIC_PRIVATE}`) },
    async () => { throw new DOMException('Timed out', 'TimeoutError') },
  ]
  for (const fetcher of failingFetchers) {
    await assert.rejects(verifyStagingCredentials(credentials, fetcher), error => {
      assert.ok(!error.message.includes(SYNTHETIC_PRIVATE))
      assert.ok(!error.message.includes(SYNTHETIC_PUBLIC))
      assert.match(error.message, /No se pudo verificar la configuración de STAGING/)
      return true
    })
  }
})
