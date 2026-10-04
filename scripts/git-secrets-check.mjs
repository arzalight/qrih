// Revisión del índice que se va a publicar. No imprime valores ni altera archivos.
import { execFileSync } from 'node:child_process'

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const forbidden = /(^|\/)(?:node_modules|\.next|\.netlify|work|outputs|\.temp|\.branches|migration-backup)(\/|$)|(^|\/)\.env(?:\..*)?$|(?:\.bak(?:-.*)?|\.backup|\.tsbuildinfo|\.log|\.tmp|\.zip|\.dump|\.pem|\.key)$/
const rules = [
  ['supabase-private-key', /sb_secret_[A-Za-z0-9_-]{20,}/g],
  ['github-token', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/g],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['credential-uri', /(?:postgres(?:ql)?|https?):\/\/[^\s/@]+:[^\s/@]+@/g],
  ['literal-secret', /(?:access_token|client_secret|password|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][A-Za-z0-9_+\/-]{24,}["']/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
]
const findings = []
for (const file of files) {
  if (file !== '.env.example' && forbidden.test(file)) findings.push({ file, rule: 'generated-or-sensitive-file' })
  const bytes = execFileSync('git', ['show', `:${file}`], { maxBuffer: 16 * 1024 * 1024 })
  if (bytes.includes(0)) continue
  const source = bytes.toString('utf8')
  for (const [rule, regex] of rules) {
    for (const match of source.matchAll(regex)) findings.push({ file, line: source.slice(0, match.index).split('\n').length, rule })
  }
  for (const match of source.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    let role
    try { role = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString()).role } catch {}
    if (role !== 'anon') findings.push({ file, line: source.slice(0, match.index).split('\n').length, rule: 'non-public-jwt' })
  }
}
console.log(JSON.stringify({ scannedIndexFiles: files.length, findings }, null, 2))
if (!files.length || findings.length) process.exitCode = 1
