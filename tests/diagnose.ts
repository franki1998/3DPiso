import fs from 'node:fs'
import { canStand, circleHits } from '../src/controls/collision'
import type { World, Vec2 } from '../src/data/types'
const world=JSON.parse(fs.readFileSync('public/models/world.json','utf8')) as World
const geometry=JSON.parse(fs.readFileSync('../precision/geometry.json','utf8'))
console.log(JSON.stringify(world.colliders.filter(c=>['Door_Dormitorio2','Armario_Dormitorio2','Bed_Bedroom_2','Escritorio_D2','Silla_D2'].includes(c.id)),null,2))
for (const key of ['Dormitorio2','Bano2','Terraza']) {
 const h=geometry.walls.flatMap((w:any)=>w.openings).find((h:any)=>h.id===key&&(h.kind==='door'||h.kind==='sliding'))
 const c:Vec2=[h.center[0],-h.center[1]]
 console.log(key,c)
 for(let dz=-.6;dz<.61;dz+=.15){
  console.log(dz.toFixed(2),[-.3,-.15,0,.15,.3].map(dx=>{
    const p:Vec2=[c[0]+dx,c[1]+dz]
    return canStand(p,world,()=>true)?'OK':world.colliders.filter(o=>circleHits(p,.2,o.polygon)).map(o=>o.id).join('|')||'FLOOR'
  }))
 }
}
