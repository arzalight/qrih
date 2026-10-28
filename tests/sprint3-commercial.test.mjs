import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import babel from '@babel/core'
import { after, test } from 'node:test'

registerHooks({ resolve(specifier,context,next) {
  if(specifier==='./property-price')return next(new URL('../lib/property-price.ts',import.meta.url).href,context)
  if(specifier==='server-only')return {url:'data:text/javascript,export{}',shortCircuit:true}
  if(specifier==='./supabase-server')return {url:'data:text/javascript,export async function createServerSupabaseClient(){return null}',shortCircuit:true}
  if(specifier==='@/lib/private-commercial-server') return {url:'data:text/javascript,export const PRIVATE_OWNER_COLUMNS="id,advisor_id,name,company,phone,email,notes,archived_at,created_at,updated_at";export async function privateCommercialActor(){return globalThis.__privateActor}',shortCircuit:true}
  if(['@/lib/private-commercial','@/lib/request-security'].includes(specifier)) return next(new URL('../lib/'+specifier.split('/').at(-1)+'.ts',import.meta.url).href,context)
  return next(specifier,context)
} })
const {ownerInput,privatePropertyInput,pendingOwnerInput,normalizeOwnerName,ownerSaveError,activeDemand,urgencyActive,prioritizeUrgencies}=await import('../lib/private-commercial.ts')
const {parsePropertySubmission}=await import('../lib/property-submission.ts')
const directory=await import('../app/api/propietarios/route.ts')
const urgency=await import('../app/api/requerimientos/urgencia/route.ts')
const {loadPropertyPrivateDetails}=await import('../lib/private-commercial-server.ts')
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222'
const origin='https://qrih-synthetic.invalid'
const inherited={URL:process.env.URL,SITE_ID:process.env.SITE_ID};process.env.URL=origin;process.env.SITE_ID='synthetic-sprint3'
after(()=>{for(const[key,value]of Object.entries(inherited)) if(value===undefined)delete process.env[key];else process.env[key]=value})
function fixture({admin=false,anonymous=false,result={data:[],count:0,error:null},rpcError=null,searchRows=[]}={}) {
  const calls=[]
  const chain={then(resolve){return Promise.resolve(result).then(resolve)}}
  for(const method of ['select','eq','ilike','is','order','range','limit','in','insert','update','single','maybeSingle']) chain[method]=(...args)=>{calls.push([method,...args]);return chain}
  globalThis.__privateActor=anonymous?null:{id:A,admin,client:{from(table){calls.push(['from',table]);return chain},rpc:async(name,values)=>{calls.push(['rpc',name,values]);return {data:['qrih_private_property_ready','qrih_owner_picker_ready'].includes(name)?true:name==='qrih_search_own_owners'?searchRows:{active:true},error:rpcError}}}}
  return calls
}
const request=(body,requestOrigin=origin)=>new Request(origin+'/api/propietarios',{method:'POST',headers:{'Content-Type':'application/json',Origin:requestOrigin},body:JSON.stringify(body)})
test('Sprint3 owner validation: mandatory trimmed name, optional data, exact bounds and invalid email/NUL',()=>{
  assert.deepEqual(ownerInput({name:' Synthetic '}),{name:'Synthetic',company:null,phone:null,email:null,notes:null})
  for(const input of [{name:''},{name:'x'.repeat(161)},{name:'A',email:'bad'},{name:'A',phone:{}},{name:'A',notes:'\0'}])assert.throws(()=>ownerInput(input))
  assert.equal(ownerInput({name:'A',email:'a@example.invalid',notes:'x'.repeat(3000)}).notes.length,3000)
})
test('Sprint3 private form: legacy preserves, pending/error blocks, optional values and explicit unlink',()=>{
  const form=new FormData();assert.equal(privatePropertyInput(form),null)
  for(const state of ['pending','error']){form.set('private_fields_present',state);assert.throws(()=>privatePropertyInput(form))}
  form.set('private_fields_present','disabled');assert.equal(privatePropertyInput(form),null)
  form.set('private_fields_present','ready');assert.deepEqual(privatePropertyInput(form),{internal_name:null,owner_contact_id:null})
  form.set('internal_name',' PRIVATE_CANARY ');form.set('owner_contact_id',B);assert.equal(privatePropertyInput(form).internal_name,'PRIVATE_CANARY')
  form.set('owner_contact_id','foreign-invalid');assert.throws(()=>privatePropertyInput(form))
  const endpoint=read('app/api/publicar-propiedad/route.ts')
  assert.match(endpoint,/select\('id,status'\)\.eq\('id', id\)\.eq\('owner_id', user.id\)/)
  assert.match(endpoint,/status: confirmation.data.status/)
})
test('owner picker payload: normalized accents/spaces, pending private data, explicit clear and unresolved text blocked',()=>{
  assert.equal(normalizeOwnerName('  JOSÉ   Muñoz  '),'jose munoz')
  const form=new FormData();form.set('private_fields_present','ready');form.set('owner_unresolved','1')
  assert.throws(()=>privatePropertyInput(form));form.set('owner_unresolved','0')
  const pending={request_id:B,name:' José ',company:null,phone:'0000000000',email:'a@example.invalid'}
  form.set('pending_owner',JSON.stringify(pending))
  assert.deepEqual(privatePropertyInput(form).pending_owner,{...pending,name:'José'})
  form.set('owner_contact_id',A);assert.throws(()=>privatePropertyInput(form))
  form.set('owner_contact_id','');form.set('pending_owner','null');assert.equal(privatePropertyInput(form).pending_owner,null)
  for(const patch of [{request_id:'bad'},{name:''},{notes:'not allowed'},{phone:{}},{email:'bad'}]) assert.throws(()=>pendingOwnerInput({...pending,...patch}))
  assert.match(ownerSaveError({message:'OWNER_EQUIVALENT_EXISTS'}),/selección|selecciónalo|seleccionarlo/)
  assert.doesNotMatch(ownerSaveError({message:'PRIVATE_DB_CANARY'}),/PRIVATE_DB_CANARY/)
})
test('owner picker API: scoped even for admin, min two characters, safe query header and minimal selected projection',async()=>{
  const get=(q='',suffix='')=>new Request(origin+'/api/propietarios?picker=1'+suffix,{headers:{'X-QRIH-Owner-Search':encodeURIComponent(q)}})
  let calls=fixture({admin:true});assert.equal((await directory.GET(get('jo','&advisor='+B))).status,403);assert.deepEqual(calls,[])
  calls=fixture();assert.deepEqual(await (await directory.GET(get('j'))).json(),{owners:[]});assert.ok(!calls.some(c=>c[0]==='from'||c[1]==='qrih_search_own_owners'))
  const choices=[{id:A,name:'José',company:'Synthetic'}];calls=fixture({searchRows:choices})
  const response=await directory.GET(get('JOSÉ'));assert.deepEqual(await response.json(),{owners:choices});assert.equal(response.headers.get('cache-control'),'private, no-store')
  assert.deepEqual(calls.at(-1),['rpc','qrih_search_own_owners',{p_query:'JOSÉ'}]);assert.ok(!get('JOSÉ').url.includes('JOS'))
  calls=fixture({result:{data:choices[0],error:null}});assert.equal((await directory.GET(get('','&selection='+A))).status,200)
  assert.ok(calls.some(c=>c[0]==='select'&&c[1]==='id,name,company'));assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='advisor_id'&&c[2]===A))
  fixture({rpcError:{code:'PGRST202'}});assert.equal((await directory.GET(get('jo'))).status,503)
  fixture();assert.equal((await directory.GET(get('x'.repeat(161)))).status,400)
})
test('owner picker UI: no immediate contact POST, controlled hidden ID/pending, debounce/abort and accessible keyboard selection',()=>{
  const source=read('components/PrivateOwnerFields.tsx'),picker=source.slice(source.indexOf('export function PrivatePropertyFields'))
  assert.doesNotMatch(picker,/method: 'POST'|action: 'create'|localStorage|sessionStorage/)
  for(const expression of [/role="combobox"/,/role="listbox"/,/role="option"/,/aria-activedescendant/,/ArrowDown/,/ArrowUp/,/Escape/,/event.key === 'Enter'/,/controller.abort\(\)/,/clearTimeout\(timer\)/, /}, 300\)/,/slice\(0, 3\)/,/name="pending_owner"/,/name="owner_contact_id"/,/Propietario pendiente de registro/])assert.match(picker,expression)
  assert.match(read('app/api/publicar-propiedad/route.ts'),/rpc\('qrih_create_property_with_owner'/)
  assert.match(read('lib/property-save-server.ts'),/pending_owner' in privateDetails \? 'qrih_save_property_with_owner'/)
})
test('actual publish handler: draft/pending keep private payload separate; double click and failure retry preserve stable IDs/form',async()=>{
  const source=read('app/publicar/PublicarForm.tsx'),ast=babel.parseSync(source,{configFile:false,babelrc:false,parserOpts:{plugins:['jsx','typescript']}})
  let submit
  babel.traverse(ast,{FunctionDeclaration(path){if(path.node.id?.name==='submit')submit=stripTypeScriptTypes(source.slice(path.node.start,path.node.end),{mode:'strip'})}})
  for(const action of ['draft','pending']) {
    const body=new FormData(),pending={request_id:B,name:'Synthetic pending',company:'Ficticia',phone:'0000000000',email:'pending@example.invalid'}
    for(const[k,v]of Object.entries({private_fields_present:'ready',pending_owner:JSON.stringify(pending),owner_contact_id:'',internal_name:'PRIVATE_NAME',title:'Synthetic property',operation:'Renta',price:'100',price_currency:'MXN',zone_general:'Querétaro Norte',zone:'Jurica',area:'500',publication_authorized:'on',terms_accepted:'on'}))body.set(k,v)
    class PrivateForm extends FormData{constructor(){super();for(const[k,v]of body)this.set(k,v)}}
    const calls=[],messages=[],success=[],busy={current:false},draftRef={current:{id:crypto.randomUUID()}};let failed=true,clears=0,uploads=0
    const client={auth:{getUser:async()=>({data:{user:{id:A}}})},from:()=>({select(){return this},eq(){return this},single:async()=>({data:{account_status:'active'}})})}
    const draft={ready:true,imageCount:1,draftRef,bindOwner:async()=>true,clear:async()=>{clears++},requireAuth:async()=>{throw Error('Unexpected auth')}}
    const bindings={FormData:PrivateForm,submitBusy:busy,draft,actorId:A,setActorId(){throw Error('Unexpected actor change')},uploadedForAttempt:{current:new Map()},loading:false,showSuccess:false,imagesProcessing:false,
      images:[{file:new File(['synthetic'],'synthetic.webp'),title:'Synthetic'}],privatePropertyInput,parsePropertySubmission,createClient:()=>client,router:{push(){throw Error('Unexpected navigation')}},
      setMsg:v=>messages.push(v),setLoading(){},setUploadStates(){},setSuccessAction:v=>success.push(v),setShowSuccess(){},setAccountStatus(){},
      fetch:async(url,options)=>{
        if(url==='/api/imagenes'){uploads++;return {ok:true,status:200,json:async()=>({path:`${A}/synthetic.webp`})}}
        assert.equal(url,'/api/publicar-propiedad')
        calls.push(Object.fromEntries(options.body.entries()))
        if(options.body.get('finalize')!=='on')return {ok:true,status:200,json:async()=>({id:draftRef.current.id,prepared:true,atomic:true})}
        return {ok:!failed,status:failed?409:200,json:async()=>failed?{error:ownerSaveError({message:'OWNER_EQUIVALENT_EXISTS'})}:{id:draftRef.current.id,status:action}}
      }}
    const handler=new Function(...Object.keys(bindings),submit+';return submit')(...Object.values(bindings))
    const event={preventDefault(){},currentTarget:{},nativeEvent:{submitter:{name:'submission_action',value:action}}}
    await Promise.all([handler(event),handler(event)])
    assert.equal(calls.length,2);assert.equal(clears,0);assert.match(messages.at(-1),/equivalente/);assert.equal(busy.current,false)
    failed=false;await handler(event)
    assert.equal(calls.length,4);assert.equal(calls[0].request_id,calls[3].request_id);assert.equal(uploads,1)
    assert.deepEqual(JSON.parse(calls[3].pending_owner),pending);assert.equal(calls[3].internal_name,'PRIVATE_NAME')
    assert.equal(calls[3].submission_action,action);assert.equal(clears,1);assert.deepEqual(success,[action])
  }
})
test('private editor loader: reload recovers pending owner; errors block editing instead of silently clearing private draft',async()=>{
  const pending={request_id:B,name:'Private recovered',company:null,phone:null,email:null}
  const base={internal_name:'Internal',owner_contact_id:null}
  function client({missing=false,broken=false}={}){
    return {rpc:async()=>({data:!missing,error:missing?{code:'PGRST202'}:null}),from:()=>{let pendingColumn=false;const q={select(columns){pendingColumn=columns==='pending_owner';return q},eq(){return q},maybeSingle:async()=>pendingColumn?{data:{pending_owner:pending},error:broken?{code:'NETWORK'}:null}:{data:base,error:null}};return q}}
  }
  assert.deepEqual(await loadPropertyPrivateDetails(client(),A),{...base,pending_owner:pending})
  assert.deepEqual(await loadPropertyPrivateDetails(client({missing:true}),A),base)
  await assert.rejects(loadPropertyPrivateDetails(client({broken:true}),A))
})
test('Sprint3 urgency: exact expiration boundary, invalid dates, closed/45-day eligibility and stable priority',()=>{
  const now=Date.parse('2026-10-27T12:00:00Z'),base={id:'a',status:'new',created_at:new Date(now-86400000).toISOString()}
  assert.equal(activeDemand(base,now),true);assert.equal(activeDemand({...base,created_at:new Date(now-45*86400000-1).toISOString()},now),false)
  assert.equal(urgencyActive({...base,urgency_expires_at:new Date(now+1).toISOString()},now),true)
  for(const patch of [{urgency_expires_at:new Date(now).toISOString()},{urgency_expires_at:'bad'},{status:'closed',urgency_expires_at:new Date(now+1000).toISOString()}])assert.equal(urgencyActive({...base,...patch},now),false)
  const items=[base,{...base,id:'b',urgency_expires_at:new Date(now+1000).toISOString()},{...base,id:'c'}]
  assert.deepEqual(prioritizeUrgencies(items,now).map(x=>x.id),['b','a','c']);assert.deepEqual(prioritizeUrgencies(items,now+1001).map(x=>x.id),['a','b','c'])
})
test('Sprint3 routes: anonymous denied without queries; JSON always private/no-store',async()=>{
  const calls=fixture({anonymous:true})
  for(const response of [await directory.GET(new Request(origin+'/api/propietarios')),await directory.POST(request({})),await urgency.POST(request({id:B,action:'activate'}))]) {
    assert.equal(response.status,401);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('vary'),'Cookie')
  }
  assert.deepEqual(calls,[])
})
test('Sprint3 directory: foreign scope forbidden to advisor; admin read explicit whitelist only',async()=>{
  const calls=fixture();assert.equal((await directory.GET(new Request(origin+'/api/propietarios?advisor='+B))).status,403);assert.equal(calls.length,0)
  fixture({admin:true});const response=await directory.GET(new Request(origin+'/api/propietarios?advisor='+B));assert.equal(response.status,200);assert.equal((await response.json()).editable,false)
})
test('Sprint3 rollout: absent migration is explicitly unavailable, never fabricated empty success',async()=>{
  const calls=fixture({rpcError:{code:'PGRST202'}})
  const response=await directory.GET(new Request(origin+'/api/propietarios'))
  assert.equal(response.status,503);assert.equal((await response.json()).code,'not_enabled')
  assert.ok(!calls.some(call=>call[0]==='from'))
})
test('Sprint3 directory: search escaped, advisor locked, paging bounded and only allowed data returned',async()=>{
  const calls=fixture();const response=await directory.GET(new Request(origin+'/api/propietarios?page=2',{headers:{'X-QRIH-Owner-Search':encodeURIComponent('%_')}}))
  assert.equal(response.status,200);assert.ok(calls.some(x=>x[0]==='eq'&&x[1]==='advisor_id'&&x[2]===A));assert.ok(calls.some(x=>x[0]==='range'&&x[1]===100&&x[2]===149))
  assert.ok(calls.some(x=>x[0]==='ilike'&&x[2]==='%\\%\\_%'));assert.ok(!calls.some(x=>x[0]==='select'&&x[1]==='*'))
})
test('Sprint3 all mutations require same origin; mismatch has no write/RPC',async()=>{
  for(const handler of [directory.POST,urgency.POST]){const calls=fixture();assert.equal((await handler(request({id:B,action:'activate'},'https://attacker.invalid'))).status,400);assert.deepEqual(calls,[])}
})
test('Sprint3 urgency route: input allowlist, no user ID spoofing and conflict is409 without private DB details',async()=>{
  const calls=fixture();assert.equal((await urgency.POST(request({id:'bad',action:'activate'}))).status,400);assert.deepEqual(calls,[])
  assert.equal((await urgency.POST(request({id:B,action:'activate',user_id:B}))).status,200)
  assert.deepEqual(calls,[['rpc','qrih_change_demand_urgency',{p_id:B,p_action:'activate'}]])
  fixture({rpcError:{code:'23505',message:'PRIVATE_DB_CANARY'}});const response=await urgency.POST(request({id:B,action:'activate'}));assert.equal(response.status,409);assert.doesNotMatch(await response.text(),/PRIVATE_DB_CANARY/)
})
test('Sprint3 public boundaries: no private table/field imports in public loaders/components/PDF',()=>{
  assert.match(read('app/mis-propiedades/page.tsx'), /<Link href="\/perfil\/propietarios" prefetch=\{false\}>Mis propietarios<\/Link>/)
  for(const path of ['app/bodegas/[slug]/page.tsx','app/inventario/page.tsx','components/PropertyCard.tsx','components/CommercialPropertySheet.tsx','lib/commercial-property-server.ts']) {
    assert.doesNotMatch(read(path),/PrivatePropertySummary|property_private_details|advisor_owners|owner_contact_id|internal_name|pending_owner/)
  }
  const privateFields=read('components/PrivateOwnerFields.tsx')
  assert.match(privateFields,/private_fields_present/);assert.match(privateFields,/onAuthStateChange/);assert.match(read('components/DemandUrgency.tsx'),/clearInterval/)
  assert.doesNotMatch(privateFields,/localStorage|console\.(log|warn)/)
})
