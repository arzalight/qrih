import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { brotliCompressSync, deflateRawSync, gzipSync } from 'node:zlib'
import { auditBuildArtifacts } from '../scripts/artifact-secrets-audit.mjs'

const SYNTHETIC_SECRET = ['sb', 'secret', 'compressedAuditCheck01'].join('_')
const SYNTHETIC_JWT = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ role: 'service_role', ref: 'mcyxunymhuxyiwklyfpy' })).toString('base64url'),
  'syntheticSignatureCompressed',
].join('.')

function buildTar(entries) {
  const chunks = []
  for (const { name, content = Buffer.alloc(0), typeFlag = '0' } of entries) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8')
    const header = Buffer.alloc(512)
    header.write(name, 0, Math.min(name.length, 100), 'utf8')
    header.write('0000644\0', 100, 8, 'utf8')
    header.write('0000000\0', 108, 8, 'utf8')
    header.write('0000000\0', 116, 8, 'utf8')
    header.write(data.length.toString(8).padStart(11, '0') + '\0', 124, 12, 'utf8')
    header.write('00000000000\0', 136, 12, 'utf8')
    header.fill(0x20, 148, 156)
    header[156] = typeFlag.charCodeAt(0)
    header.write('ustar\0', 257, 6, 'utf8')
    header.write('00', 263, 2, 'utf8')
    let sum = 0
    for (let i = 0; i < 512; i++) sum += header[i]
    header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8')
    chunks.push(header)
    if (data.length) {
      chunks.push(data)
      const rem = data.length % 512
      if (rem) chunks.push(Buffer.alloc(512 - rem))
    }
  }
  chunks.push(Buffer.alloc(1024))
  return Buffer.concat(chunks)
}

function buildZip(entries) {
  const localParts = []
  const centralParts = []
  let offset = 0

  for (const { name, content = Buffer.alloc(0), method = 8, unixMode = 0o100644 } of entries) {
    const raw = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8')
    const compressed = method === 8 ? deflateRawSync(raw) : raw
    const nameBuf = Buffer.from(name, 'utf8')

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    localParts.push(local, nameBuf, compressed)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(0x0314, 4) // Unix creator
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(method, 10)
    central.writeUInt32LE(compressed.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt32LE((unixMode << 16) >>> 0, 38)
    central.writeUInt32LE(offset, 42)
    centralParts.push(central, nameBuf)

    offset += local.length + nameBuf.length + compressed.length
  }

  const centralBuf = Buffer.concat(centralParts)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(centralBuf.length, 12)
  eocd.writeUInt32LE(offset, 16)

  return Buffer.concat([...localParts, centralBuf, eocd])
}

test('auditor comprimidos: detecta secretos en ZIP, TAR.GZ, GZIP, Brotli, ESZIP y archivos anidados sin revelar valores', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qrih-comp-audit-'))
  try {
    mkdirSync(join(dir, '.netlify/functions'), { recursive: true })
    mkdirSync(join(dir, '.netlify/edge-functions-dist'), { recursive: true })

    // 1. Limpio: ZIP + TAR.GZ + GZ + BR + ESZIP sin secretos -> PASS
    writeFileSync(join(dir, '.netlify/functions/clean.zip'), buildZip([{ name: 'index.js', content: 'export default 1' }]))
    writeFileSync(join(dir, '.netlify/edge-functions-dist/clean.tar.gz'), gzipSync(buildTar([{ name: 'edge.js', content: 'console.log("ok")' }])))
    writeFileSync(join(dir, '.netlify/edge-functions-dist/clean.js.gz'), gzipSync(Buffer.from('const ok = true')))
    writeFileSync(join(dir, '.netlify/edge-functions-dist/clean.js.br'), brotliCompressSync(Buffer.from('const ok = true')))
    writeFileSync(join(dir, '.netlify/edge-functions-dist/clean.eszip'), Buffer.from('ESZIP_V2\0console.log("clean")'))

    let audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, true)
    assert.equal(audit.findings.length, 0)

    // 2. .env.local con secreto dentro de ___netlify-server-handler.zip
    const leakZip = join(dir, '.netlify/functions/___netlify-server-handler.zip')
    writeFileSync(leakZip, buildZip([{ name: '.env.local', content: `SUPABASE_SERVICE_ROLE_KEY=${SYNTHETIC_SECRET}\n` }]))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-env-file-with-private-secret'))
    assert.ok(!JSON.stringify(audit.findings).includes(SYNTHETIC_SECRET))
    rmSync(leakZip)

    // 3. JWT service_role dentro de TAR.GZ
    const leakTarGz = join(dir, '.netlify/edge-functions-dist/leak.tar.gz')
    writeFileSync(leakTarGz, gzipSync(buildTar([{ name: 'handler.js', content: `const t = "${SYNTHETIC_JWT}"` }])))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-service-role-jwt'))
    assert.ok(!JSON.stringify(audit.findings).includes(SYNTHETIC_JWT))
    rmSync(leakTarGz)

    // 4. Secreto dentro de .gz y .br
    const leakGz = join(dir, '.netlify/edge-functions-dist/leak.js.gz')
    writeFileSync(leakGz, gzipSync(Buffer.from(`const k = "${SYNTHETIC_SECRET}"`)))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-supabase-secret-key'))
    rmSync(leakGz)

    const leakBr = join(dir, '.netlify/edge-functions-dist/leak.js.br')
    writeFileSync(leakBr, brotliCompressSync(Buffer.from(`const k = "${SYNTHETIC_SECRET}"`)))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-supabase-secret-key'))
    rmSync(leakBr)

    // 5. Secreto dentro de ESZIP_V2
    const leakEszip = join(dir, '.netlify/edge-functions-dist/leak.eszip')
    writeFileSync(leakEszip, Buffer.from(`ESZIP_V2\0const key = "${SYNTHETIC_SECRET}";`))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-supabase-secret-key'))
    rmSync(leakEszip)

    // 6. Anidado: ZIP -> TAR.GZ -> secreto (profundidad 2 <= 3)
    const nestedZip = join(dir, '.netlify/functions/nested.zip')
    const innerTarGz = gzipSync(buildTar([{ name: 'deep.js', content: `const k = "${SYNTHETIC_SECRET}"` }]))
    writeFileSync(nestedZip, buildZip([{ name: 'inner.tar.gz', content: innerTarGz, method: 0 }]))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-supabase-secret-key'))
    rmSync(nestedZip)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('auditor comprimidos: protege contra ZIP bombs, exceso de profundidad, symlinks internos y path traversal', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qrih-comp-guard-'))
  try {
    mkdirSync(join(dir, '.netlify/functions'), { recursive: true })

    // 1. ZIP bomb (512 KiB de ceros -> ratio de compresión > 100x)
    const bombZip = join(dir, '.netlify/functions/bomb.zip')
    writeFileSync(bombZip, buildZip([{ name: 'zeros.bin', content: Buffer.alloc(512 * 1024, 0) }]))
    let audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-zip-bomb'))
    rmSync(bombZip)

    // 2. Exceso de profundidad (4 capas .gz > maxDepth=3)
    const deepGz = join(dir, '.netlify/functions/deep.gz.gz.gz.gz')
    let layered = Buffer.from('ok')
    for (let i = 0; i < 4; i++) layered = gzipSync(layered)
    writeFileSync(deepGz, layered)
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-depth-exceeded'))
    rmSync(deepGz)

    // 3. Symlink dentro de ZIP y TAR.GZ
    const symZip = join(dir, '.netlify/functions/sym.zip')
    writeFileSync(symZip, buildZip([{ name: 'link.env', content: '/etc/passwd', unixMode: 0o120777 }]))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-symlink'))
    rmSync(symZip)

    const symTarGz = join(dir, '.netlify/functions/sym.tar.gz')
    writeFileSync(symTarGz, gzipSync(buildTar([{ name: 'link.env', content: '', typeFlag: '2' }])))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-symlink'))
    rmSync(symTarGz)

    // 4. Path traversal dentro de ZIP y TAR.GZ (nunca escribe en disco)
    const travZip = join(dir, '.netlify/functions/trav.zip')
    writeFileSync(travZip, buildZip([{ name: '../../outside.txt', content: 'x' }]))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-path-traversal'))
    rmSync(travZip)

    const travTarGz = join(dir, '.netlify/functions/trav.tar.gz')
    writeFileSync(travTarGz, gzipSync(buildTar([{ name: '../escape.env', content: 'x' }])))
    audit = auditBuildArtifacts(dir, { privateKey: '', scanNetlify: true })
    assert.equal(audit.ok, false)
    assert.ok(audit.findings.some((f) => f.rule === 'archive-path-traversal'))
    rmSync(travTarGz)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
