import { constants, existsSync, lstatSync, openSync, closeSync, fstatSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { brotliDecompressSync, gunzipSync, inflateRawSync } from 'node:zlib'

const SECRET_PATTERNS = [
  ['supabase-secret-key', /sb_secret_[A-Za-z0-9_-]{8,}/g],
  ['private-key-pem', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['literal-service-role-assignment', /SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["'][A-Za-z0-9_./+-]{16,}["']/g],
]

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
const ENV_FILENAME = /^\.env(?:\..+)?$|^staging\.env$/

// Límites estrictos para inspección segura en memoria de archivos comprimidos (sin extraer a disco).
export const ARCHIVE_AUDIT_LIMITS = {
  maxInputBytes: 64 * 1024 * 1024, // 64 MiB entrada comprimida
  maxEntryUncompressedBytes: 16 * 1024 * 1024, // 16 MiB por archivo interno
  maxTotalUncompressedBytes: 64 * 1024 * 1024, // 64 MiB acumulados por archivo compuesto
  maxEntries: 5000,
  maxDepth: 3,
  maxCompressionRatio: 100, // para entradas > 64 KiB descomprimidos
}

const ARCHIVE_EXTENSION_RE = /\.(?:zip|tar\.gz|tgz|tar|gz|br|eszip)$/i
const SKIPPABLE_MEDIA_RE = /\.(?:png|jpe?g|webp|gif|avif|ico|woff2?|ttf|otf|mp4|pdf)$/i

function isServiceRoleJwt(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    return payload?.role === 'service_role'
  } catch {
    return false
  }
}

function collectFiles(rootDir, currentDir, findings, area, out) {
  let entries
  try {
    entries = readdirSync(currentDir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(currentDir, entry.name)
    const rel = relative(rootDir, full)
    let stat
    try {
      stat = lstatSync(full)
    } catch {
      findings.push({ area, file: rel, rule: 'unreadable-artifact' })
      continue
    }
    if (stat.isSymbolicLink()) {
      // Next.js crea enlaces internos en .next/node_modules para paquetes externos (sharp, @react-pdf/renderer).
      if (area !== 'next-static' && /(?:^|\/)node_modules\//.test(rel)) continue
      findings.push({ area, file: rel, rule: 'symlink-in-artifact' })
      continue
    }
    if (stat.isDirectory()) {
      if (area !== 'next-static' && entry.name === 'node_modules') continue
      collectFiles(rootDir, full, findings, area, out)
    } else if (stat.isFile()) {
      out.push({ full, rel, name: entry.name })
    }
  }
}

function secretVariants(privateKey) {
  if (!privateKey || /^\*+/.test(privateKey)) return []
  const variants = new Set([privateKey])
  try {
    variants.add(encodeURIComponent(privateKey))
  } catch { /* ignore */ }
  variants.add(Buffer.from(privateKey, 'utf8').toString('base64'))
  variants.add(Buffer.from(privateKey, 'utf8').toString('base64url'))
  return Array.from(variants).filter(v => v.length >= 8)
}

function readRegularFile(fullPath, { maxBytes = ARCHIVE_AUDIT_LIMITS.maxInputBytes } = {}) {
  let fd
  try {
    fd = openSync(fullPath, constants.O_RDONLY | constants.O_NOFOLLOW)
    const stat = fstatSync(fd)
    if (!stat.isFile()) return { kind: 'skip' }
    if (stat.size > 32 * 1024 * 1024 && SKIPPABLE_MEDIA_RE.test(fullPath)) {
      return { kind: 'skip' }
    }
    if (stat.size > maxBytes && ARCHIVE_EXTENSION_RE.test(fullPath)) {
      return { kind: 'oversized-archive' }
    }
    return { kind: 'ok', buf: readFileSync(fd) }
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}

function hasArchiveTraversal(entryPath) {
  if (!entryPath) return false
  if (entryPath.startsWith('/') || entryPath.startsWith('\\') || /^[A-Za-z]:/.test(entryPath)) return true
  const normalized = entryPath.replace(/\\/g, '/')
  return normalized.split('/').some(segment => segment === '..')
}

function scanPlainBuffer(buf, { area, rel, name, forbidIdentifier, variants, prefix = '' }) {
  const fileFindings = []
  const rulePrefix = prefix ? `${prefix}-` : ''
  if (ENV_FILENAME.test(name)) {
    const text = buf.toString('utf8')
    if (/(?:^|\n)\s*(?:export\s+)?SUPABASE_SERVICE_ROLE_KEY\s*=/.test(text) || /sb_secret_[A-Za-z0-9_-]{8,}/.test(text)) {
      fileFindings.push({ area, file: rel, rule: `${rulePrefix}env-file-with-private-secret` })
    }
  }

  for (const variant of variants) {
    if (buf.includes(Buffer.from(variant, 'utf8'))) {
      fileFindings.push({ area, file: rel, rule: `${rulePrefix}private-secret-value` })
      break
    }
  }

  const isSourceMap = rel.endsWith('.map')
  const text = buf.toString('utf8')

  if (forbidIdentifier && text.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    fileFindings.push({
      area,
      file: rel,
      rule: `${rulePrefix}${isSourceMap ? 'client-sourcemap-secret-identifier' : 'client-secret-identifier'}`,
    })
  }

  for (const [rule, pattern] of SECRET_PATTERNS) {
    pattern.lastIndex = 0
    if (pattern.test(text)) {
      fileFindings.push({ area, file: rel, rule: `${rulePrefix}${isSourceMap ? `sourcemap-${rule}` : rule}` })
    }
  }

  JWT_PATTERN.lastIndex = 0
  for (const match of text.matchAll(JWT_PATTERN)) {
    if (isServiceRoleJwt(match[0])) {
      fileFindings.push({
        area,
        file: rel,
        rule: `${rulePrefix}${isSourceMap ? 'sourcemap-service-role-jwt' : 'service-role-jwt'}`,
      })
      break
    }
  }

  return fileFindings
}

function parseTarEntries(tarBuf, { area, rel, limits, state }) {
  const entries = []
  const findings = []
  let offset = 0
  while (offset + 512 <= tarBuf.length) {
    const header = tarBuf.subarray(offset, offset + 512)
    let allZero = true
    for (let i = 0; i < 512; i++) {
      if (header[i] !== 0) {
        allZero = false
        break
      }
    }
    if (allZero) break

    const rawName = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '')
    const rawPrefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/, '')
    const entryPath = rawPrefix ? `${rawPrefix}/${rawName}` : rawName
    const sizeOctal = header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim()
    const size = sizeOctal ? parseInt(sizeOctal, 8) : 0
    const typeFlag = String.fromCharCode(header[156] || 48)

    if (!Number.isFinite(size) || size < 0 || offset + 512 + size > tarBuf.length) {
      findings.push({ area, file: rel, rule: 'archive-corrupt-tar' })
      break
    }

    state.entries++
    if (state.entries > limits.maxEntries) {
      findings.push({ area, file: rel, rule: 'archive-too-many-entries' })
      break
    }

    if (hasArchiveTraversal(entryPath)) {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-path-traversal' })
    }

    if (typeFlag === '2' || typeFlag === '1') {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-symlink' })
    } else if (typeFlag === '0' || typeFlag === '\0') {
      if (size > limits.maxEntryUncompressedBytes || state.totalBytes + size > limits.maxTotalUncompressedBytes) {
        findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-size-limit' })
        break
      }
      state.totalBytes += size
      entries.push({
        entryPath,
        data: tarBuf.subarray(offset + 512, offset + 512 + size),
      })
    }

    const padded = Math.ceil(size / 512) * 512
    offset += 512 + padded
  }
  return { entries, findings }
}

function findZipEocd(buf) {
  const minPos = Math.max(0, buf.length - 65557)
  for (let i = buf.length - 22; i >= minPos; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      return i
    }
  }
  return -1
}

function parseZipEntries(zipBuf, { area, rel, limits, state }) {
  const entries = []
  const findings = []
  const eocdPos = findZipEocd(zipBuf)
  if (eocdPos < 0) {
    findings.push({ area, file: rel, rule: 'archive-corrupt-zip' })
    return { entries, findings }
  }

  const totalEntries = zipBuf.readUInt16LE(eocdPos + 10)
  const cdSize = zipBuf.readUInt32LE(eocdPos + 12)
  const cdOffset = zipBuf.readUInt32LE(eocdPos + 16)

  if (totalEntries > limits.maxEntries) {
    findings.push({ area, file: rel, rule: 'archive-too-many-entries' })
    return { entries, findings }
  }
  if (cdOffset + cdSize > zipBuf.length) {
    findings.push({ area, file: rel, rule: 'archive-corrupt-zip' })
    return { entries, findings }
  }

  let cursor = cdOffset
  for (let i = 0; i < totalEntries; i++) {
    if (cursor + 46 > cdOffset + cdSize || zipBuf.readUInt32LE(cursor) !== 0x02014b50) {
      findings.push({ area, file: rel, rule: 'archive-corrupt-zip' })
      break
    }

    const method = zipBuf.readUInt16LE(cursor + 10)
    const compressedSize = zipBuf.readUInt32LE(cursor + 20)
    const uncompressedSize = zipBuf.readUInt32LE(cursor + 24)
    const nameLen = zipBuf.readUInt16LE(cursor + 28)
    const extraLen = zipBuf.readUInt16LE(cursor + 30)
    const commentLen = zipBuf.readUInt16LE(cursor + 32)
    const externalAttr = zipBuf.readUInt32LE(cursor + 38)
    const localHeaderOffset = zipBuf.readUInt32LE(cursor + 42)

    const entryPath = zipBuf.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8')
    cursor += 46 + nameLen + extraLen + commentLen

    state.entries++
    if (state.entries > limits.maxEntries) {
      findings.push({ area, file: rel, rule: 'archive-too-many-entries' })
      break
    }

    if (hasArchiveTraversal(entryPath)) {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-path-traversal' })
      continue
    }

    const unixMode = (externalAttr >>> 16) & 0o170000
    if (unixMode === 0o120000) {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-symlink' })
      continue
    }

    if (entryPath.endsWith('/')) continue

    if (
      uncompressedSize > limits.maxEntryUncompressedBytes ||
      state.totalBytes + uncompressedSize > limits.maxTotalUncompressedBytes
    ) {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-size-limit' })
      break
    }

    if (
      uncompressedSize > 64 * 1024 &&
      uncompressedSize / Math.max(compressedSize, 1) > limits.maxCompressionRatio
    ) {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-zip-bomb' })
      break
    }

    if (localHeaderOffset + 30 > zipBuf.length || zipBuf.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-corrupt-zip' })
      break
    }

    const localNameLen = zipBuf.readUInt16LE(localHeaderOffset + 26)
    const localExtraLen = zipBuf.readUInt16LE(localHeaderOffset + 28)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const dataEnd = dataStart + compressedSize
    if (dataEnd > zipBuf.length) {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-corrupt-zip' })
      break
    }

    const slice = zipBuf.subarray(dataStart, dataEnd)
    let data
    if (method === 0) {
      data = slice
    } else if (method === 8) {
      const remaining = limits.maxTotalUncompressedBytes - state.totalBytes
      const cap = Math.min(limits.maxEntryUncompressedBytes, remaining)
      try {
        data = inflateRawSync(slice, { maxOutputLength: cap })
      } catch (err) {
        const code = err && typeof err === 'object' ? err.code : ''
        findings.push({
          area,
          file: `${rel}!/${entryPath}`,
          rule: code === 'ERR_BUFFER_TOO_LARGE' ? 'archive-zip-bomb' : 'archive-corrupt-zip',
        })
        break
      }
      if (data.length > 64 * 1024 && data.length / Math.max(compressedSize, 1) > limits.maxCompressionRatio) {
        findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-zip-bomb' })
        break
      }
    } else {
      findings.push({ area, file: `${rel}!/${entryPath}`, rule: 'archive-unsupported-zip-method' })
      continue
    }

    state.totalBytes += data.length
    entries.push({ entryPath, data })
  }

  return { entries, findings }
}

function scanArchiveOrBuffer(buf, ctx, depth = 0, state = { entries: 0, totalBytes: 0 }) {
  const { area, rel, name, forbidIdentifier, variants, limits = ARCHIVE_AUDIT_LIMITS } = ctx
  const lower = name.toLowerCase()
  const isZip = lower.endsWith('.zip')
  const isTarGz = lower.endsWith('.tar.gz') || lower.endsWith('.tgz')
  const isTar = lower.endsWith('.tar')
  const isGz = !isTarGz && lower.endsWith('.gz')
  const isBr = lower.endsWith('.br')
  const isEszip = lower.endsWith('.eszip')
  const isArchive = isZip || isTarGz || isTar || isGz || isBr || isEszip

  if (!isArchive) {
    return scanPlainBuffer(buf, {
      area,
      rel,
      name,
      forbidIdentifier,
      variants,
      prefix: depth > 0 ? 'archive' : '',
    })
  }

  if (depth >= limits.maxDepth) {
    return [{ area, file: rel, rule: 'archive-depth-exceeded' }]
  }

  if (buf.length > limits.maxInputBytes) {
    return [{ area, file: rel, rule: 'archive-size-limit' }]
  }

  const findings = []

  if (isEszip) {
    // ESZIP v2 (Deno/Netlify Edge Bundler) inicia con "ESZIP_V2" y almacena fuentes/mapas en UTF-8.
    const magic = buf.subarray(0, 8).toString('utf8')
    if (magic !== 'ESZIP_V2' && magic !== 'ESZIP_V1') {
      findings.push({ area, file: rel, rule: 'archive-unsupported-eszip' })
      return findings
    }
    findings.push(
      ...scanPlainBuffer(buf, {
        area,
        rel,
        name,
        forbidIdentifier,
        variants,
        prefix: 'archive',
      }),
    )
    return findings
  }

  if (isGz || isTarGz) {
    const remaining = limits.maxTotalUncompressedBytes - state.totalBytes
    const cap = Math.min(limits.maxTotalUncompressedBytes, remaining)
    let inflated
    try {
      inflated = gunzipSync(buf, { maxOutputLength: cap })
    } catch (err) {
      const code = err && typeof err === 'object' ? err.code : ''
      findings.push({
        area,
        file: rel,
        rule: code === 'ERR_BUFFER_TOO_LARGE' ? 'archive-zip-bomb' : 'archive-corrupt-gzip',
      })
      return findings
    }
    if (inflated.length > 64 * 1024 && inflated.length / Math.max(buf.length, 1) > limits.maxCompressionRatio) {
      findings.push({ area, file: rel, rule: 'archive-zip-bomb' })
      return findings
    }
    if (isTarGz) {
      const parsed = parseTarEntries(inflated, { area, rel, limits, state })
      findings.push(...parsed.findings)
      for (const entry of parsed.entries) {
        findings.push(
          ...scanArchiveOrBuffer(
            entry.data,
            {
              area,
              rel: `${rel}!/${entry.entryPath}`,
              name: basename(entry.entryPath),
              forbidIdentifier,
              variants,
              limits,
            },
            depth + 1,
            state,
          ),
        )
      }
      return findings
    }
    state.totalBytes += inflated.length
    const innerName = name.slice(0, -3) || name
    return scanArchiveOrBuffer(
      inflated,
      { area, rel: `${rel}!/${innerName}`, name: innerName, forbidIdentifier, variants, limits },
      depth + 1,
      state,
    )
  }

  if (isBr) {
    const remaining = limits.maxTotalUncompressedBytes - state.totalBytes
    const cap = Math.min(limits.maxTotalUncompressedBytes, remaining)
    let inflated
    try {
      inflated = brotliDecompressSync(buf, { maxOutputLength: cap })
    } catch (err) {
      const code = err && typeof err === 'object' ? err.code : ''
      findings.push({
        area,
        file: rel,
        rule: code === 'ERR_BUFFER_TOO_LARGE' ? 'archive-zip-bomb' : 'archive-corrupt-brotli',
      })
      return findings
    }
    if (inflated.length > 64 * 1024 && inflated.length / Math.max(buf.length, 1) > limits.maxCompressionRatio) {
      findings.push({ area, file: rel, rule: 'archive-zip-bomb' })
      return findings
    }
    state.totalBytes += inflated.length
    const innerName = name.slice(0, -3) || name
    return scanArchiveOrBuffer(
      inflated,
      { area, rel: `${rel}!/${innerName}`, name: innerName, forbidIdentifier, variants, limits },
      depth + 1,
      state,
    )
  }

  if (isTar) {
    const parsed = parseTarEntries(buf, { area, rel, limits, state })
    findings.push(...parsed.findings)
    for (const entry of parsed.entries) {
      findings.push(
        ...scanArchiveOrBuffer(
          entry.data,
          {
            area,
            rel: `${rel}!/${entry.entryPath}`,
            name: basename(entry.entryPath),
            forbidIdentifier,
            variants,
            limits,
          },
          depth + 1,
          state,
        ),
      )
    }
    return findings
  }

  if (isZip) {
    const parsed = parseZipEntries(buf, { area, rel, limits, state })
    findings.push(...parsed.findings)
    for (const entry of parsed.entries) {
      findings.push(
        ...scanArchiveOrBuffer(
          entry.data,
          {
            area,
            rel: `${rel}!/${entry.entryPath}`,
            name: basename(entry.entryPath),
            forbidIdentifier,
            variants,
            limits,
          },
          depth + 1,
          state,
        ),
      )
    }
    return findings
  }

  return findings
}

export function auditBuildArtifacts(root, { privateKey = '', scanNetlify = true, archiveLimits = ARCHIVE_AUDIT_LIMITS } = {}) {
  const findings = []
  const areasScanned = []
  let scannedFiles = 0
  const variants = secretVariants(privateKey)

  function inspectItem(item, area, forbidIdentifier) {
    scannedFiles++
    const read = readRegularFile(item.full, { maxBytes: archiveLimits.maxInputBytes })
    if (read.kind === 'skip') return
    if (read.kind === 'oversized-archive') {
      findings.push({ area, file: item.rel, rule: 'archive-size-limit' })
      return
    }
    findings.push(
      ...scanArchiveOrBuffer(read.buf, {
        area,
        rel: item.rel,
        name: item.name,
        forbidIdentifier,
        variants,
        limits: archiveLimits,
      }),
    )
  }

  const nextDir = join(root, '.next')
  if (existsSync(nextDir)) {
    const staticDir = join(nextDir, 'static')
    const serverDir = join(nextDir, 'server')

    if (existsSync(staticDir)) {
      const staticFiles = []
      collectFiles(root, staticDir, findings, 'next-static', staticFiles)
      areasScanned.push({ area: 'next-static', files: staticFiles.length })
      for (const item of staticFiles) inspectItem(item, 'next-static', true)
    }

    if (existsSync(serverDir)) {
      const serverFiles = []
      collectFiles(root, serverDir, findings, 'next-server', serverFiles)
      areasScanned.push({ area: 'next-server', files: serverFiles.length })
      for (const item of serverFiles) inspectItem(item, 'next-server', false)
    }

    // Remaining files under .next (manifests, cache, diagnostics, trace, maps).
    const otherFiles = []
    for (const entry of readdirSync(nextDir, { withFileTypes: true })) {
      if (entry.name === 'static' || entry.name === 'server' || entry.name === 'node_modules') continue
      const full = join(nextDir, entry.name)
      const rel = relative(root, full)
      const stat = lstatSync(full)
      if (stat.isSymbolicLink()) {
        findings.push({ area: 'next-other', file: rel, rule: 'symlink-in-artifact' })
        continue
      }
      if (stat.isDirectory()) {
        collectFiles(root, full, findings, 'next-other', otherFiles)
      } else if (stat.isFile()) {
        otherFiles.push({ full, rel, name: entry.name })
      }
    }
    areasScanned.push({ area: 'next-other', files: otherFiles.length })
    for (const item of otherFiles) inspectItem(item, 'next-other', false)
  }

  const netlifyDir = join(root, '.netlify')
  if (scanNetlify && existsSync(netlifyDir)) {
    const netlifyFiles = []
    for (const entry of readdirSync(netlifyDir, { withFileTypes: true })) {
      // Skip installed plugin node_modules; inspect generated functions, edge-functions, static, deploy, config.
      if (entry.name === 'plugins') continue
      const full = join(netlifyDir, entry.name)
      const rel = relative(root, full)
      const stat = lstatSync(full)
      if (stat.isSymbolicLink()) {
        findings.push({ area: 'netlify-artifacts', file: rel, rule: 'symlink-in-artifact' })
        continue
      }
      if (stat.isDirectory()) {
        collectFiles(root, full, findings, 'netlify-artifacts', netlifyFiles)
      } else if (stat.isFile()) {
        netlifyFiles.push({ full, rel, name: entry.name })
      }
    }
    const relevantNetlify = netlifyFiles.filter(f => !f.rel.includes('/node_modules/'))
    areasScanned.push({ area: 'netlify-artifacts', files: relevantNetlify.length })
    for (const item of relevantNetlify) {
      const isStatic = item.rel.startsWith('.netlify/static/')
      inspectItem(item, 'netlify-artifacts', isStatic)
    }
  }

  return {
    ok: findings.length === 0,
    hasNextBuild: existsSync(nextDir),
    scannedFiles,
    areasScanned,
    findings,
  }
}
