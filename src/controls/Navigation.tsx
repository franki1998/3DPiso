import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { useApp, isFurnitureVisible } from '../store'
import { moveWithCollision, inside } from './collision'
import type { Vec2 } from '../data/types'

export function Navigation() {
  const mode = useApp(s => s.mode), { camera, gl, size } = useThree()
  const keys = useRef(new Set<string>()), speed = useRef<Vec2>([0, 0]), touch = useRef<{ id: number; x: number; y: number } | null>(null)
  useEffect(() => {
    if (mode === 'overview') { const f = Math.max(1, .95 * size.height / size.width); camera.position.set(6.4 + 8.6 * f, 12 * f, -3.7 + 10.7 * f); camera.up.set(0, 1, 0); camera.lookAt(6.4, 0, -3.7) }
    if (mode === 'plan') { camera.position.set(6.4, 25, -3.7); camera.up.set(0, 0, -1); camera.lookAt(6.4, 0, -3.7) }
    keys.current.clear(); speed.current = [0, 0]
  }, [mode, camera, size.width, size.height])
  useEffect(() => {
    const clear = () => { keys.current.clear(); speed.current = [0, 0]; useApp.setState({ virtualMove: [0, 0] }) }
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { document.exitPointerLock?.(); clear(); return }
      if (!document.pointerLockElement && /INPUT|SELECT|TEXTAREA|BUTTON/.test((e.target as HTMLElement)?.tagName)) return
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { keys.current.add(e.code); e.preventDefault() }
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.code)
    const mouse = (e: MouseEvent) => { if (document.pointerLockElement === gl.domElement) useApp.getState().look(e.movementX, e.movementY) }
    const lock = () => { const locked = document.pointerLockElement === gl.domElement; useApp.setState({ locked }); if (!locked) clear() }
    const touchStart = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && useApp.getState().mode === 'walk' && !useApp.getState().measuring) { touch.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; gl.domElement.setPointerCapture(e.pointerId) }
    }
    const touchMove = (e: PointerEvent) => {
      const t = touch.current; if (t && t.id === e.pointerId) { useApp.getState().look(e.clientX - t.x, e.clientY - t.y); t.x = e.clientX; t.y = e.clientY }
    }
    const touchEnd = () => { touch.current = null }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear); document.addEventListener('mousemove', mouse); document.addEventListener('pointerlockchange', lock)
    gl.domElement.addEventListener('pointerdown', touchStart); gl.domElement.addEventListener('pointermove', touchMove); gl.domElement.addEventListener('pointerup', touchEnd); gl.domElement.addEventListener('pointercancel', touchEnd)
    return () => {
      clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear); document.removeEventListener('mousemove', mouse); document.removeEventListener('pointerlockchange', lock)
      gl.domElement.removeEventListener('pointerdown', touchStart); gl.domElement.removeEventListener('pointermove', touchMove); gl.domElement.removeEventListener('pointerup', touchEnd); gl.domElement.removeEventListener('pointercancel', touchEnd)
    }
  }, [gl])
  useFrame((_, delta) => {
    const s = useApp.getState(); if (s.mode !== 'walk' || !s.world) return
    camera.up.set(0, 1, 0); camera.rotation.order = 'YXZ'; camera.rotation.set(s.pitch, s.yaw, 0, 'YXZ')
    const dt = Math.min(delta, .05), k = keys.current
    const keyX = s.locked ? Number(k.has('KeyD') || k.has('ArrowRight')) - Number(k.has('KeyA') || k.has('ArrowLeft')) : 0
    const keyY = s.locked ? Number(k.has('KeyW') || k.has('ArrowUp')) - Number(k.has('KeyS') || k.has('ArrowDown')) : 0
    let x = keyX + s.virtualMove[0], y = keyY + s.virtualMove[1]
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l }
    if (s.measuring) { x = 0; y = 0 }
    const wanted: Vec2 = [(Math.cos(s.yaw) * x - Math.sin(s.yaw) * y) * 1.65, (-Math.sin(s.yaw) * x - Math.cos(s.yaw) * y) * 1.65]
    const t = 1 - Math.exp(-12 * dt)
    speed.current = [speed.current[0] + (wanted[0] - speed.current[0]) * t, speed.current[1] + (wanted[1] - speed.current[1]) * t]
    if (Math.hypot(...speed.current) > .001) {
      const p = moveWithCollision(s.position, [speed.current[0] * dt, speed.current[1] * dt], s.world, isFurnitureVisible)
      s.setPosition(p)
      const r = s.world.rooms.find(r => inside(p, r.polygon)); if (r && r.id !== s.room) useApp.setState({ room: r.id })
    }
    const p = useApp.getState().position
    camera.position.set(p[0], s.world.parameters.CAMERA_HEIGHT, p[1])
  })
  return <>
    <PerspectiveCamera makeDefault={mode !== 'plan'} fov={65} near={.04} far={150} />
    <OrthographicCamera makeDefault={mode === 'plan'} zoom={Math.max(15, Math.min((size.width - 60) / 14, (size.height - 100) / 10))} near={.1} far={150} />
    {mode !== 'walk' && <OrbitControls key={mode} target={[6.4, 0, -3.7]} enableRotate={mode === 'overview'} minDistance={5} maxDistance={60} minZoom={10} maxZoom={180} maxPolarAngle={Math.PI / 2.05} makeDefault />}
  </>
}
