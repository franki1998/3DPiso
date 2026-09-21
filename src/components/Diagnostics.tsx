import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useApp, isFurnitureVisible } from '../store'
// Read-only diagnostic surface exists only on the local development server.
export function Diagnostics() {
  const { camera, gl, scene } = useThree()
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const api = {
      snapshot: () => {
        const s = useApp.getState()
        return { mode: s.mode, position: s.position, camera: camera.position.toArray(), rotation: camera.rotation.toArray(), yaw: s.yaw, eyeHeight: camera.position.y, locked: s.locked, selected: s.selected, points: s.points, loaded: s.loaded, room: s.room, calls: gl.info.render.calls, triangles: gl.info.render.triangles,
          furnitureVisible: s.world?.furniture.filter(f => isFurnitureVisible(f.id)).length }
      },
      project: (point: [number, number, number]) => {
        const p = new Vector3(...point).project(camera), b = gl.domElement.getBoundingClientRect()
        return { x: b.left + (p.x + 1) * b.width / 2, y: b.top + (1 - p.y) * b.height / 2 }
      },
      visibleObjects: () => {
        const names: string[] = []; scene.traverseVisible(o => { if ('isMesh' in o) names.push(o.name) }); return names
      },
    }
    Object.assign(window, { __THREEDPISO_QA__: api })
    return () => { delete (window as unknown as Record<string, unknown>).__THREEDPISO_QA__ }
  }, [camera, gl, scene])
  return null
}
