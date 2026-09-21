export type Vec2 = [number, number]
export type Vec3 = [number, number, number]
export type Mode = 'walk' | 'overview' | 'plan'
export interface Room { id: string; name: string; polygon: Vec2[]; spawn: Vec2; areaOfficial: number; areaModel: number; dimensions: Vec2; confidence: string }
export interface Furniture { id: string; name: string; room: string; type: string; objectName: string; width: number; depth: number; height: number; visible: boolean; position: Vec3; rotation: Vec3 }
export interface Collider { id: string; polygon: Vec2[]; minHeight: number; maxHeight: number; furnitureId: string | null }
export interface World { version: number; units: string; parameters: Record<string, number>; rooms: Room[]; outer: Vec2[]; colliders: Collider[]; furniture: Furniture[]; entry: Vec2; kitchenSpawn: Vec2; precisionLabel: string }
export interface FurnitureOverride { visible?: boolean; position?: Vec3; rotation?: Vec3; assetUrl?: string }
export interface Layout { version: 1; name: string; furniture: Record<string, FurnitureOverride> }
