import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

test('CI: fixtures de escritura aíslan SITE_ID/URL heredados sin desactivar el guard de origen', () => {
  const result = spawnSync(process.execPath, [
    '--test', '--test-reporter=tap',
    'tests/profile-property-management.test.mjs',
    'tests/property-write-errors.test.mjs',
    'tests/opportunities.test.mjs',
  ], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    // No real env loader, app keys, credentials, preload options or network actors.
    env: { PATH: process.env.PATH, LANG: 'C', LC_ALL: 'C', CI: 'true',
      NETLIFY: 'true', NODE_ENV: 'production', SITE_ID: 'synthetic-netlify-site',
      URL: 'https://synthetic-netlify-provider.invalid' },
    encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024,
  })
  assert.equal(result.error, undefined, 'El proceso sintético debe terminar dentro del límite')
  assert.equal(result.status, 0, 'Las suites deben pasar también con SITE_ID y URL de un proveedor heredados')
  assert.match(result.stdout, /# tests 38\b/)
  assert.match(result.stdout, /# fail 0\b/)
  assert.match(result.stdout, /# skipped 0\b/)
})

