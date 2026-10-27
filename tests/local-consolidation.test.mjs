import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { LOCAL_KEYS, stagingValues } from '../scripts/provision-local-staging.mjs'
import { STAGING_ORIGIN, STAGING_PROJECT_REF } from '../scripts/local-environment.mjs'

const token = role => ['synthetic', Buffer.from(JSON.stringify({ role, ref: STAGING_PROJECT_REF })).toString('base64url'), 'synthetic'].join('.')
const valid = () => `NEXT_PUBLIC_SUPABASE_URL=${STAGING_ORIGIN}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${token('anon')}\nSUPABASE_SERVICE_ROLE_KEY=${token('service_role')}\n`
test('consolidación: sólo tres variables necesarias, STAGING y sin alias innecesario', () => {
  assert.deepEqual(Object.keys(stagingValues(valid())), LOCAL_KEYS)
  assert.deepEqual(Object.keys(stagingValues(valid() + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${token('anon')}\n`)), LOCAL_KEYS)
})
test('consolidación: rechaza otro proyecto, claves cruzadas, secretos extra y valores ambiguos', () => {
  for (const input of [valid().replace(STAGING_ORIGIN, 'https://other.supabase.co'),
    valid().replace(token('service_role'), token('anon')), valid() + 'PGPASSWORD=synthetic\n',
    valid() + 'NEXT_PUBLIC_SUPABASE_URL=duplicate\n', valid().replace(token('anon'), '$INHERITED'),
    valid() + 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_other\n']) assert.throws(() => stagingValues(input))
})
test('consolidación: provisioning explícito, exclusivo y no invocado al arrancar', () => {
  const source = readFileSync(new URL('../scripts/provision-local-staging.mjs', import.meta.url), 'utf8')
  assert.match(source, /O_EXCL/); assert.match(source, /O_NOFOLLOW/); assert.match(source, /0o600/)
  assert.match(source, /await verifyStagingCredentials\(values\)/)
  for (const name of ['local-next.mjs', 'local-environment.mjs', 'deployment-preflight.mjs']) {
    const runtime = readFileSync(new URL('../scripts/' + name, import.meta.url), 'utf8')
    assert.doesNotMatch(runtime, /perfecto-con-esas|provision-local-staging|sprint1-local-env/)
  }
})
