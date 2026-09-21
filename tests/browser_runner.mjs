import {createRequire} from 'node:module'
import {readdirSync,existsSync,writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {chromium} from '@playwright/test'
const base=join(homedir(),'.vscode/extensions')
const ext=readdirSync(base).filter(x=>x.startsWith('danielsanmedium.dscodegpt-')).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).at(-1)
const {chromium:installed}=createRequire(join(base,ext,'standalone/') )('patchright')
const browser=await chromium.launch({headless:true,executablePath:installed.executablePath(),args:['--no-sandbox','--enable-unsafe-swiftshader']})
const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-ES'})
const page=await context.newPage();const errors=[],failures=[]
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
page.on('requestfailed',r=>{if(!r.failure()?.errorText.includes('ERR_ABORTED'))failures.push(r.url()+': '+r.failure()?.errorText)})
let result
try {
 await page.goto(process.argv[3]||'http://127.0.0.1:5173/')
 const mod=await import(pathToFileURL(join(process.cwd(),process.argv[2]||'tests/inspect_browser.mjs')).href)
 result=await mod.default(page)
}catch(e){result={error:String(e.stack)};await page.screenshot({path:'../logs/web_test_error.png'})}
const report={result,errors,failures,title:await page.title()}
writeFileSync(process.argv[2]?.includes('production')?'../logs/browser_production_report.json':'../logs/browser_report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
await browser.close()
if(result?.error||errors.length||failures.length)process.exitCode=1
