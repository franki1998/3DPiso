import { useEffect, useMemo } from 'react'
import { Html, Line, useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { Box3, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three'
import { useApp } from '../store'
import { distance3D, inside } from '../controls/collision'
import { catalog } from '../data/catalog'

const files = ['architecture', 'furniture_living_room', 'furniture_bedroom_1', 'furniture_bedroom_2', 'furniture_bedroom_3', 'furniture_bedroom_4', 'furniture_terrace'].map(n => `/models/${n}.glb`)

export function House() {
  const loaded = useGLTF(files)
  const scenes = useMemo(() => loaded.map(g => g.scene.clone(true)), [loaded])
  const mode = useApp(s => s.mode), roomVisible = useApp(s => s.roomVisible), hidden = useApp(s => s.hidden), selected = useApp(s => s.selected)
  const world = useApp(s => s.world)!
  useEffect(() => {
    scenes.forEach(s => s.traverse(o => {
      if (o instanceof Mesh) {
        o.castShadow = true; o.receiveShadow = true
        const wasArray = Array.isArray(o.material)
        const mats = wasArray ? o.material as MeshStandardMaterial[] : [o.material as MeshStandardMaterial]
        const converted = mats.map(mat => {
          const m = (mat as MeshStandardMaterial).clone()
          if (m.name.includes('Vidrio')) { Object.assign(m, { transmission: 0, transparent: true, opacity: .24, depthWrite: false, roughness: .18 }) }
          return m
        })
        o.material = wasArray ? converted : converted[0]
      }
    }))
    useApp.setState({ loaded: true })
  }, [scenes])
  useEffect(() => {
    for (const s of scenes) s.traverse(o => {
      if (o.name.includes('Ceiling_Main')) o.visible = mode === 'walk'
      const id = o.userData.furnitureId as string | undefined
      if (id) o.visible = false
    })
    for (const s of scenes) s.traverse(o => {
      if (!(o instanceof Mesh)) return
      let ancestor: Object3D | null = o, visible = true
      while (ancestor) { visible = visible && ancestor.visible; ancestor = ancestor.parent }
      o.raycast = visible ? Mesh.prototype.raycast : () => {}
    })
  }, [scenes, mode, roomVisible, hidden, world])

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return
    e.stopPropagation()
    const s = useApp.getState()
    if (s.measuring) { s.addPoint([e.point.x, e.point.y, e.point.z]); return }
    let o: Object3D | null = e.object
    while (o && !o.userData.furnitureId && !o.userData.roomId) o = o.parent
    if (o?.userData.furnitureId) useApp.setState({ selected: o.userData.furnitureId })
    else {
      const r = world.rooms.find(r => inside([e.point.x, e.point.z], r.polygon))
      useApp.setState({ selected: null, ...(r ? { room: r.id } : {}) })
    }
  }
  const bounds = useMemo(() => {
    if (!selected) return null
    let target: Object3D | null = null
    scenes.forEach(s => s.traverse(o => { if (o.userData.furnitureId === selected) target = o }))
    if (!target) return null
    const box = new Box3().setFromObject(target)
    return { center: box.getCenter(new Vector3()), size: box.getSize(new Vector3()) }
  }, [selected, scenes])

  return <>
    {scenes.map((s, i) => <primitive object={s} key={files[i]} onClick={onClick} />)}
    <EditableFurniture />
    {bounds && <mesh position={bounds.center} raycast={() => null}><boxGeometry args={[bounds.size.x + .035, bounds.size.y + .035, bounds.size.z + .035]} /><meshBasicMaterial color="#d8984b" wireframe depthTest={false} /></mesh>}
  </>
}

function EditableFurniture() {
  const world = useApp(s => s.world)!, selected = useApp(s => s.selected), conflict = useApp(s => s.conflict), mode = useApp(s => s.mode), pending = useApp(s => s.pendingCatalog)
  const dragging = useApp(s => s.dragging)
  const onPlaneMove = (e: ThreeEvent<PointerEvent>) => { if (dragging) { e.stopPropagation(); useApp.getState().moveFurniture(dragging, [e.point.x, e.point.z]) } }
  const onPlaneDown = (e: ThreeEvent<PointerEvent>) => { const s = useApp.getState(); if (s.measuring) { e.stopPropagation(); s.addPoint([e.point.x, e.point.y, e.point.z]); return } if (pending) { e.stopPropagation(); s.placePending([e.point.x, e.point.z], e.nativeEvent.shiftKey) } else if (mode === 'edit') s.select(null) }
  const onPlaneUp = () => { const s = useApp.getState(); if (s.dragging) { const id = s.dragging; const f = s.world?.furniture.find(f => f.id === id); if (f) s.moveFurniture(id, [f.position[0], f.position[2]], true); s.stopDrag() } }
  return <group>
    {(mode === 'edit' || mode === 'plan') && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.4, .04, -3.7]} onPointerMove={onPlaneMove} onPointerDown={onPlaneDown} onPointerUp={onPlaneUp} onClick={e => e.stopPropagation()}><planeGeometry args={[40, 40]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
    {world.furniture.map(f => {
      const visible = f.visible !== false && useApp.getState().roomVisible[f.room] !== false && !useApp.getState().hidden[f.id]
      if (!visible) return null
      const isSelected = selected === f.id, bad = conflict[f.id]
      return <group key={f.id} position={[f.position[0], 0, f.position[2]]} rotation={[0, f.rotation[1], 0]} onPointerDown={e => { if (mode === 'edit') { e.stopPropagation(); useApp.getState().startDrag(f.id) } }} onClick={e => { e.stopPropagation(); useApp.getState().select(f.id) }}>
        <FurnitureModel type={f.type} width={f.width} depth={f.depth} height={f.height} color={bad ? '#d9624b' : f.color ?? '#cdbb9f'} selected={isSelected} />
        {(isSelected || bad) && <mesh position={[0, .035, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}><ringGeometry args={[Math.max(f.width, f.depth) * .55, Math.max(f.width, f.depth) * .55 + .035, 64]} /><meshBasicMaterial color={bad ? '#d94832' : '#d8984b'} transparent opacity={.72} depthWrite={false} /></mesh>}
        {isSelected && <Html position={[0, f.height + .16, 0]} center style={{ pointerEvents: 'none' }}><span className="selection-chip">{f.name}<small>{(f.width*100).toFixed(0)} × {(f.depth*100).toFixed(0)} cm</small></span></Html>}
      </group>
    })}
    {pending && <Ghost item={catalog.find(c => c.id === pending)} />}
  </group>
}

function Ghost({ item }: { item?: typeof catalog[number] }) {
  if (!item) return null
  return null
}

function FurnitureModel({ type, width, depth, height, color, selected }: { type: string; width: number; depth: number; height: number; color: string; selected: boolean }) {
  const mat = <meshStandardMaterial color={color} roughness={.72} emissive={selected ? '#7a4c24' : '#000'} emissiveIntensity={selected ? .12 : 0} />
  if (type === 'bed') return <group><mesh position={[0, height/2, 0]} castShadow receiveShadow><boxGeometry args={[width, height*.55, depth]} />{mat}</mesh><mesh position={[0, height*.9, -depth*.32]} castShadow><boxGeometry args={[width*.82, height*.18, depth*.22]} /><meshStandardMaterial color="#f2eee8" roughness={.9} /></mesh></group>
  if (type === 'sofa') return <group><mesh position={[0, height*.32, 0]} castShadow receiveShadow><boxGeometry args={[width, height*.55, depth]} />{mat}</mesh><mesh position={[0, height*.68, -depth*.38]} castShadow><boxGeometry args={[width, height*.55, depth*.18]} />{mat}</mesh><mesh position={[-width*.46, height*.55, 0]} castShadow><boxGeometry args={[width*.08, height*.55, depth]} />{mat}</mesh><mesh position={[width*.46, height*.55, 0]} castShadow><boxGeometry args={[width*.08, height*.55, depth]} />{mat}</mesh></group>
  if (type === 'chair') return <group><mesh position={[0, height*.45, 0]} castShadow><boxGeometry args={[width, height*.12, depth]} />{mat}</mesh><mesh position={[0, height*.68, -depth*.42]} castShadow><boxGeometry args={[width, height*.55, depth*.12]} />{mat}</mesh></group>
  if (type === 'tv') return <group><mesh position={[0, height*.55, 0]} castShadow><boxGeometry args={[width, height, depth]} /><meshStandardMaterial color="#111518" roughness={.45} /></mesh></group>
  return <mesh position={[0, height/2, 0]} castShadow receiveShadow><boxGeometry args={[width, height, depth]} />{mat}</mesh>
}

export function Measurements() {
  const points = useApp(s => s.points), dimensions = useApp(s => s.dimensions), world = useApp(s => s.world)!
  return <group>
    {points.map((p, i) => <mesh key={i} position={p} raycast={() => null}><sphereGeometry args={[.035, 12, 8]} /><meshBasicMaterial color="#d78331" depthTest={false} /></mesh>)}
    {points.length === 2 && <>
      <Line points={points} color="#d78331" lineWidth={3} depthTest={false} />
      <Html position={[(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2 + .10, (points[0][2] + points[1][2]) / 2]} center style={{ pointerEvents: 'none' }}><span className="measurement-label">{distance3D(points[0], points[1]).toFixed(2)} m</span></Html>
    </>}
    {dimensions && world.rooms.map(r => {
      const xs = r.polygon.map(p => p[0]), zs = r.polygon.map(p => p[1])
      const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs)
      return <group key={r.id}>
        <Line points={[[minX, .06, minZ], [maxX, .06, minZ], [maxX, .06, maxZ]]} color="#357569" lineWidth={2} depthTest={false} />
        <Html position={[(minX + maxX) / 2, .15, (minZ + maxZ) / 2]} center style={{ pointerEvents: 'none' }}><span className="room-label">{r.name}<small>{r.dimensions[0].toFixed(2)} × {r.dimensions[1].toFixed(2)} m · aprox.</small></span></Html>
      </group>
    })}
  </group>
}
