import { create } from 'zustand'
import type { Vec2, Vec3, Mode, World, Layout, Furniture, Collider, PlannerLayout } from './data/types'
import { furnitureCatalog, furnitureRooms } from './data/furniture'
import { canStand } from './controls/collision'
import { catalog, fromCatalog } from './data/catalog'

const layoutsKey = 'home-planner:layouts:v2'
const activeKey = 'home-planner:active-layout:v2'
const uid = () => Math.random().toString(36).slice(2, 9)

interface State {
  world: World | null; baseColliders: Collider[]; mode: Mode; panel: boolean; info: boolean; dimensions: boolean; minimap: boolean
  position: Vec2; yaw: number; pitch: number; virtualMove: Vec2; locked: boolean
  roomVisible: Record<string, boolean>; hidden: Record<string, boolean>; selected: string | null; room: string
  measuring: boolean; points: Vec3[]; loaded: boolean; error: string | null
  pendingCatalog: string | null; dragging: string | null; snap: number; rotateSnap: number; conflict: Record<string, boolean>
  layouts: PlannerLayout[]; activeLayout: string; past: Furniture[][]; future: Furniture[][]
  init: (world: World) => void; setMode: (mode: Mode) => void; teleport: (room: string) => void
  setPosition: (position: Vec2) => void; look: (dx: number, dy: number) => void
  toggleRoom: (room: string) => void; setAll: (visible: boolean) => void; hide: (id: string) => void; show: (id: string) => void
  select: (id: string | null) => void; startAdd: (catalogId: string | null) => void; placePending: (p: Vec2, keep?: boolean) => void
  startDrag: (id: string) => void; stopDrag: () => void; moveFurniture: (id: string, p: Vec2, commit?: boolean) => void; rotateSelected: (dir?: number) => void
  duplicateSelected: () => void; deleteSelected: () => void; setSnap: (v: number) => void; setRotateSnap: (v: number) => void
  saveLayout: (name?: string) => void; loadLayout: (name: string) => void; duplicateLayout: () => void; renameLayout: (name: string) => void; deleteLayout: (name: string) => void
  exportLayout: () => PlannerLayout; importLayout: (layout: PlannerLayout) => void; undo: () => void; redo: () => void
  measure: () => void; addPoint: (point: Vec3) => void; reset: () => void; layout: () => Layout
}

export const useApp = create<State>((set, get) => ({
  world: null, baseColliders: [], mode: 'edit', panel: window.innerWidth > 760, info: true, dimensions: false, minimap: true,
  position: [0, 0], yaw: Math.PI, pitch: 0, virtualMove: [0, 0], locked: false,
  roomVisible: Object.fromEntries(Object.keys(furnitureRooms).map(k => [k, true])), hidden: {}, selected: null, room: 'living-room',
  measuring: false, points: [], loaded: false, error: null,
  pendingCatalog: null, dragging: null, snap: .05, rotateSnap: 15, conflict: {}, layouts: [], activeLayout: 'Original', past: [], future: [],
  init: world => {
    const furniture = furnitureCatalog(world).map(f => ({ ...f, catalogId: f.catalogId ?? guessCatalog(f), color: colorFor(f.type) }))
    const layouts = readLayouts(furniture)
    const active = localStorage.getItem(activeKey) || layouts[0]?.name || 'Original'
    const selected = layouts.find(l => l.name === active) ?? layouts[0]
    const w = rebuildWorld({ ...world, furniture: selected?.furniture ?? furniture }, world.colliders.filter(c => !c.furnitureId))
    set({ world: w, baseColliders: world.colliders.filter(c => !c.furnitureId), position: world.entry, layouts, activeLayout: selected?.name ?? 'Original' })
  },
  setMode: mode => { document.exitPointerLock?.(); set({ mode, locked: false, virtualMove: [0, 0], pendingCatalog: null, dragging: null }) },
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
  show: id => set(s => { const hidden = { ...s.hidden }; delete hidden[id]; return { hidden } }),
  select: selected => set({ selected, pendingCatalog: null }),
  startAdd: pendingCatalog => { document.exitPointerLock?.(); set({ mode: 'edit', pendingCatalog, selected: null }) },
  placePending: (p, keep = false) => {
    const s = get(), item = catalog.find(c => c.id === s.pendingCatalog), w = s.world; if (!item || !w) return
    const room = w.rooms.find(r => pointInPoly(p, r.polygon))?.id ?? s.room
    const placed = fromCatalog(item, snapPoint(p, s.snap), room)
    commitFurniture([...w.furniture, placed], keep ? { selected: placed.id } : { pendingCatalog: null, selected: placed.id }, true)
  },
  startDrag: id => set({ dragging: id, selected: id, pendingCatalog: null }),
  stopDrag: () => set({ dragging: null }),
  moveFurniture: (id, p, commit = false) => {
    const s = get(), w = s.world; if (!w) return
    const next = w.furniture.map(f => f.id === id ? { ...f, position: [snap(p[0], s.snap), f.height / 2, snap(p[1], s.snap)] as Vec3, room: w.rooms.find(r => pointInPoly(p, r.polygon))?.id ?? f.room } : f)
    commitFurniture(next, {}, commit)
  },
  rotateSelected: (dir = 1) => {
    const s = get(), w = s.world; if (!w || !s.selected) return
    const step = s.rotateSnap * Math.PI / 180 * dir
    commitFurniture(w.furniture.map(f => f.id === s.selected ? { ...f, rotation: [0, snap(f.rotation[1] + step, step), 0] } : f), {}, true)
  },
  duplicateSelected: () => {
    const s = get(), w = s.world, src = w?.furniture.find(f => f.id === s.selected); if (!w || !src) return
    const copy = { ...src, id: `${src.catalogId ?? src.type}_${uid()}`, objectName: `${src.objectName}_copy`, position: [src.position[0] + .25, src.height / 2, src.position[2] + .25] as Vec3 }
    commitFurniture([...w.furniture, copy], { selected: copy.id }, true)
  },
  deleteSelected: () => { const s = get(), w = s.world; if (!w || !s.selected) return; commitFurniture(w.furniture.filter(f => f.id !== s.selected), { selected: null }, true) },
  setSnap: snap => set({ snap }), setRotateSnap: rotateSnap => set({ rotateSnap }),
  saveLayout: name => { const s = get(), w = s.world; if (!w) return; const layout = makeLayout(name || s.activeLayout, w.furniture); writeLayouts(upsert(s.layouts, layout)); set({ layouts: upsert(s.layouts, layout), activeLayout: layout.name }) },
  loadLayout: name => { const s = get(), l = s.layouts.find(l => l.name === name); if (!l || !s.world) return; localStorage.setItem(activeKey, name); commitFurniture(l.furniture, { activeLayout: name, selected: null, past: [], future: [] }, false) },
  duplicateLayout: () => { const s = get(); get().saveLayout(`${s.activeLayout} copia`) },
  renameLayout: name => { const s = get(); if (!name.trim()) return; const layouts = s.layouts.map(l => l.name === s.activeLayout ? { ...l, name, updatedAt: new Date().toISOString() } : l); writeLayouts(layouts); localStorage.setItem(activeKey, name); set({ layouts, activeLayout: name }) },
  deleteLayout: name => { const s = get(); if (s.layouts.length <= 1) return; const layouts = s.layouts.filter(l => l.name !== name); writeLayouts(layouts); const next = layouts[0]; if (next) { localStorage.setItem(activeKey, next.name); commitFurniture(next.furniture, { layouts, activeLayout: next.name, selected: null }, false) } },
  exportLayout: () => makeLayout(get().activeLayout, get().world?.furniture ?? []),
  importLayout: layout => { if (layout.version !== 2 || !Array.isArray(layout.furniture)) return; const clean = layout.furniture.slice(0, 120); commitFurniture(clean, { activeLayout: layout.name || 'Importado' }, true); get().saveLayout(layout.name || 'Importado') },
  undo: () => { const s = get(), prev = s.past.at(-1); if (!prev || !s.world) return; set({ past: s.past.slice(0, -1), future: [s.world.furniture, ...s.future], world: rebuildWorld({ ...s.world, furniture: prev }, s.baseColliders) }) },
  redo: () => { const s = get(), next = s.future[0]; if (!next || !s.world) return; set({ past: [...s.past, s.world.furniture], future: s.future.slice(1), world: rebuildWorld({ ...s.world, furniture: next }, s.baseColliders) }) },
  measure: () => { document.exitPointerLock?.(); set(s => ({ measuring: !s.measuring, points: [], locked: false, pendingCatalog: null })) },
  addPoint: point => set(s => ({ points: s.points.length === 2 ? [point] : [...s.points, point] })),
  reset: () => { const s = get(), l = s.layouts.find(l => l.name === 'Original') ?? s.layouts[0]; if (l && s.world) commitFurniture(l.furniture, { selected: null, measuring: false, points: [], dimensions: false }, false); get().teleport('entry') },
  layout: () => ({ version: 1, name: get().activeLayout, furniture: Object.fromEntries((get().world?.furniture ?? []).map(f => [f.id, { visible: isFurnitureVisible(f.id), position: f.position, rotation: f.rotation }])) }),
}))

function commitFurniture(furniture: Furniture[], extra: Partial<State>, history: boolean) {
  const s = useApp.getState(), w = s.world; if (!w) return
  const past = history ? [...s.past.slice(-29), w.furniture] : s.past
  const nextWorld = rebuildWorld({ ...w, furniture }, s.baseColliders)
  useApp.setState({ world: nextWorld, past, future: history ? [] : s.future, conflict: conflicts(nextWorld), ...extra })
  const layout = makeLayout(useApp.getState().activeLayout, furniture)
  writeLayouts(upsert(useApp.getState().layouts, layout)); useApp.setState({ layouts: upsert(useApp.getState().layouts, layout) })
  keepPlayerClear()
}

function rebuildWorld(world: World, base: Collider[]): World { return { ...world, colliders: [...base, ...world.furniture.filter(f => f.visible).map(furnitureCollider)] } }
function furnitureCollider(f: Furniture): Collider { return { id: `furniture_${f.id}`, furnitureId: f.id, minHeight: 0, maxHeight: f.height, polygon: rectPoly([f.position[0], f.position[2]], f.width, f.depth, f.rotation[1]) } }
function rectPoly(c: Vec2, w: number, d: number, a: number): Vec2[] { const pts: Vec2[] = [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]], ca=Math.cos(a), sa=Math.sin(a); return pts.map(p => [c[0]+p[0]*ca-p[1]*sa, c[1]+p[0]*sa+p[1]*ca]) }
function conflicts(w: World) { const out: Record<string, boolean> = {}; for (const f of w.furniture) out[f.id] = !canStand([f.position[0], f.position[2]], w, id => id !== f.id && isFurnitureVisible(id), Math.max(f.width, f.depth) / 2); return out }
function snap(v: number, step: number) { return step ? Math.round(v / step) * step : v }
function snapPoint(p: Vec2, step: number): Vec2 { return [snap(p[0], step), snap(p[1], step)] }
function pointInPoly(p: Vec2, poly: Vec2[]) { let hit=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++) { const a=poly[i],b=poly[j]; if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) hit=!hit } return hit }
function makeLayout(name: string, furniture: Furniture[]): PlannerLayout { return { version: 2, name, updatedAt: new Date().toISOString(), furniture: furniture.map(f => ({ ...f })) } }
function upsert(layouts: PlannerLayout[], layout: PlannerLayout) { return [...layouts.filter(l => l.name !== layout.name), layout].sort((a,b) => a.name.localeCompare(b.name)) }
function readLayouts(initial: Furniture[]) { try { const raw = localStorage.getItem(layoutsKey); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length) return parsed as PlannerLayout[] } } catch {} const base = [makeLayout('Original', initial)]; writeLayouts(base); return base }
function writeLayouts(layouts: PlannerLayout[]) { localStorage.setItem(layoutsKey, JSON.stringify(layouts)) }
function guessCatalog(f: Furniture) { return catalog.find(c => c.type === f.type)?.id ?? 'storage' }
function colorFor(type: string) { return type.includes('bed') ? '#d6cabb' : type.includes('sofa') ? '#8e604e' : type.includes('table') ? '#b58a5f' : '#cdbb9f' }

export function isFurnitureVisible(id: string): boolean {
  const s = useApp.getState(), f = s.world?.furniture.find(f => f.id === id)
  return !!f && f.visible !== false && s.roomVisible[f.room] !== false && !s.hidden[id]
}
function keepPlayerClear() {
  const s = useApp.getState(), w = s.world
  if (s.mode !== 'walk' || !w || canStand(s.position, w, isFurnitureVisible)) return
  const candidates = [w.entry, ...w.rooms.map(r => r.spawn)].filter(p => canStand(p, w, isFurnitureVisible))
  candidates.sort((a, b) => Math.hypot(a[0] - s.position[0], a[1] - s.position[1]) - Math.hypot(b[0] - s.position[0], b[1] - s.position[1]))
  if (candidates[0]) useApp.setState({ position: candidates[0], virtualMove: [0, 0] })
}
