import { fileURLToPath, pathToFileURL } from 'node:url'
const { build } = await import(pathToFileURL(process.env.QRIH_ESBUILD_MODULE).href)
const { chromium } = await import(pathToFileURL(process.env.QRIH_PLAYWRIGHT_MODULE).href)
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
// Actual React forms/drafts/Canvas/IndexedDB. Auth, navigation, Header and HTTP boundaries are synthetic.
// No app env loader, Supabase credentials, real accounts or remote writes.
const root=fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '')
await mkdir('/tmp/qrih-browser',{recursive:true})
await writeFile('/tmp/qrih-browser/entry.tsx',`import React from '${root}/node_modules/react/index.js';import {createRoot} from '${root}/node_modules/react-dom/client.js';import Publish from '${root}/app/publicar/PublicarForm.tsx';import Demand from '${root}/app/busco-bodega/page.tsx';createRoot(document.getElementById('root')!).render(location.pathname==='/publicar'?<Publish/>:<Demand/>);`)
const stubs={
 '@/lib/supabase':`export function createClient(){return {auth:{getUser:async()=>({data:{user:localStorage.getItem('synthetic-auth')?{id:'11111111-1111-4111-8111-111111111111'}:null}})},from(table){const q={select(){return q},eq(){return q},single:async()=>({data:{account_status:'active'}}),then(ok){return Promise.resolve({data:[]}).then(ok)}};return q}}}`,
 '@/components/Header':`import React from '${root}/node_modules/react/index.js';export function Header(){return <header>QRIH · Prueba sintética</header>}`,
 'next/navigation':`export function useRouter(){return {push(path){window.__redirect=path},replace(path){window.__redirect=path}}}`,
 'next/link':`import React from '${root}/node_modules/react/index.js';export default function Link({prefetch,...props}){return <a {...props}/>}`,
}
const output=await build({entryPoints:['/tmp/qrih-browser/entry.tsx'],bundle:true,write:false,format:'iife',jsx:'automatic',nodePaths:[root+'/node_modules'],plugins:[{name:'synthetic-boundaries',setup(b){b.onResolve({filter:/.*/},args=>{if(stubs[args.path])return {path:args.path,namespace:'stub'};if(args.path.startsWith('@/'))return {path:root+'/'+args.path.slice(2)+(args.path.includes('components/') && !args.path.endsWith('useFormDraft')?'.tsx':'.ts')};});b.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:stubs[args.path],loader:'tsx',resolveDir:root}));}}]})
const bundle=output.outputFiles[0].contents, css=await readFile(root+'/app/globals.css')
const server=createServer((req,res)=>{if(req.url==='/bundle.js'){res.setHeader('content-type','text/javascript');res.end(bundle)}else if(req.url==='/style.css'){res.setHeader('content-type','text/css');res.end(css)}else{res.setHeader('content-type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>')}})
await new Promise(r=>server.listen(3187,'127.0.0.1',r))
const browser=await chromium.launch({headless:true,executablePath:process.env.QRIH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:'/tmp/qrih-chrome-libs'}}), context=await browser.newContext({viewport:{width:390,height:844}}), page=await context.newPage()
const errors=[];page.on('pageerror',e=>errors.push(e.message))
let requests=[]
await page.route('**/api/**',async route=>{const req=route.request();requests.push({path:new URL(req.url()).pathname,body:req.postData()});let json={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'};if(req.url().endsWith('/publicar-propiedad'))json=req.postData().includes('name="finalize"')?{...json,status:'pending'}:{...json,prepared:true};await route.fulfill({json})})
const base='http://127.0.0.1:3187'
const fill=async(name,value)=>page.locator(`[name="${name}"]`).fill(value)
const select=async(name)=>page.locator(`[name="${name}"]`).selectOption({index:1})
try{
 await page.goto(base+'/publicar');await page.locator('[name="title"]').waitFor();await fill('title','Nave sintética recuperable');await fill('price','135');await fill('area','250');await select('zone_general');await select('zone');await page.locator('[name="publication_authorized"]').check();await page.locator('[name="terms_accepted"]').check()
 const file=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=40;c.height=30;c.getContext('2d').fillRect(0,0,40,30);return c.toDataURL('image/png').split(',')[1]})
 await page.locator('input[type="file"]').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(file,'base64')})
 await page.getByText('1 fotografía(s) lista(s) para subir.',{exact:true}).waitFor();await page.locator('.image-uploader__preview input').fill('Foto persistente');await page.locator('button[value="pending"]').click();await page.getByRole('dialog').waitFor();await page.screenshot({path:'/tmp/qrih-browser/auth-dialog-mobile.png',fullPage:true})
 assert.equal(requests.length,0);assert.equal(await page.getByRole('link',{name:'Iniciar sesión',exact:true}).getAttribute('href'),'/login?next=%2Fpublicar')
 await page.reload();await page.locator('.image-uploader__preview input').waitFor();assert.equal(await page.locator('[name="title"]').inputValue(),'Nave sintética recuperable');assert.equal(await page.locator('.image-uploader__preview input').inputValue(),'Foto persistente');assert.equal(await page.locator('[name="terms_accepted"]').isChecked(),true);assert.ok(await page.locator('[name="zone"]').inputValue())
 await page.evaluate(()=>localStorage.setItem('synthetic-auth','yes'));await page.locator('button[value="pending"]').dblclick();await page.getByText('¡Propiedad enviada a revisión!',{exact:true}).waitFor();assert.deepEqual(requests.map(r=>r.path),['/api/publicar-propiedad','/api/imagenes','/api/publicar-propiedad']);assert.equal(await page.evaluate(()=>localStorage.getItem('qrih:draft:v1:property')),null)
 requests=[];await page.evaluate(()=>localStorage.removeItem('synthetic-auth'));await page.goto(base+'/busco-bodega');await fill('name','Prueba recuperable');await fill('phone','5555555555');await fill('email','synthetic@example.invalid');await select('zone_general');await select('zone');await fill('area_min','100');await fill('area_max','200');await fill('budget_min','10');await fill('budget_max','20');await page.getByRole('button',{name:'ENVIAR A REVISIÓN →',exact:true}).click();await page.getByRole('dialog').waitFor();assert.equal(requests.length,0)
 await page.reload();assert.equal(await page.locator('[name="name"]').inputValue(),'Prueba recuperable');await page.evaluate(()=>localStorage.setItem('synthetic-auth','yes'));await page.getByRole('button',{name:'ENVIAR A REVISIÓN →',exact:true}).dblclick();await page.locator('section[role="status"]').getByText('Tu requerimiento fue recibido para revisión. Te contactaremos pronto.',{exact:true}).waitFor();assert.equal(requests.length,1);assert.equal(await page.evaluate(()=>localStorage.getItem('qrih:draft:v1:demand')),null)
 await page.goto(base+'/publicar');await page.locator('[name="title"]').waitFor();await page.getByRole('button',{name:'ENVIAR A REVISIÓN →',exact:true}).click();assert.equal(await page.locator('dialog[open]').count(),0)
 await page.screenshot({path:'/tmp/qrih-browser/public-form-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
 console.log(JSON.stringify({result:'PASS',checks:['public property form','local photo selection without upload','auth gate with safe next','reload fields zones consent and photo/title via real IndexedDB','authenticated property submit and double click','public demand and auth gate','demand reload and double click','cleared drafts','HTML invalid form gate','390px no horizontal overflow','no browser errors']},null,2))
}finally{await context.close();await browser.close();server.close()}
