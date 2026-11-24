import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mkdtempSync,
  mkdirSync,
  chmodSync,
  writeFileSync,
  readFileSync,
  statSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  LOCAL_KEYS,
  stagingValues,
  provision,
} from '../scripts/provision-local-staging.mjs'
import {
  STAGING_ORIGIN,
  STAGING_PROJECT_REF,
} from '../scripts/local-environment.mjs'

const token = role => [
  'synthetic',
  Buffer.from(JSON.stringify({
    role,
    ref: STAGING_PROJECT_REF,
  })).toString('base64url'),
  'synthetic',
].join('.')

const valid = () =>
  `NEXT_PUBLIC_SUPABASE_URL=${STAGING_ORIGIN}\n` +
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${token('anon')}\n` +
  `SUPABASE_SERVICE_ROLE_KEY=${token('service_role')}\n`

function temporaryProject() {
  const root = mkdtempSync(join(tmpdir(), 'qrih-provision-test-'))

  writeFileSync(
    join(root, '.gitignore'),
    '.env.local\n.secrets/\n',
    { mode: 0o600 },
  )

  const git = spawnSync('git', ['init', '-q'], { cwd: root })
  assert.equal(git.status, 0)

  const source = join(root, 'source.env')
  writeFileSync(source, valid(), { mode: 0o600 })
  chmodSync(source, 0o600)

  return { root, source }
}

test('consolidación: acepta únicamente las tres variables STAGING necesarias', () => {
  assert.deepEqual(Object.keys(stagingValues(valid())), LOCAL_KEYS)

  assert.deepEqual(
    Object.keys(stagingValues(
      valid() +
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${token('anon')}\n`,
    )),
    LOCAL_KEYS,
  )
})

test('consolidación: rechaza proyecto ajeno, claves cruzadas, secretos extra y valores ambiguos', () => {
  const invalid = [
    valid().replace(STAGING_ORIGIN, 'https://other.supabase.co'),
    valid().replace(token('service_role'), token('anon')),
    valid() + 'PGPASSWORD=synthetic\n',
    valid() + 'NEXT_PUBLIC_SUPABASE_URL=duplicate\n',
    valid().replace(token('anon'), '$INHERITED'),
    valid() + 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_other\n',
  ]

  for (const input of invalid) {
    assert.throws(() => stagingValues(input))
  }
})

test('aprovisionamiento: crea archivo público y secreto separados con permisos correctos', async () => {
  const { root, source } = temporaryProject()

  try {
    await provision(source, root, {
      verifyCredentials: async () => {},
    })

    const publicFile = join(root, '.env.local')
    const secretDirectory = join(root, '.secrets')
    const secretFile = join(secretDirectory, 'staging.env')

    const publicContent = readFileSync(publicFile, 'utf8')
    const secretContent = readFileSync(secretFile, 'utf8')

    assert.match(publicContent, /^NEXT_PUBLIC_SUPABASE_URL=/m)
    assert.match(publicContent, /^NEXT_PUBLIC_SUPABASE_ANON_KEY=/m)
    assert.doesNotMatch(publicContent, /SUPABASE_SERVICE_ROLE_KEY/)

    assert.match(secretContent, /^SUPABASE_SERVICE_ROLE_KEY=/)
    assert.equal(secretContent.trim().split('\n').length, 1)

    assert.equal(statSync(publicFile).mode & 0o777, 0o600)
    assert.equal(statSync(secretDirectory).mode & 0o777, 0o700)
    assert.equal(statSync(secretFile).mode & 0o777, 0o600)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('aprovisionamiento: rechaza destinos existentes sin sobrescribirlos', async () => {
  const { root, source } = temporaryProject()

  try {
    const publicFile = join(root, '.env.local')
    const original = 'archivo existente; no modificar\n'
    writeFileSync(publicFile, original, { mode: 0o600 })

    await assert.rejects(
      provision(source, root, { verifyCredentials: async () => {} }),
    )

    assert.equal(readFileSync(publicFile, 'utf8'), original)
    assert.equal(
      statSync(publicFile).mode & 0o777,
      0o600,
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('aprovisionamiento: exige verificación antes de crear archivos', async () => {
  const { root, source } = temporaryProject()

  try {
    await assert.rejects(
      provision(source, root, {
        verifyCredentials: async () => {
          throw new Error('simulated verification failure')
        },
      }),
    )

    assert.equal(
      statSync(root).isDirectory(),
      true,
    )
    assert.equal(
      (() => {
        try {
          statSync(join(root, '.env.local'))
          return true
        } catch {
          return false
        }
      })(),
      false,
    )
    assert.equal(
      (() => {
        try {
          statSync(join(root, '.secrets'))
          return true
        } catch {
          return false
        }
      })(),
      false,
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('consolidación: aprovisionamiento explícito y no invocado al arrancar', () => {
  const source = readFileSync(
    new URL('../scripts/provision-local-staging.mjs', import.meta.url),
    'utf8',
  )

  assert.match(source, /O_EXCL/)
  assert.match(source, /O_NOFOLLOW/)
  assert.match(source, /0o600/)
  assert.match(source, /0o700/)

  for (const name of [
    'local-next.mjs',
    'local-environment.mjs',
    'deployment-preflight.mjs',
  ]) {
    const runtime = readFileSync(
      new URL('../scripts/' + name, import.meta.url),
      'utf8',
    )
    assert.doesNotMatch(
      runtime,
      /perfecto-con-esas|provision-local-staging|sprint1-local-env/,
    )
  }
})
