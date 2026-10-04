import assert from 'node:assert/strict'
import { test } from 'node:test'

// Ejecutar contra next start local o el staging aislado exacto, sin identidad. Sólo lecturas y
// requests inválidos/no autenticados; nunca altas/ediciones válidas o datos reales.
const base=process.env.QRIH_SMOKE_ORIGIN||'http://127.0.0.1:3107'
const origin=new URL(base)
assert.ok(['127.0.0.1','localhost'].includes(origin.hostname) ||
  (origin.origin==='https://qrih-staging.netlify.app' && origin.pathname==='/'),
  'Sólo servidor local o staging aislado exacto')
for(const [path,method,status,notice] of [
  ['/login','GET',200],['/registro','GET',200],['/admin','GET',307],['/admin/asesores','GET',307],
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
