import { create } from 'zustand'
import type { Vec2, Vec3, Mode, World, Layout } from './data/types'
import { furnitureCatalog, furnitureRooms } from './data/furniture'
import { canStand } from './controls/collision'

interface State {
  world: World | null; mode: Mode; panel: boolean; info: boolean; dimensions: boolean; minimap: boolean
  position: Vec2; yaw: number; pitch: number; virtualMove: Vec2; locked: boolean
  roomVisible: Record<string, boolean>; hidden: Record<string, boolean>; selected: string | null; room: string
  measuring: boolean; points: Vec3[]; loaded: boolean; error: string | null
  init: (world: World) => void; setMode: (mode: Mode) => void; teleport: (room: string) => void
  setPosition: (position: Vec2) => void; look: (dx: number, dy: number) => void
  toggleRoom: (room: string) => void; setAll: (visible: boolean) => void; hide: (id: string) => void
  measure: () => void; addPoint: (point: Vec3) => void; reset: () => void; layout: () => Layout
}
export const useApp = create<State>((set, get) => ({
  world: null, mode: 'overview', panel: window.innerWidth > 760, info: true, dimensions: false, minimap: true,
  position: [0, 0], yaw: Math.PI, pitch: 0, virtualMove: [0, 0], locked: false,
  roomVisible: Object.fromEntries(Object.keys(furnitureRooms).map(k => [k, true])), hidden: {}, selected: null, room: 'living-room',
  measuring: false, points: [], loaded: false, error: null,
  init: world => set({ world: { ...world, furniture: furnitureCatalog(world) }, position: world.entry }),
  setMode: mode => { document.exitPointerLock?.(); set({ mode, locked: false, virtualMove: [0, 0] }) },
  teleport: room => {
    const w = get().world; if (!w) return
    const pos = room === 'entry' ? w.entry : room === 'kitchen' ? w.kitchenSpawn : w.rooms.find(r => r.id === room)?.spawn
    if (pos) { document.exitPointerLock?.(); set({ position: [...pos], mode: 'walk', pitch: 0,
      yaw: room === 'entry' || room === 'living-room' ? Math.PI : room === 'hallway' ? Math.PI / 2 : 0,
      room: room === 'entry' || room === 'kitchen' ? 'living-room' : room, locked: false, virtualMove: [0, 0] }) }
  },
  setPosition: position => set({ position }),
  look: (dx, dy) => set(s => ({ yaw: s.yaw - dx * .0024, pitch: Math.max(-1.4, Math.min(1.4, s.pitch - dy * .0024)) })),
  toggleRoom: room => { set(s => ({ roomVisible: { ...s.roomVisible, [room]: !s.roomVisible[room] } })); keepPlayerClear() },
  setAll: visible => { set({ roomVisible: Object.fromEntries(Object.keys(furnitureRooms).map(k => [k, visible])), hidden: {}, selected: null }); keepPlayerClear() },
  hide: id => set(s => ({ hidden: { ...s.hidden, [id]: true }, selected: null })),
  measure: () => { document.exitPointerLock?.(); set(s => ({ measuring: !s.measuring, points: [], locked: false })) },
  addPoint: point => set(s => ({ points: s.points.length === 2 ? [point] : [...s.points, point] })),
  reset: () => { get().setAll(true); set({ measuring: false, points: [], dimensions: false, selected: null }); get().teleport('entry') },
  layout: () => ({ version: 1, name: 'Mi distribución', furniture: Object.fromEntries((get().world?.furniture ?? []).map(f => [f.id, { visible: isFurnitureVisible(f.id), position: f.position, rotation: f.rotation }])) }),
}))
export function isFurnitureVisible(id: string): boolean {
  const s = useApp.getState(), f = s.world?.furniture.find(f => f.id === id)
  return !!f && s.roomVisible[f.room] !== false && !s.hidden[id]
}
function keepPlayerClear() {
  const s = useApp.getState(), w = s.world
  if (s.mode !== 'walk' || !w || canStand(s.position, w, isFurnitureVisible)) return
  const candidates = [w.entry, ...w.rooms.map(r => r.spawn)].filter(p => canStand(p, w, isFurnitureVisible))
  candidates.sort((a, b) => Math.hypot(a[0] - s.position[0], a[1] - s.position[1]) - Math.hypot(b[0] - s.position[0], b[1] - s.position[1]))
  if (candidates[0]) useApp.setState({ position: candidates[0], virtualMove: [0, 0] })
}
