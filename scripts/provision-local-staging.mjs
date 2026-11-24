import {
  constants,
  openSync,
  closeSync,
  readFileSync,
  fstatSync,
  lstatSync,
  existsSync,
  mkdirSync,
  chmodSync,
  unlinkSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  checkLocalStaging,
  verifyStagingCredentials,
} from './local-environment.mjs'

export const LOCAL_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const PUBLIC_KEYS = LOCAL_KEYS.slice(0, 2)
const PRIVATE_KEY = 'SUPABASE_SERVICE_ROLE_KEY'

export function stagingValues(text) {
  const values = {}
  const allowed = [...LOCAL_KEYS, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue

    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)

    if (
      !match ||
      !allowed.includes(match[1]) ||
      Object.hasOwn(values, match[1])
    ) throw Error()

    let value = match[2]

    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1)
    if (!/^[A-Za-z0-9_./:-]+$/.test(value)) throw Error()

    values[match[1]] = value
  }

  const selected = Object.fromEntries(LOCAL_KEYS.map(key => [key, values[key]]))

  if (checkLocalStaging(selected).length) throw Error()

  if (
    values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !==
      selected.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) throw Error()

  return selected
}

function createPrivateFile(path, content) {
  const descriptor = openSync(
    path,
    constants.O_WRONLY | constants.O_CREAT |
      constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  )

  try {
    writeFileSync(descriptor, content)
    const metadata = fstatSync(descriptor)

    if (
      !metadata.isFile() ||
      metadata.uid !== process.getuid() ||
      (metadata.mode & 0o777) !== 0o600
    ) throw Error()
  } finally {
    closeSync(descriptor)
  }
}

function assertIgnored(root, path) {
  const result = spawnSync(
    'git',
    ['check-ignore', '-q', '--', path],
    { cwd: root },
  )

  if (result.status !== 0) throw Error()
}

export async function provision(
  source,
  root,
  { verifyCredentials = verifyStagingCredentials } = {},
) {
  const publicFile = join(root, '.env.local')
  const secretDirectory = join(root, '.secrets')
  const secretFile = join(secretDirectory, 'staging.env')

  let directoryCreated = false
  let secretCreated = false
  let publicCreated = false

  try {
    if (
      [
        '.env',
        '.env.local',
        '.env.production',
        '.env.production.local',
        '.env.development',
        '.env.development.local',
      ].some(name => existsSync(join(root, name))) ||
      existsSync(secretDirectory)
    ) throw Error()

    assertIgnored(root, '.env.local')
    assertIgnored(root, '.secrets/staging.env')

    const descriptor = openSync(
      source,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    )

    let values

    try {
      const metadata = fstatSync(descriptor)

      if (
        !metadata.isFile() ||
        metadata.uid !== process.getuid() ||
        (metadata.mode & 0o777) !== 0o600
      ) throw Error()

      values = stagingValues(readFileSync(descriptor, 'utf8'))
    } finally {
      closeSync(descriptor)
    }

    await verifyCredentials(values)

    mkdirSync(secretDirectory, { mode: 0o700 })
    directoryCreated = true
    chmodSync(secretDirectory, 0o700)

    const directoryMetadata = lstatSync(secretDirectory)

    if (
      !directoryMetadata.isDirectory() ||
      directoryMetadata.uid !== process.getuid() ||
      (directoryMetadata.mode & 0o777) !== 0o700
    ) throw Error()

    createPrivateFile(
      secretFile,
      `${PRIVATE_KEY}=${values[PRIVATE_KEY]}\n`,
    )
    secretCreated = true

    const publicOutput = PUBLIC_KEYS
      .map(key => `${key}=${values[key]}`)
      .join('\n') + '\n'

    createPrivateFile(publicFile, publicOutput)
    publicCreated = true

    if (readFileSync(publicFile, 'utf8') !== publicOutput) throw Error()

    const secretContent = readFileSync(secretFile, 'utf8')
    if (secretContent !== `${PRIVATE_KEY}=${values[PRIVATE_KEY]}\n`) {
      throw Error()
    }
  } catch {
    if (publicCreated) unlinkSync(publicFile)
    if (secretCreated) unlinkSync(secretFile)
    if (directoryCreated) rmdirSync(secretDirectory)

    throw new Error(
      'No se pudo consolidar la configuración STAGING. No se sobrescribieron archivos existentes; revisa origen, permisos y destino sin compartir claves.',
    )
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.length !== 3) throw Error()

    await provision(
      resolve(process.argv[2]),
      dirname(dirname(fileURLToPath(import.meta.url))),
    )

    console.log(
      'PASS — configuración STAGING separada: archivo público y secreto privado, permisos verificados y archivos ignorados por Git; sin mostrar valores.',
    )
  } catch {
    console.error(
      'Configuración no consolidada. No se sobrescribió ningún archivo; revisar origen, permisos y destino sin compartir claves.',
    )
    process.exitCode = 1
  }
}
