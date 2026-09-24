import assert from 'node:assert/strict'
export default async function(page){
 await page.getByText('Casa cargada · escala 1:1',{exact:true}).waitFor({timeout:60000})
 assert.equal(await page.evaluate(()=>typeof window.__HOME_PLANNER_QA__),'undefined')
 await page.getByRole('button',{name:'Planta',exact:true}).click()
 assert.equal(await page.getByRole('button',{name:'Planta',exact:true}).getAttribute('aria-pressed'),'true')
 await page.getByRole('button',{name:'Ocultar todo',exact:true}).click()
 await page.getByRole('button',{name:'Mostrar todo',exact:true}).click()
 await page.getByLabel('Elegir estancia').selectOption('living-room')
 await page.getByRole('button',{name:'Entrar en recorrido'}).waitFor()
 await page.screenshot({path:'../logs/web_production.png'})
 return {productionLoaded:true,diagnosticRemoved:true,plan:true,furnitureControls:true,teleport:true}
}
