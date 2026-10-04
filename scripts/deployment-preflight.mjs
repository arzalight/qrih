import {existsSync,readFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'

// Sólo inspección local. No conectar ni mutar Supabase; nunca imprimir valores.
if(existsSync('.env')) process.loadEnvFile('.env')
const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']
let failed=false
for(const name of required){
  const ok=Boolean(process.env[name]); console.log(`${name}: ${ok?'presente':'FALTA'}`)
  if(!ok) failed=true
}
function jwtRole(value){
  try{return JSON.parse(Buffer.from(value.split('.')[1],'base64url').toString()).role}
  catch{return null}
}
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||''
const privateKey=process.env.SUPABASE_SERVICE_ROLE_KEY||''
if(publicKey && !publicKey.startsWith('sb_publishable_') && jwtRole(publicKey)!=='anon'){
  console.error('La variable pública no contiene una clave anónima/publicable válida.'); failed=true
}
if(privateKey && !privateKey.startsWith('sb_secret_') && jwtRole(privateKey)!=='service_role'){
  console.error('La variable privada no contiene una credencial de servidor válida.'); failed=true
}
try{
  const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if(url.protocol!=='https:' || url.username || url.password || url.pathname!=='/' || url.search || url.hash) throw new Error()
}catch{console.error('El origen de Supabase debe ser HTTPS canónico sin credenciales/rutas.');failed=true}
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(dir,entry.name)):[join(dir,entry.name)])}
if(existsSync('.next/static')){
  const leaking=files('.next/static').some(file=>{
    const content=readFileSync(file,'utf8')
    return content.includes('SUPABASE_SERVICE_ROLE_KEY') || (privateKey && content.includes(privateKey))
  })
  console.log(`Bundle cliente: ${leaking?'RECHAZADO':'sin referencia/valor de la credencial privada examinada'}`)
  failed ||= leaking
}else console.log('Bundle cliente: pendiente de build')
console.log('Supabase/Storage/Auth/Netlify activos: NO comprobados por este script.')
process.exitCode=failed?1:0
