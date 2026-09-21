import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { canStand, circleHits, distance3D, moveWithCollision } from '../src/controls/collision'
import type { Vec2, World } from '../src/data/types'
const world = JSON.parse(fs.readFileSync(new URL('../public/models/world.json', import.meta.url), 'utf8')) as World
test('teleports are safe with all furniture visible, full human radius', () => {
  for (const r of world.rooms) assert.ok(canStand(r.spawn, world, () => true), r.id)
  assert.ok(canStand(world.entry, world, () => true))
  assert.ok(canStand(world.kitchenSpawn, world, () => true))
})
test('circle detects face, edge and corner, no tunneling through large movement', () => {
  assert.ok(circleHits([1.1, 1.1], .2, [[0, 0], [1, 0], [1, 1], [0, 1]]))
  assert.ok(!circleHits([1.3, 1.3], .2, [[0, 0], [1, 0], [1, 1], [0, 1]]))
  const end = moveWithCollision(world.entry, [30, 0], world, () => false)
  assert.ok(canStand(end, world, () => false)); assert.ok(end[0] - world.entry[0] < 30)
})
test('measurement uses Euclidean world meters including vertical distance', () => {
  assert.equal(distance3D([0, 0, 0], [3, 0, 4]), 5)
  assert.equal(distance3D([2, 0, -3], [2, world.parameters.PLAYER_HEIGHT, -3]), 1.8)
})
test('every room and terrace reachable from entrance with furniture', () => {
  const step = .05, origin = world.entry, queue: Vec2[] = [[0, 0]], seen = new Set(['0,0'])
  const reached = new Set<string>()
  for (let index = 0; index < queue.length; index++) {
    const ij = queue[index], p: Vec2 = [origin[0] + ij[0] * step, origin[1] + ij[1] * step]
    for (const r of world.rooms) if (Math.hypot(p[0] - r.spawn[0], p[1] - r.spawn[1]) < .17) reached.add(r.id)
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q: Vec2 = [ij[0] + dx, ij[1] + dz], key = q.join(',')
      if (seen.has(key)) continue
      seen.add(key)
      const dest: Vec2 = [origin[0] + q[0] * step, origin[1] + q[1] * step]
      if (canStand(dest, world, () => true)) queue.push(q)
    }
  }
  assert.equal(reached.size, world.rooms.length, `Unreachable: ${world.rooms.filter(r => !reached.has(r.id)).map(r => r.id).join(', ')}`)
})
