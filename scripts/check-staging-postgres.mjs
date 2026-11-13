// Human-only handoff. No capture, restore, migrations or configurable destination.
// The pinned verifier asks for the password directly through psql's hidden prompt.
import { readFileSync, lstatSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const verifier = '/Users/fabianlira/Documents/Codex/2026-10-03/referenced-chatgpt-conversation-this-is-an/work/aud018-tools-20261006.KqHlHu/check-staging-connection.mjs'
const expectedHash = 'f02b74bef24efc91cdae2d3dd16ffb817a72287877e51f884f79d544d06e753b'
try {
  const args = process.argv.slice(2)
  if (args.length > 1 || (args.length === 1 && args[0] !== '--self-test')) throw Error()
  const selfTest = args[0] === '--self-test'
  if (!selfTest && (!process.stdin.isTTY || !process.stdout.isTTY)) {
    console.log('Abre un terminal personal interactivo. No introduzcas la contraseña en el chat.')
    process.exit(1)
  }
  const metadata = lstatSync(verifier)
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.uid !== process.getuid()
    || createHash('sha256').update(readFileSync(verifier)).digest('hex') !== expectedHash) throw Error()
  const env = { LANG: 'C', LC_ALL: 'C' }
  for (const key of ['HOME', 'USER', 'LOGNAME', 'PATH', 'TMPDIR']) if (process.env[key]) env[key] = process.env[key]
  console.log('Sólo QRIH STAGING: mcyxunymhuxyiwklyfpy. Sin exportación/restauración/migraciones.')
  const result = spawnSync(process.execPath, [verifier, selfTest ? '--self-test' : '--connect'], {
    env, stdio: 'inherit', timeout: 180000,
  })
  process.exitCode = result.status === 0 && !result.error && !result.signal ? 0 : 1
} catch {
  console.log('Verificador no confirmado. No se inició conexión ni captura; no compartas credenciales.')
  process.exitCode = 1
}
