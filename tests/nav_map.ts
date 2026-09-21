import fs from 'node:fs'
import {canStand} from '../src/controls/collision'
import type {World,Vec2} from '../src/data/types'
const w=JSON.parse(fs.readFileSync('public/models/world.json','utf8')) as World
const step=.05, origin=w.entry,q:Vec2[]=[[0,0]],seen=new Set(['0,0']),reached=new Set<string>()
for(let i=0;i<q.length;i++){
 const [x,z]=q[i],p:Vec2=[origin[0]+x*step,origin[1]+z*step]
 for(const r of w.rooms)if(Math.hypot(p[0]-r.spawn[0],p[1]-r.spawn[1])<.10)reached.add(r.id)
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const n:Vec2=[x+dx,z+dz],key=n.join(',');if(seen.has(key))continue;seen.add(key)
  if(canStand([origin[0]+n[0]*step,origin[1]+n[1]*step],w,()=>true))q.push(n)
 }
}
console.log('reached fine grid',Array.from(reached))
fs.writeFileSync('../logs/nav_points.json',JSON.stringify(q.map(([x,z])=>[origin[0]+x*step,origin[1]+z*step])))
