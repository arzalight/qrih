// AUD-018: OFFLINE/SYNTHETIC ONLY. No live source, .env, cloud adapter or capture mode.
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { closeSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync,
  readdirSync, realpathSync, rmdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MARKER = 'QRIH_SYNTHETIC_ONLY_V1\n'
const AGE_HASH = '0c2fbcffab91d0af398162a8ed792e096916c8c47c3c400e303904431103f492'
const KEYGEN_HASH = '33c25cc60fdfbb27438f885e0e9f6e2e2c29c0a64449738bff57b6aebe42f67f'
const LIMIT = 1024 * 1024
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const GENERATION = new RegExp(`^synthetic-${UUID}$`)
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
function need(value, code) { if (!value) throw new Error(code) }
function privatePath(path, directory = false) {
  const s = lstatSync(path)
  need(!s.isSymbolicLink() && s.uid === process.getuid()
    && (directory ? s.isDirectory() : s.isFile())
    && (s.mode & 0o777) === (directory ? 0o700 : 0o600), 'UNSAFE_PATH')
}
function put(path, bytes) { writeFileSync(path, bytes, { flag: 'wx', mode: 0o600 }) }
function boundedRead(path) {
  privatePath(path)
  need(lstatSync(path).size > 0 && lstatSync(path).size <= LIMIT, 'SIZE_LIMIT')
  return readFileSync(path)
}
export function childEnvironment() { return { LANG: 'C', LC_ALL: 'C' } }
function command(binary, args, input) {
  const result = spawnSync(binary, args, { env: childEnvironment(), input,
    stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000, maxBuffer: LIMIT })
  // Neither native diagnostics nor keygen output is printed or propagated.
  need(!result.error && !result.signal && result.status === 0, 'CHILD_FAILED')
  return result.stdout
}
function binaries(ageDirectory) {
  need(isAbsolute(ageDirectory), 'ABSOLUTE_TOOL_PATH_REQUIRED')
  const age = join(ageDirectory, 'age'), keygen = join(ageDirectory, 'age-keygen')
  for (const [path, expected] of [[age, AGE_HASH], [keygen, KEYGEN_HASH]]) {
    const s = lstatSync(path)
    need(s.isFile() && !s.isSymbolicLink() && s.size < 32 * LIMIT
      && (s.mode & 0o022) === 0, 'UNSAFE_BINARY')
    need(digest(readFileSync(path)) === expected, 'BINARY_HASH_MISMATCH')
  }
  return { age, keygen }
}
export function createSyntheticRoot() {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'qrih-backup-rehearsal-'))
  privatePath(root, true)
  put(join(root, '.synthetic-only'), MARKER)
  return root
}
function checkRoot(root) {
  need(isAbsolute(root) && root === resolve(root), 'UNSAFE_ROOT')
  privatePath(root, true)
  need(dirname(root) === realpathSync(tmpdir()) && realpathSync(root) === root
    && /^qrih-backup-rehearsal-[A-Za-z0-9]+$/.test(basename(root)), 'UNSAFE_ROOT')
  need(boundedRead(join(root, '.synthetic-only')).toString() === MARKER, 'NOT_SYNTHETIC_ROOT')
}
function keyPaths(root) { return { identity: join(root, 'fixture-identity.txt'), recipient: join(root, 'fixture-recipient.txt') } }
function prepareSyntheticKey(root, tools) {
  const { identity, recipient } = keyPaths(root)
  // Only the child reads the generated fixture identity; never a real backup identity.
  if (!readdirSync(root).includes('fixture-identity.txt')) {
    // Reserve mode 0600 before keygen, avoiding inherited umask assumptions.
    const fd = openSync(identity, 'wx', 0o600)
    try {
      const result = spawnSync(tools.keygen, [], { env: childEnvironment(),
        stdio: ['ignore', fd, 'pipe'], timeout: 15000, maxBuffer: LIMIT })
      need(!result.error && !result.signal && result.status === 0, 'KEYGEN_FAILED')
    } finally { closeSync(fd) }
    put(recipient, command(tools.keygen, ['-y', identity]))
  }
  privatePath(identity)
  need(/^age1[a-z0-9]{58}\s*$/.test(boundedRead(recipient).toString()), 'BAD_RECIPIENT')
}
function encrypt(tools, recipient, bytes, destination) {
  need(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= LIMIT, 'SIZE_LIMIT')
  const ciphertext = command(tools.age, ['--encrypt', '-R', recipient], bytes)
  put(destination, ciphertext)
  return { bytes: ciphertext.length, sha256: digest(ciphertext) }
}
function decrypt(tools, identity, path) {
  privatePath(identity)
  boundedRead(path) // Size, ownership, type and mode before age opens it.
  return command(tools.age, ['--decrypt', '-i', identity, path])
}
export function verifySyntheticGeneration({ root, generation, ageDirectory }) {
  checkRoot(root)
  need(GENERATION.test(generation), 'BAD_GENERATION')
  const tools = binaries(ageDirectory), directory = join(root, generation)
  privatePath(directory, true)
  const receipt = JSON.parse(boundedRead(join(directory, 'receipt.json')))
  need(receipt.format === 'QRIH_SYNTHETIC_RECEIPT_V1' && receipt.status === 'PASS_SYNTHETIC_ONLY'
    && receipt.generation === generation, 'NOT_COMPLETE')
  const manifestPath = join(directory, 'manifest.age'), encrypted = boundedRead(manifestPath)
  need(digest(encrypted) === receipt.manifestSha256, 'MANIFEST_CHANGED')
  const plain = decrypt(tools, keyPaths(root).identity, manifestPath)
  let manifest
  try { manifest = JSON.parse(plain) } finally { plain.fill(0) }
  need(manifest.format === 'QRIH_SYNTHETIC_MANIFEST_V1' && manifest.syntheticOnly === true
    && manifest.generation === generation && manifest.parts.length === 2, 'BAD_MANIFEST')
  const expected = ['manifest.age', 'part000.age', 'part001.age', 'receipt.json']
  need(JSON.stringify(readdirSync(directory).sort()) === JSON.stringify(expected), 'UNEXPECTED_FILES')
  for (let i = 0; i < 2; i++) {
    const p = manifest.parts[i]
    need(p.file === `part00${i}.age`, 'BAD_PART_NAME')
    const path = join(directory, p.file), ciphertext = boundedRead(path)
    need(ciphertext.length === p.bytes && digest(ciphertext) === p.sha256, 'CIPHERTEXT_CHANGED')
    const bytes = decrypt(tools, keyPaths(root).identity, path)
    try { need(bytes.length === p.plaintextBytes && digest(bytes) === p.plaintextSha256, 'ROUNDTRIP_FAILED') }
    finally { bytes.fill(0) }
  }
  return { status: 'PASS_SYNTHETIC_ONLY', parts: 2, liveCaptureReady: false }
}
export function rehearseGeneration({ root, ageDirectory, failure = null }) {
  need(failure === null || ['producer', 'encryptor', 'drift', 'oversize', 'interrupted'].includes(failure), 'BAD_FAILURE')
  checkRoot(root)
  const tools = binaries(ageDirectory), lock = join(root, '.generation.lock')
  // Atomic lock. Never clear someone else's/stale lock automatically.
  mkdirSync(lock, { mode: 0o700 })
  let directory
  try {
    prepareSyntheticKey(root, tools)
    const generation = `synthetic-${randomUUID()}`
    directory = join(root, generation)
    mkdirSync(directory, { mode: 0o700 })
    privatePath(directory, true)
    const parts = [], { identity, recipient } = keyPaths(root)
    for (let i = 0; i < 2; i++) {
      need(failure !== 'producer', 'SYNTHETIC_PRODUCER_FAILED')
      need(failure !== 'interrupted', 'SYNTHETIC_INTERRUPTION')
      const bytes = failure === 'oversize' ? Buffer.alloc(LIMIT + 1) : Buffer.from(`SYNTHETIC ONLY: fixture-${i}; not a PostgreSQL dump or user photo.`)
      try {
        need(failure !== 'encryptor', 'SYNTHETIC_ENCRYPTOR_FAILED')
        const file = `part00${i}.age`, path = join(directory, file)
        const info = encrypt(tools, recipient, bytes, path)
        const returned = decrypt(tools, identity, path)
        try { need(returned.equals(bytes), 'ROUNDTRIP_FAILED') } finally { returned.fill(0) }
        parts.push({ file, ...info, plaintextBytes: bytes.length, plaintextSha256: digest(bytes) })
      } finally { bytes.fill(0) }
    }
    need(failure !== 'drift', 'SYNTHETIC_SOURCE_CHANGED')
    const plain = Buffer.from(JSON.stringify({ format: 'QRIH_SYNTHETIC_MANIFEST_V1',
      syntheticOnly: true, generation, parts }))
    let info
    try { info = encrypt(tools, recipient, plain, join(directory, 'manifest.age')) }
    finally { plain.fill(0) }
    // Receipt is the commit marker, written only after complete encrypted parts.
    put(join(directory, 'receipt.json'), JSON.stringify({ format: 'QRIH_SYNTHETIC_RECEIPT_V1',
      status: 'PASS_SYNTHETIC_ONLY', generation, manifestSha256: info.sha256,
      liveCaptureReady: false, restoreExecuted: false, uploaded: false }))
    verifySyntheticGeneration({ root, generation, ageDirectory })
    return { generation, status: 'PASS_SYNTHETIC_ONLY', liveCaptureReady: false }
  } catch {
    if (directory) put(join(directory, 'failure.json'), JSON.stringify({ status: 'INCOMPLETE_SYNTHETIC_ONLY', liveCaptureReady: false }))
    throw new Error('REHEARSAL_STOPPED_NO_LIVE_CAPTURE')
  } finally { rmdirSync(lock) } // Only this invocation's empty lock; never generation data.
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    need(process.argv.length === 4 && process.argv[2] === '--synthetic', 'SYNTHETIC_MODE_ONLY')
    // Validate tools before creating a destination. No --capture or arbitrary input/output.
    binaries(process.argv[3])
    const root = createSyntheticRoot()
    const result = rehearseGeneration({ root, ageDirectory: process.argv[3] })
    console.log(JSON.stringify({ ...result, root, network: false, realCredentialsRead: false, stagingExport: false }))
  } catch { console.log('REHEARSAL_STOPPED_NO_LIVE_CAPTURE'); process.exitCode = 1 }
}
