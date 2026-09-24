import type { Furniture } from './types'

export interface CatalogItem { id: string; name: string; category: string; type: string; width: number; depth: number; height: number; color: string }

export const snapSteps = [0, .05, .10, .25]
export const rotateSteps = [1, 5, 15, 45, 90]

export const catalog: CatalogItem[] = [
  { id: 'sofa_2', name: 'Sofá 2 plazas', category: 'Salón', type: 'sofa', width: 1.75, depth: .90, height: .82, color: '#9a6a58' },
  { id: 'sofa_3', name: 'Sofá 3 plazas', category: 'Salón', type: 'sofa', width: 2.25, depth: .95, height: .82, color: '#8e604e' },
  { id: 'armchair', name: 'Sillón', category: 'Salón', type: 'chair', width: .82, depth: .86, height: .86, color: '#b27a54' },
  { id: 'coffee_table', name: 'Mesa centro', category: 'Salón', type: 'table', width: 1.10, depth: .60, height: .40, color: '#b58a5f' },
  { id: 'tv', name: 'TV 55"', category: 'Salón', type: 'tv', width: 1.25, depth: .10, height: .75, color: '#15191d' },
  { id: 'tv_unit', name: 'Mueble TV', category: 'Salón', type: 'storage', width: 1.80, depth: .42, height: .48, color: '#d8d1c3' },
  { id: 'dining_table', name: 'Mesa comedor', category: 'Comedor', type: 'table', width: 1.60, depth: .90, height: .75, color: '#c4a06f' },
  { id: 'dining_chair', name: 'Silla', category: 'Comedor', type: 'chair', width: .46, depth: .52, height: .86, color: '#6f4a37' },
  { id: 'bed_90', name: 'Cama 90', category: 'Dormitorio', type: 'bed', width: .90, depth: 1.90, height: .55, color: '#d6cabb' },
  { id: 'bed_135', name: 'Cama 135', category: 'Dormitorio', type: 'bed', width: 1.35, depth: 1.90, height: .55, color: '#d6cabb' },
  { id: 'bed_150', name: 'Cama 150', category: 'Dormitorio', type: 'bed', width: 1.50, depth: 2.00, height: .55, color: '#d6cabb' },
  { id: 'bed_160', name: 'Cama 160', category: 'Dormitorio', type: 'bed', width: 1.60, depth: 2.00, height: .55, color: '#d6cabb' },
  { id: 'nightstand', name: 'Mesita', category: 'Dormitorio', type: 'storage', width: .45, depth: .40, height: .50, color: '#c7ad87' },
  { id: 'desk', name: 'Escritorio', category: 'Despacho', type: 'desk', width: 1.20, depth: .65, height: .75, color: '#b69168' },
  { id: 'desk_chair', name: 'Silla escritorio', category: 'Despacho', type: 'chair', width: .55, depth: .58, height: .90, color: '#44515f' },
  { id: 'dresser', name: 'Cómoda', category: 'Almacenamiento', type: 'storage', width: 1.10, depth: .48, height: .82, color: '#cdbb9f' },
  { id: 'wardrobe_free', name: 'Armario auxiliar', category: 'Almacenamiento', type: 'storage', width: 1.20, depth: .60, height: 2.10, color: '#d4d0c6' },
  { id: 'terrace_table', name: 'Mesa terraza', category: 'Terraza', type: 'table', width: .80, depth: .80, height: .72, color: '#bfa16c' },
]

export const categories = Array.from(new Set(catalog.map(c => c.category)))

export function fromCatalog(item: CatalogItem, position: [number, number], room = 'living-room'): Furniture {
  const id = `${item.id}_${Math.random().toString(36).slice(2, 8)}`
  return { id, catalogId: item.id, name: item.name, room, type: item.type, objectName: id, width: item.width, depth: item.depth, height: item.height, visible: true, position: [position[0], item.height / 2, position[1]], rotation: [0, 0, 0], color: item.color }
}
