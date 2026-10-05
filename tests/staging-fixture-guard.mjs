import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'

// Datos de cuentas previas sólo en memoria del servidor; ni export ni log de PII/hash.
const canonical=value=>Array.isArray(value)?value.map(canonical):value && typeof value==='object'
  ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value
const fingerprint=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
async function authSnapshot(svc) {
  const result=await svc.auth.admin.listUsers({page:1,perPage:2})
  assert.ok(!result.error,'Auth baseline read failed')
  const users=result.data.users
  assert.ok(users.length<=1,'Unexpected pre-existing accounts; stop')
  const ids=users.map(user=>user.id)
  let profiles=[]
  if(ids.length) {
    const result=await svc.from('profiles').select('*').in('id',ids)
    assert.ok(!result.error,'Profile baseline read failed')
    profiles=result.data
  }
  return {ids,auth:users.map(user=>({id:user.id,hash:fingerprint(user)})),profiles:fingerprint(profiles)}
}
export async function captureAuthBaseline(svc,preserve=process.env.QRIH_LIVE_PRESERVE_AUTH==='1') {
  const baseline=await authSnapshot(svc)
  assert.ok(preserve || baseline.ids.length===0,'Empty staging Auth required without explicit preservation opt-in')
  return baseline
}
export async function verifyAuthBaseline(svc,baseline) {
  const after=await authSnapshot(svc)
  assert.ok(fingerprint(after)===fingerprint(baseline),'Pre-existing Auth/profile baseline changed or synthetic account remains')
}
