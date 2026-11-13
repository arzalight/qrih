import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { exactCount, countPublicProperties, countConfirmedConnections } from '../lib/public-indicators.ts'
import { startVisiblePolling } from '../lib/visible-polling.ts'
import { rankSimilarProperties } from '../lib/matching.ts'
import { safeInternalPath } from '../lib/safe-navigation.ts'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
test('Sprint2 indicadores:0 válido,conteo exacto seguro,NaN/negativos/fracciones/no datos no inventan0', () => {
  for (const value of [0, 17, '12500']) assert.equal(exactCount(value), Number(value))
  for (const value of [null, undefined, '', '1.5', -1, 1.5, NaN, Infinity, {}, '1e3', Number.MAX_SAFE_INTEGER + 1]) assert.equal(exactCount(value), null)
})
test('Sprint2 propiedades:COUNT head usa proyección pública published,independiente de6tarjetas', async () => {
  for (const count of [0, 24, 1500]) {
    const calls = []
    const client = { from(table) { calls.push(table); return { select(columns, options) {
      calls.push([columns, options]);return { eq: async (key, value) => { calls.push([key, value]);return { count, error: null } } }
    } } } }
    assert.equal(await countPublicProperties(client), count)
    assert.deepEqual(calls, ['properties_public', ['id', { count: 'exact', head: true }], ['status', 'published']])
  }
  assert.equal(await countPublicProperties(null), null)
  assert.equal(await countPublicProperties({ from() { throw Error('network') } }), null)
  assert.equal(await countPublicProperties({ from() { return { select() { return { eq: async () => ({ error: { code: 'denied' }, count: 24 }) } } } } }), null)
})
test('Sprint2 vinculaciones:sólo RPCagregado,ausente/error no equivalen a0 ni al total de solicitudes', async () => {
  for (const [data, error, expected] of [[0, null, 'confirmed'], ['3', null, 'confirmed'], [null, { code: 'PGRST202' }, 'not_enabled'],
    [null, { code: '42883' }, 'not_enabled'], [9, { code: 'denied' }, 'unavailable'], [[], null, 'unavailable']]) {
    const client = { rpc: async name => { assert.equal(name, 'qrih_confirmed_connections_count');return { data, error } } }
    const result = await countConfirmedConnections(client)
    assert.equal(result.connectionsStatus, expected)
    assert.equal(result.connections, expected === 'confirmed' ? Number(data) : null)
    assert.deepEqual(Object.keys(result).sort(), ['connections', 'connectionsStatus'])
  }
})
test('Sprint2 endpoint:agregado fijo sin cookies/parámetros/PII,privilegio sólo en servidor y cache60s', () => {
  const source = read('app/api/indicadores-publicos/route.ts')
  assert.match(source, /Response.json\(\{ properties, \.\.\.confirmed \}/)
  assert.match(source, /s-maxage=60/)
  assert.doesNotMatch(source, /request\.|cookies\(|headers\(|select\('\*'|\.from\('property_contacts'/)
  const client = read('components/PublicIndicators.tsx')
  assert.doesNotMatch(client, /privileged|SERVICE_ROLE|createClient|\.from\(/)
  assert.match(client, /credentials: 'omit'/)
  for (const label of ['Consultando inventario','No disponible en este momento','Registro por habilitar']) assert.ok(client.includes(label))
})
test('Sprint2 similares:etapas ordenadas,municipio/operación obligatorios,extremos0.5–2 inclusivos,máximo6', () => {
  const source = { id: 'source', operation: 'Renta', zone_general: 'Colón', zone: 'A', surface_m2: 1000 }
  const candidate = (id, area, zone='A', extra={}) => ({ ...source, id, surface_m2: area, zone, status: 'published', ...extra })
  const candidates = [candidate('strict-same',1200),candidate('strict-other',1000,'B'),candidate('medium-same',1400),candidate('medium-other',1500,'B'),
    candidate('wide-same',1900),candidate('wide-other',2000,'B'),candidate('min',500),candidate('too-small',499),candidate('too-big',2001),
    candidate('wrong-op',1000,'A',{operation:'Venta'}),candidate('wrong-place',1000,'A',{zone_general:'El Marqués'}),candidate('private',1000,'A',{status:'draft'}),source]
  const ranked = rankSimilarProperties(source, [...candidates, candidates[0]])
  assert.equal(ranked.length,6)
  assert.deepEqual(ranked.slice(0,2).map(x=>x.property.id),['strict-same','strict-other'])
  assert.equal(new Set(ranked.map(x=>x.property.id)).size,6)
  assert.ok(ranked.every(x=>!['source','too-small','too-big','wrong-op','wrong-place','private'].includes(x.property.id)))
  assert.equal(rankSimilarProperties(source,[candidate('min',500)])[0].property.id,'min')
  assert.equal(rankSimilarProperties(source,[candidate('max',2000)])[0].property.id,'max')
})
test('Sprint2 similares:sin operación/municipio/área,no datos ni inmuebles23vecesmayores como relleno', () => {
  const source={id:'s',operation:'Renta',zone_general:'El Marqués',surface_m2:234}
  assert.deepEqual(rankSimilarProperties(source,[{...source,id:'bad',surface_m2:5440}]),[])
  assert.deepEqual(rankSimilarProperties(source,[{...source,id:'missing',surface_m2:null}]),[])
  assert.deepEqual(rankSimilarProperties({...source,zone_general:''},[{...source,id:'a'}]),[])
})
test('Sprint2 polling:sin solapamiento,pausa oculto,cleanup y no cola al terminar tarde', async () => {
  const scheduled=new Map();let id=0,visible=true,runs=0,release
  const poll=startVisiblePolling({ delay:30000, visible:()=>visible,
    schedule(task,delay){assert.equal(delay,30000);scheduled.set(++id,task);return id},cancel:token=>scheduled.delete(token),
    run:()=>{runs++;return new Promise(resolve=>{release=resolve})},
  })
  const pending=poll.refresh();await poll.refresh();assert.equal(runs,1);assert.equal(scheduled.size,0)
  release();await pending;assert.equal(scheduled.size,1)
  visible=false;await poll.refresh();assert.equal(runs,1);assert.equal(scheduled.size,1)
  visible=true;const last=poll.refresh();assert.equal(runs,2);poll.stop();release();await last
  assert.equal(scheduled.size,0);await poll.refresh();assert.equal(runs,2)
})
test('Sprint2 Admin:refresh sólo tras guards,listados,sin refresh en formularios y conservando página', () => {
  for (const path of ['app/admin/page.tsx','app/admin/asesores/page.tsx']) {
    const source=read(path);assert.ok(source.indexOf("role !== 'admin'")<source.indexOf('<AdminAutoRefresh'))
  }
  for (const path of ['app/admin/[id]/page.tsx','app/admin/asesores/[id]/page.tsx','app/admin/configuracion/page.tsx']) assert.ok(!read(path).includes('AdminAutoRefresh'))
  const source=read('components/AdminAutoRefresh.tsx')
  for (const value of ['30000','visibilityState','!dirty','!submitting','!inFlight.current','getSelection','router.refresh()','poll.stop()','removeEventListener']) assert.ok(source.includes(value))
  assert.doesNotMatch(source,/location.reload|realtime|\.channel\(/i)
  const table=read('components/AdminPropertiesTable.tsx')
  assert.match(table,/setCurrentPage\(page => Math.min\(page, totalPages\)\)/)
  assert.doesNotMatch(table,/\[properties, pageSize\]/)
})
test('Sprint2 Admin:contracción accesible,estado de sesión,no nueva autorización', () => {
  const header=read('components/Header.tsx')
  for (const value of ['aria-expanded={!railCollapsed}','Expandir navegación','Contraer navegación','qrih-admin-rail','admin-nav-icon','admin-nav-label']) assert.ok(header.includes(value))
  assert.match(header,/aria-label=\{administration \? label : undefined\}/)
  assert.match(read('app/globals.css'),/body:has\(\.header--administration.header--compact\) \{ padding-left: 88px;/)
})
test('Sprint2 retorno protegido:perfil a login con next,redirecciones externas y codificadas rechazadas', () => {
  assert.match(read('app/perfil/page.tsx'),/redirect\('\/login\?next=%2Fperfil'\)/)
  for (const path of ['//evil.test','https://evil.test','/%2Fevil.test','/\\evil.test','/\u0000evil']) assert.equal(safeInternalPath(path),'/mis-propiedades')
  assert.equal(safeInternalPath('/perfil'),'/perfil')
})
