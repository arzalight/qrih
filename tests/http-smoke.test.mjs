import assert from 'node:assert/strict'
import { test } from 'node:test'

// Ejecutar contra next start local o el staging aislado exacto, sin identidad. Sólo lecturas y
// requests inválidos/no autenticados; nunca altas/ediciones válidas o datos reales.
// next start representa Request.url con localhost; usar ese mismo origen en local.
const base=process.env.QRIH_SMOKE_ORIGIN||'http://localhost:3107'
const origin=new URL(base)
assert.ok(['127.0.0.1','localhost'].includes(origin.hostname) ||
  (origin.origin==='https://qrih-staging.netlify.app' && origin.pathname==='/'),
  'Sólo servidor local o staging aislado exacto')
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
