import type { Vec2, World, Collider } from '../data/types'

export function inside(p: Vec2, poly: Vec2[]): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit
  }
  return hit
}
export function edgeDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = dx * dx + dz * dz
  const t = length ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / length)) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)
}
export function circleHits(p: Vec2, radius: number, poly: Vec2[]): boolean {
  return inside(p, poly) || poly.some((a, i) => edgeDistance(p, a, poly[(i + 1) % poly.length]) < radius)
}
export function canStand(p: Vec2, world: World, visible: (id: string) => boolean, radius = world.parameters.PLAYER_RADIUS): boolean {
  const terrace = world.rooms.find(r => r.id === 'terrace')!.polygon
  // Include the wall-depth threshold between the main slab and terrace finish.
  const supported = (q: Vec2) => inside(q, world.outer) || inside(q, terrace) ||
    terrace.some((a, i) => edgeDistance(q, a, terrace[(i + 1) % terrace.length]) < .145)
  if (!supported(p)) return false
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6
    if (!supported([p[0] + Math.cos(a) * radius, p[1] + Math.sin(a) * radius])) return false
  }
  return !world.colliders.some((c: Collider) => c.minHeight < world.parameters.PLAYER_HEIGHT && c.maxHeight > .08 &&
    (!c.furnitureId || visible(c.furnitureId)) && circleHits(p, radius, c.polygon))
}
export function moveWithCollision(from: Vec2, delta: Vec2, world: World, visible: (id: string) => boolean): Vec2 {
  let p: Vec2 = [...from]
  const steps = Math.max(1, Math.ceil(Math.hypot(...delta) / .035))
  for (let i = 0; i < steps; i++) {
    const x: Vec2 = [p[0] + delta[0] / steps, p[1]]
    if (canStand(x, world, visible)) p = x
    const z: Vec2 = [p[0], p[1] + delta[1] / steps]
    if (canStand(z, world, visible)) p = z
  }
  return p
}
export const distance3D = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
