import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { checkLocalStaging, verifyStagingCredentials, localBuildTag, assertLocalBuild,
  STAGING_ORIGIN, STAGING_PROJECT_REF } from '../scripts/local-environment.mjs'

const env = () => ({ NEXT_PUBLIC_SUPABASE_URL: STAGING_ORIGIN,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_synthetic', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_synthetic' })
const jwt = (role, ref) => `synthetic.${Buffer.from(JSON.stringify({role, ref})).toString('base64url')}.synthetic`

test('AUD-034: sólo origen staging canónico; original/rutas/credenciales/queries rechazados', () => {
  assert.deepEqual(checkLocalStaging(env()), [])
  const credentials = new URL(STAGING_ORIGIN)
  credentials.username = 'synthetic'
  credentials.password = 'synthetic'
  for (const value of ['https://dmtvnwsuhehxfftddsap.supabase.co', 'http://localhost:54321',
    STAGING_ORIGIN + '/rest/v1', STAGING_ORIGIN + '?x=y', STAGING_ORIGIN + '#x',
    credentials.href, 'invalid']) {
    assert.ok(checkLocalStaging({...env(),NEXT_PUBLIC_SUPABASE_URL:value}).length)
  }
})

test('AUD-034: service_role nunca público, JWT legacy exige ref staging y privilegio correcto', () => {
  assert.deepEqual(checkLocalStaging({...env(), NEXT_PUBLIC_SUPABASE_ANON_KEY:jwt('anon',STAGING_PROJECT_REF),
    SUPABASE_SERVICE_ROLE_KEY:jwt('service_role',STAGING_PROJECT_REF)}), [])
  for (const [role,ref] of [['service_role',STAGING_PROJECT_REF],['anon','wrong-project']]) {
    assert.ok(checkLocalStaging({...env(),NEXT_PUBLIC_SUPABASE_ANON_KEY:jwt(role,ref)}).length)
  }
  for (const key of ['', 'sb_publishable_synthetic', jwt('service_role','wrong-project'),jwt('anon',STAGING_PROJECT_REF)]) {
    assert.ok(checkLocalStaging({...env(),SUPABASE_SERVICE_ROLE_KEY:key}).length)
  }
})

test('AUD-034: build sin clave privada; runtime no; CLI original y contexto Netlify rechazados', () => {
  assert.deepEqual(checkLocalStaging({...env(),SUPABASE_SERVICE_ROLE_KEY:''},{requirePrivate:false}), [])
  assert.ok(checkLocalStaging({...env(),SUPABASE_SERVICE_ROLE_KEY:''}).length)
  assert.deepEqual(checkLocalStaging(env(),{linkedRef:STAGING_PROJECT_REF}), [])
  assert.ok(checkLocalStaging(env(),{linkedRef:'dmtvnwsuhehxfftddsap'}).length)
  assert.ok(checkLocalStaging({...env(),SITE_ID:'synthetic-site'}).length)
  assert.ok(checkLocalStaging({...env(),NETLIFY:'true'}).length)
})

test('AUD-034: cargador Next respeta .env.local y env heredado; no valores en error', () => {
  const dir=mkdtempSync(join(tmpdir(),'qrih-env-test-'))
  writeFileSync(join(dir,'.env'),'NEXT_PUBLIC_SUPABASE_URL=https://dmtvnwsuhehxfftddsap.supabase.co\n')
  writeFileSync(join(dir,'.env.local'),Object.entries(env()).map(([k,v])=>`${k}=${v}`).join('\n'))
  const module=fileURLToPath(new URL('../scripts/local-environment.mjs',import.meta.url))
  const run=extra=>spawnSync(process.execPath,['--input-type=module','-e',
    `import {loadLocalStaging} from ${JSON.stringify(new URL('../scripts/local-environment.mjs',import.meta.url).href)};
    try {loadLocalStaging(${JSON.stringify(dir)});console.log('VALID')} catch {console.log('REJECTED');process.exitCode=1}`],
  {encoding:'utf8',env:{PATH:process.env.PATH,NODE_ENV:'development',...extra}})
  assert.ok(module.endsWith('.mjs'))
  assert.equal(run({}).stdout.trim(),'VALID')
  assert.equal(run({NEXT_PUBLIC_SUPABASE_URL:'https://dmtvnwsuhehxfftddsap.supabase.co'}).stdout.trim(),'REJECTED')
  mkdirSync(join(dir,'supabase/.temp'),{recursive:true})
  writeFileSync(join(dir,'supabase/.temp/project-ref'),'dmtvnwsuhehxfftddsap')
  assert.equal(run({}).stdout.trim(),'REJECTED')
  // Fixture temporal sintético, no datos del proyecto ni limpieza automática de configs.
})

test('AUD-034: claves opacas verificadas sólo host staging, sin respuesta/logs/datos', async () => {
  const calls=[]
  await verifyStagingCredentials(env(), async (url,opts)=>{
    calls.push({url,opts})
    return new Response('',{status:200})
  })
  assert.equal(calls.length,2)
  assert.ok(calls.every(c=>c.url===`${STAGING_ORIGIN}/rest/v1/` && c.opts.redirect==='error'))
  for (const fetcher of [async()=>new Response('',{status:401}),async()=>{throw new Error('PRIVATE HEADER VALUE')}]) {
    await assert.rejects(verifyStagingCredentials(env(),fetcher),error=>{
      assert.ok(!error.message.includes('PRIVATE'));return /No se pudo verificar/.test(error.message)
    })
  }
})

test('AUD-034: launcher bloquea opciones de red/trace/directorio y scripts npm usan guard', () => {
  const launcher=fileURLToPath(new URL('../scripts/local-next.mjs',import.meta.url))
  for (const args of [['dev','--hostname','0.0.0.0'],['dev','--experimental-upload-trace','https://invalid.test'],
    ['dev','../another-app'],['start','-p','bad'],['build','--hostname=0.0.0.0']]) {
    const r=spawnSync(process.execPath,[launcher,...args],{encoding:'utf8',timeout:2000})
    assert.equal(r.status,1)
    assert.match(r.stderr,/Opción local no permitida|Puerto local inválido/)
  }
  const scripts=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).scripts
  for (const name of ['dev','build','start']) assert.equal(scripts[name],`node scripts/local-next.mjs ${name}`)
})

test('AUD-034: start requiere build certificado del env público correcto, sin clave en marca', () => {
  const root=mkdtempSync(join(tmpdir(),'qrih-build-tag-test-'))
  mkdirSync(join(root,'.next'))
  const file=join(root,'.next/qrih-local-stage-build.json')
  assert.throws(()=>assertLocalBuild(root,env()),/Primero ejecuta/)
  writeFileSync(file,JSON.stringify(localBuildTag(env())))
  assert.doesNotThrow(()=>assertLocalBuild(root,env()))
  assert.ok(!readFileSync(file,'utf8').includes('sb_secret_'))
  assert.ok(!readFileSync(file,'utf8').includes('sb_publishable_'))
  assert.throws(()=>assertLocalBuild(root,{...env(),NEXT_PUBLIC_SUPABASE_ANON_KEY:'sb_publishable_changed'}),/Primero ejecuta/)
  writeFileSync(file,'invalid')
  assert.throws(()=>assertLocalBuild(root,env()),/Primero ejecuta/)
})
