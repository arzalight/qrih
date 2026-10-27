import assert from 'node:assert/strict'
import { test } from 'node:test'

// Ejecutar contra next start local o el staging aislado exacto, sin identidad. Sólo lecturas y
// requests inválidos/no autenticados; nunca altas/ediciones válidas o datos reales.
// next start representa Request.url con localhost; usar ese mismo origen en local.
const base=process.env.QRIH_SMOKE_ORIGIN||'http://localhost:3107'
const origin=new URL(base)
const development=process.env.QRIH_SMOKE_MODE==='development'
assert.ok(!development || ['localhost','127.0.0.1'].includes(origin.hostname),
  'La excepción de cache de Next dev sólo se permite en localhost')
assert.ok(['127.0.0.1','localhost'].includes(origin.hostname) ||
  (origin.origin==='https://qrih-staging.netlify.app' && origin.pathname==='/'),
  'Sólo servidor local o staging aislado exacto')

// Nuevas superficies de051: sin sesión no se retira/duplica ni firma una portada.
// UUID ficticio fijo; ningún ID de propiedad real ni request autenticado.
const syntheticPropertyId = '11111111-1111-4111-8111-111111111111'
test('Sprint1 preview privado requiere sesión y UUID válido;sin datos ni firmas públicas', async () => {
  for (const [id, status] of [[syntheticPropertyId, 307], ['invalid', 404]]) {
    const response = await fetch(base + '/mis-propiedades/' + id, { redirect: 'manual' })
    assert.equal(response.status, status)
    assert.match(response.headers.get('cache-control'), /private.*no-store/)
    assert.ok(!(await response.text()).includes('/storage/v1/object/sign/'))
  }
})
for (const [path, method, status] of [
  ['/api/duplicar-propiedad', 'POST', 401],
  ['/api/duplicar-propiedad', 'GET', 405],
  ['/api/retirar-propiedad', 'GET', 405],
  [`/api/mis-propiedades/${syntheticPropertyId}/portada`, 'GET', 401],
  ['/api/mis-propiedades/invalid-id/portada', 'GET', 404],
]) {
  test(`051 ${method} ${path}: acceso no autenticado/método inválido denegado`, async () => {
    const response = await fetch(base + path, { method, redirect: 'manual' })
    assert.equal(response.status, status)
    if (path.endsWith('/portada')) {
      assert.match(response.headers.get('cache-control'), /private.*no-store/)
      assert.ok(!(await response.text()).includes('/storage/v1/object/sign/'))
    }
  })
}
test('051 retiro con confirmación pero sin sesión: 401, ninguna transición', async () => {
  const response = await fetch(base + '/api/retirar-propiedad', {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/json', Origin: origin.origin },
    body: JSON.stringify({ propertyId: syntheticPropertyId, confirmed: true }),
  })
  assert.equal(response.status, 401)
})

for(const [path,method,status,notice] of [
  ['/login','GET',200],['/registro','GET',200],['/admin','GET',307],['/admin/asesores','GET',307],
  ['/recuperar-contrasena','GET',200],['/restablecer-contrasena','GET',200],
  ['/perfil','GET',200,true],['/mis-propiedades','GET',200,true],['/notificaciones','GET',200,true],
  ['/api/imagenes','POST',401],['/api/contactar-propiedad','POST',401],['/api/interes-propiedad','POST',401],
  ['/api/registrar-oportunidad','POST',401],['/api/contactar-propiedad/autorizacion','POST',401],
  ['/api/eliminar-propiedad','POST',401],['/api/editar-propiedad','POST',401],['/api/requerimientos','POST',400],
]){
  test(`${method} ${path}: sin sesión no entrega datos privados ni crea registros`,async()=>{
    const response=await fetch(base+path,{method,redirect:'manual',...(method==='POST'?{body:'malformed',headers:{'Content-Type':'application/json'}}:{})})
    assert.equal(response.status,status)
    if(notice) assert.match(await response.text(),/Necesitas iniciar sesión/)
    if(status===307) assert.equal(new URL(response.headers.get('location'),base).pathname,'/login')
  })
}
for (const [requestOrigin, status] of [[null, 403], [origin.origin, 401], ['https://invalid.test', 403]]) {
  test(`POST recovery sin autorización (${status}): no cambia contraseña`, async () => {
    const response = await fetch(base + '/api/auth/restablecer', { method: 'POST', redirect: 'manual',
      headers: { 'Content-Type': 'application/json', ...(requestOrigin ? { Origin: requestOrigin } : {}) },
      body: JSON.stringify({ password: 'Synthetic!123', confirmation: 'Synthetic!123' }) })
    assert.equal(response.status, status)
    assert.match(response.headers.get('cache-control'), /private.*no-store/)
  })
}

// Login se hidrata en cliente: la tarjeta visual se comprueba en navegador, no HTML estático.
test('bandera visual de registro no entrega sesión ni abre el panel privado', async () => {
  const response = await fetch(base + '/login?registro=pendiente', { redirect: 'manual' })
  assert.equal(response.status, 200)
  assert.ok(!response.headers.get('set-cookie')?.includes('auth-token'))
  const panel = await fetch(base + '/mis-propiedades?registro=pendiente', { redirect: 'manual' })
  assert.equal(panel.status, 200)
  assert.match(await panel.text(), /Necesitas iniciar sesión/)
})

for (const query of ['?type=recovery&next=https://invalid.test', '?code=synthetic&sb_flow_id=invalid']) {
  test('callback local inválido: sin sesión ni redirect externo (' + query + ')', async () => {
    // Sin código real/verifier válido: no consumir enlaces ni enviar correos.
    const response = await fetch(base + '/auth/callback' + query, { redirect: 'manual' })
    assert.equal(response.status, 307)
    const destination = new URL(response.headers.get('location'))
    assert.equal(destination.origin, origin.origin)
    assert.equal(destination.pathname, '/login')
    assert.equal(destination.search, '?error=confirmation')
    assert.match(response.headers.get('cache-control'), /private.*no-store/)
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
    assert.ok(!response.headers.get('set-cookie')?.includes('auth-token'))
  })
}

test('recovery local: marca inválida no muestra cuenta/formulario de nueva contraseña', async () => {
  const response = await fetch(base + '/restablecer-contrasena', {
    redirect: 'manual', headers: { Cookie: 'qrih-recovery=synthetic-invalid-marker' },
  })
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.match(html, /El enlace no es válido/)
  assert.ok(!html.includes('name="confirmation"'))
  assert.ok(!response.headers.get('set-cookie')?.includes('auth-token'))
})

test('AUD-036 páginas privadas sin sesión: cache privada y ningún token fabricado', async () => {
  for (const path of ['/perfil', '/mis-propiedades', '/notificaciones', '/admin']) {
    const response = await fetch(base + path, { redirect: 'manual' })
    // Next dev sustituye Cache-Control durante render; nunca aceptar esto en RC.
    if (development) assert.ok(response.headers.get('cache-control') === 'no-cache, must-revalidate'
      || /private.*no-store/.test(response.headers.get('cache-control')))
    else assert.match(response.headers.get('cache-control'), /private.*no-store/)
    assert.ok(!response.headers.get('set-cookie')?.includes('auth-token'))
  }
})
