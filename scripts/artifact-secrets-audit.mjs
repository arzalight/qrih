import { constants, existsSync, lstatSync, openSync, closeSync, fstatSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const SECRET_PATTERNS = [
  ['supabase-secret-key', /sb_secret_[A-Za-z0-9_-]{8,}/g],
  ['private-key-pem', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['literal-service-role-assignment', /SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["'][A-Za-z0-9_./+-]{16,}["']/g],
]

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
const ENV_FILENAME = /^\.env(?:\..+)?$|^staging\.env$/

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

function readRegularFile(fullPath) {
  let fd
  try {
    fd = openSync(fullPath, constants.O_RDONLY | constants.O_NOFOLLOW)
    const stat = fstatSync(fd)
    if (!stat.isFile()) return null
    // Skip very large pure binary assets (> 32 MiB) only if they have binary media extensions.
    if (stat.size > 32 * 1024 * 1024 && /\.(?:png|jpe?g|webp|gif|avif|ico|woff2?|ttf|otf|mp4|pdf|zip)$/i.test(fullPath)) {
      return null
    }
    return readFileSync(fd)
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}

function scanBuffer(buf, { area, rel, name, forbidIdentifier, variants }) {
  const fileFindings = []
  if (ENV_FILENAME.test(name)) {
    const text = buf.toString('utf8')
    if (/(?:^|\n)\s*(?:export\s+)?SUPABASE_SERVICE_ROLE_KEY\s*=/.test(text) || /sb_secret_[A-Za-z0-9_-]{8,}/.test(text)) {
      fileFindings.push({ area, file: rel, rule: 'env-file-with-private-secret' })
    }
  }

  for (const variant of variants) {
    if (buf.includes(Buffer.from(variant, 'utf8'))) {
      fileFindings.push({ area, file: rel, rule: 'private-secret-value' })
      break
    }
  }

  // Convert to utf8/latin1 for text, source maps, manifests, and cache inspection.
  const isSourceMap = rel.endsWith('.map')
  const text = buf.toString('utf8')

  if (forbidIdentifier && text.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    fileFindings.push({ area, file: rel, rule: isSourceMap ? 'client-sourcemap-secret-identifier' : 'client-secret-identifier' })
  }

  for (const [rule, pattern] of SECRET_PATTERNS) {
    pattern.lastIndex = 0
    if (pattern.test(text)) {
      fileFindings.push({ area, file: rel, rule: isSourceMap ? `sourcemap-${rule}` : rule })
    }
  }

  JWT_PATTERN.lastIndex = 0
  for (const match of text.matchAll(JWT_PATTERN)) {
    if (isServiceRoleJwt(match[0])) {
      fileFindings.push({ area, file: rel, rule: isSourceMap ? 'sourcemap-service-role-jwt' : 'service-role-jwt' })
      break
    }
  }

  return fileFindings
}

export function auditBuildArtifacts(root, { privateKey = '', scanNetlify = true } = {}) {
  const findings = []
  const areasScanned = []
  let scannedFiles = 0
  const variants = secretVariants(privateKey)

  const nextDir = join(root, '.next')
  if (existsSync(nextDir)) {
    const staticDir = join(nextDir, 'static')
    const serverDir = join(nextDir, 'server')

    if (existsSync(staticDir)) {
      const staticFiles = []
      collectFiles(root, staticDir, findings, 'next-static', staticFiles)
      areasScanned.push({ area: 'next-static', files: staticFiles.length })
      for (const item of staticFiles) {
        scannedFiles++
        const buf = readRegularFile(item.full)
        if (!buf) continue
        findings.push(...scanBuffer(buf, { area: 'next-static', rel: item.rel, name: item.name, forbidIdentifier: true, variants }))
      }
    }

    if (existsSync(serverDir)) {
      const serverFiles = []
      collectFiles(root, serverDir, findings, 'next-server', serverFiles)
      areasScanned.push({ area: 'next-server', files: serverFiles.length })
      for (const item of serverFiles) {
        scannedFiles++
        const buf = readRegularFile(item.full)
        if (!buf) continue
        findings.push(...scanBuffer(buf, { area: 'next-server', rel: item.rel, name: item.name, forbidIdentifier: false, variants }))
      }
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
    for (const item of otherFiles) {
      scannedFiles++
      const buf = readRegularFile(item.full)
      if (!buf) continue
      findings.push(...scanBuffer(buf, { area: 'next-other', rel: item.rel, name: item.name, forbidIdentifier: false, variants }))
    }
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
      scannedFiles++
      const buf = readRegularFile(item.full)
      if (!buf) continue
      const isStatic = item.rel.startsWith('.netlify/static/')
      findings.push(...scanBuffer(buf, { area: 'netlify-artifacts', rel: item.rel, name: item.name, forbidIdentifier: isStatic, variants }))
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
