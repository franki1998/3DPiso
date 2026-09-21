import { useEffect, useMemo } from 'react'
import { Html, Line, useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { Box3, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three'
import { useApp } from '../store'
import { distance3D, inside } from '../controls/collision'

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
      if (id) { const f = world.furniture.find(f => f.id === id); o.visible = !!f && roomVisible[f.room] !== false && !hidden[id] }
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
    {bounds && <mesh position={bounds.center} raycast={() => null}><boxGeometry args={[bounds.size.x + .035, bounds.size.y + .035, bounds.size.z + .035]} /><meshBasicMaterial color="#d8984b" wireframe depthTest={false} /></mesh>}
  </>
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
