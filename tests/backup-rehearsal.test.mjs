import assert from 'node:assert/strict'
import { test as nodeTest } from 'node:test'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { chmodSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { childEnvironment, createSyntheticRoot, rehearseGeneration,
  verifySyntheticGeneration } from '../scripts/backup-rehearsal.mjs'

// Explicit test-only binary directory; never an app env loader or credential.
const ageDirectory = process.env.QRIH_SYNTHETIC_AGE_DIRECTORY
const test = (name, fn) => nodeTest(name, { skip: ageDirectory ? false
  : 'Requires explicit reviewed QRIH_SYNTHETIC_AGE_DIRECTORY; never download tools automatically' }, fn)
const run = (root, failure = null) => rehearseGeneration({ root, ageDirectory, failure })
const verify = (root, generation) => verifySyntheticGeneration({ root, generation, ageDirectory })
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const cli = fileURLToPath(new URL('../scripts/backup-rehearsal.mjs', import.meta.url))

test('offline: child process env excludes inherited credentials and preload options', () => {
  assert.deepEqual(childEnvironment(), { LANG: 'C', LC_ALL: 'C' })
})
test('offline: two complete generations, independent readback, old bytes preserved', () => {
  const root = createSyntheticRoot(), first = run(root)
  const names = readdirSync(join(root, first.generation))
  const before = names.map(name => hash(readFileSync(join(root, first.generation, name))))
  const second = run(root)
  assert.notEqual(first.generation, second.generation)
  assert.deepEqual(verify(root, first.generation), { status: 'PASS_SYNTHETIC_ONLY', parts: 2, liveCaptureReady: false })
  assert.equal(verify(root, second.generation).status, 'PASS_SYNTHETIC_ONLY')
  assert.deepEqual(names.map(name => hash(readFileSync(join(root, first.generation, name)))), before)
  assert.equal(readdirSync(root).includes('.generation.lock'), false)
  assert.equal(lstatSync(root).mode & 0o777, 0o700)
  for (const name of names) {
    assert.equal(lstatSync(join(root, first.generation, name)).mode & 0o777, 0o600)
    assert.ok(!readFileSync(join(root, first.generation, name)).includes(Buffer.from('not a PostgreSQL dump')))
  }
})
test('offline: an existing lock is preserved and blocks competing execution', () => {
  const root = createSyntheticRoot(), lock = join(root, '.generation.lock')
  mkdirSync(lock, { mode: 0o700 })
  assert.throws(() => run(root))
  assert.ok(lstatSync(lock).isDirectory())
  assert.equal(readdirSync(root).filter(name => name.startsWith('synthetic-')).length, 0)
})
for (const failure of ['producer', 'encryptor', 'drift', 'oversize', 'interrupted']) {
  test(`offline: injected ${failure} failure retains incomplete ciphertext, releases own lock and preserves prior generation`, () => {
    const root = createSyntheticRoot(), first = run(root)
    assert.throws(() => run(root, failure), /REHEARSAL_STOPPED_NO_LIVE_CAPTURE/)
    const generations = readdirSync(root).filter(name => name.startsWith('synthetic-'))
    const incomplete = generations.find(name => name !== first.generation)
    const files = readdirSync(join(root, incomplete))
    assert.ok(files.includes('failure.json'))
    assert.ok(!files.includes('receipt.json'))
    assert.throws(() => verify(root, incomplete))
    assert.ok(!readdirSync(root).includes('.generation.lock'))
    assert.equal(verify(root, first.generation).status, 'PASS_SYNTHETIC_ONLY')
    // Retrying creates a new generation, never reuses/removes the incomplete one.
    assert.notEqual(run(root).generation, incomplete)
    assert.ok(lstatSync(join(root, incomplete)).isDirectory())
  })
}
for (const target of ['part000.age', 'manifest.age']) {
  test(`offline: tampered ${target} rejected by independent verifier`, () => {
    const root = createSyntheticRoot(), result = run(root)
    const path = join(root, result.generation, target), bytes = readFileSync(path)
    bytes[bytes.length - 1] ^= 1
    writeFileSync(path, bytes)
    assert.throws(() => verify(root, result.generation))
  })
}
test('offline: truncated ciphertext and nonexistent generation rejected', () => {
  const root = createSyntheticRoot(), result = run(root)
  writeFileSync(join(root, result.generation, 'part001.age'), 'truncated')
  assert.throws(() => verify(root, result.generation))
  assert.throws(() => verify(root, 'synthetic-00000000-0000-0000-0000-000000000000'))
})
test('offline: wrong synthetic identity fails authenticated decryption', () => {
  const root = createSyntheticRoot(), result = run(root), other = createSyntheticRoot()
  run(other)
  writeFileSync(join(root, 'fixture-identity.txt'), readFileSync(join(other, 'fixture-identity.txt')))
  assert.throws(() => verify(root, result.generation))
})
test('offline: unsafe permissions and generation traversal rejected', () => {
  const root = createSyntheticRoot(), result = run(root)
  for (const name of ['../fixture-identity.txt', '/etc', 'synthetic-abc']) {
    assert.throws(() => verify(root, name))
  }
  chmodSync(join(root, result.generation, 'part000.age'), 0o644)
  assert.throws(() => verify(root, result.generation))
})
test('offline: symlink root rejected before writing; actual backup roots forbidden', () => {
  const root = createSyntheticRoot(), container = createSyntheticRoot(), link = join(container, 'link')
  symlinkSync(root, link)
  assert.throws(() => run(link))
  // Source inspection establishes no real destination/root ever accepted; no real-path probe.
  assert.ok(!readFileSync(cli, 'utf8').includes('/Users/Shared'))
  assert.throws(() => run('.'))
})
test('offline: unexpected files invalidate a completed generation', () => {
  const root = createSyntheticRoot(), result = run(root)
  writeFileSync(join(root, result.generation, 'unexpected.txt'), 'synthetic', { flag: 'wx', mode: 0o600 })
  assert.throws(() => verify(root, result.generation))
})
test('offline: no real capture/remote-check/restore/upload CLI exists', () => {
  for (const mode of ['--capture', '--check-ready', '--restore', '--upload', '--synthetic']) {
    const result = spawnSync(process.execPath, [cli, mode], { env: childEnvironment(), encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.equal(result.stdout.trim(), 'REHEARSAL_STOPPED_NO_LIVE_CAPTURE')
    assert.equal(result.stderr, '')
  }
})
test('offline: implementation contains no source loader, network client or live adapter', () => {
  const source = readFileSync(cli, 'utf8')
  for (const forbidden of ['fetch(', 'node:http', 'node:https', 'node:net', 'node:tls',
    'loadEnvConfig', 'process.env', 'SUPABASE_SERVICE_ROLE_KEY', 'pg_dump', 'capture-staging.mjs']) {
    assert.ok(!source.includes(forbidden), forbidden)
  }
  assert.ok(!source.includes('CAPTURE_RELEASED')) // No alternate live-capture switch.
})
test('offline: unreviewed binaries rejected before creating any generation', () => {
  const root = createSyntheticRoot(), tools = createSyntheticRoot()
  for (const name of ['age', 'age-keygen']) writeFileSync(join(tools, name), 'synthetic not a tool', { mode: 0o700 })
  assert.throws(() => rehearseGeneration({ root, ageDirectory: tools }), /BINARY_HASH_MISMATCH/)
  assert.deepEqual(readdirSync(root), ['.synthetic-only'])
})
test('offline: generation symlink and unsafe identity permissions rejected', () => {
  const root = createSyntheticRoot(), result = run(root), other = createSyntheticRoot()
  // A new complete directory is not required: reject symlinked generation itself.
  const alias = 'synthetic-11111111-1111-1111-1111-111111111111'
  symlinkSync(join(root, result.generation), join(root, alias))
  assert.throws(() => verify(root, alias))
  // Fixture identity used by verifier must be private, even if ciphertext is unchanged.
  chmodSync(join(root, 'fixture-identity.txt'), 0o644)
  assert.throws(() => verify(root, result.generation))
  assert.equal(readdirSync(other).length, 1)
})
