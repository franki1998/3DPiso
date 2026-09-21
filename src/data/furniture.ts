import type { Furniture, World } from './types'

export const furnitureRooms: Record<string, string> = {
  'living-room': 'Salón', 'bedroom-1': 'Dormitorio 1', 'bedroom-2': 'Dormitorio 2',
  'bedroom-3': 'Dormitorio 3', 'bedroom-4': 'Dormitorio 4', terrace: 'Terraza',
}
const names: Record<string, string> = {
  Sofa_Main: 'Sofá principal', Coffee_Table: 'Mesa de centro', Terrace_Table: 'Mesa de terraza',
  Bed_Bedroom_1: 'Cama principal · 150 cm', Bed_Bedroom_2: 'Cama dormitorio 2',
  Bed_Bedroom_3: 'Cama dormitorio 3', Bed_Bedroom_4: 'Cama dormitorio 4',
}
// The catalog comes from Blender metadata, not a second hardcoded set of dimensions.
export function furnitureCatalog(world: World): Furniture[] {
  return world.furniture.map(f => ({ ...f, name: names[f.id] ?? f.name.replaceAll('_', ' ') }))
}
