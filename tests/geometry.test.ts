import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import type { Vec2, World } from '../src/data/types'

const world = JSON.parse(fs.readFileSync(new URL('../public/models/world.json', import.meta.url), 'utf8')) as World
const area = (poly: Vec2[]) => Math.abs(poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0)) / 2

test('room polygon areas stay within 2 percent of published constraints', () => {
  for (const room of world.rooms) {
    const calculated = area(room.polygon)
    if (!('holes' in room) || !(room as unknown as { holes?: Vec2[][] }).holes?.length) assert.ok(Math.abs(calculated - room.areaModel) < 0.02, `${room.id} polygon mismatch`)
    assert.ok(Math.abs(room.areaModel / room.areaOfficial - 1) <= 0.02, `${room.id} exceeds 2%`)
  }
})

test('runtime scale is meters without global scale factor', () => {
  assert.equal(world.units, 'meters')
  assert.equal(world.parameters.PLAYER_HEIGHT, 1.8)
  assert.equal(world.parameters.CAMERA_HEIGHT, 1.7)
  assert.ok(world.rooms.length >= 1)
  assert.ok(world.outer.length >= 4)
})
