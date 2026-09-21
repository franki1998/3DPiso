from pathlib import Path
import json
import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models"
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()


def mat(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = color
    return m


wall = mat("Warm white", (0.86, 0.82, 0.74, 1))
floor = mat("Oak floor", (0.55, 0.42, 0.28, 1))
tile = mat("Soft tile", (0.72, 0.76, 0.73, 1))
sofa_mat = mat("Terracotta fabric", (0.55, 0.24, 0.16, 1))
wood = mat("Simple wood", (0.48, 0.32, 0.18, 1))
bed_mat = mat("Linen", (0.76, 0.72, 0.64, 1))
plant_mat = mat("Plant green", (0.22, 0.42, 0.24, 1))


def box(name, x, z, w, d, h, material, furniture_id=None, room=None, kind=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, h / 2))
    o = bpy.context.object
    o.name = name
    o.dimensions = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        o.data.materials.append(material)
    if furniture_id:
        o["furnitureId"] = furniture_id
        o["room"] = room
        o["kind"] = kind or "furniture"
    elif room:
        o["roomId"] = room
    return o


def export(name, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / f"{name}.glb"),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
    )


rooms = [
    {"id": "bedroom-1", "name": "Dormitorio 1", "polygon": [[0, -5], [3, -5], [3, -3], [0, -3]], "spawn": [2.6, -4.0]},
    {"id": "bedroom-2", "name": "Dormitorio 2", "polygon": [[0, -3], [3, -3], [3, -1.5], [0, -1.5]], "spawn": [2.6, -2.25]},
    {"id": "bedroom-3", "name": "Dormitorio 3", "polygon": [[0, -1.5], [3, -1.5], [3, 0], [0, 0]], "spawn": [2.55, -0.75]},
    {"id": "bedroom-4", "name": "Estudio", "polygon": [[3, 0], [5, 0], [5, -2], [3, -2]], "spawn": [3.45, -1.5]},
    {"id": "hallway", "name": "Pasillo", "polygon": [[3, -2], [5, -2], [5, -5], [3, -5]], "spawn": [4.0, -3.4]},
    {"id": "bathroom-1", "name": "Bano 1", "polygon": [[5, 0], [6.5, 0], [6.5, -2], [5, -2]], "spawn": [5.75, -1.0]},
    {"id": "bathroom-2", "name": "Bano 2", "polygon": [[6.5, 0], [8, 0], [8, -2], [6.5, -2]], "spawn": [7.25, -1.0]},
    {"id": "living-room", "name": "Salon comedor cocina", "polygon": [[5, -2], [8, -2], [8, -5], [5, -5]], "spawn": [7.5, -2.45]},
    {"id": "terrace", "name": "Terraza", "polygon": [[8, -4.4], [10, -4.4], [10, -2.2], [8, -2.2]], "spawn": [8.4, -3.3]},
]

arch = []
for r in rooms:
    xs = [p[0] for p in r["polygon"]]
    zs = [p[1] for p in r["polygon"]]
    arch.append(box("Floor_" + r["id"], (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2, max(xs) - min(xs), max(zs) - min(zs), 0.06, tile if "bathroom" in r["id"] else floor, room=r["id"]))

for name, x, z, w, d in [
    ("Wall_North", 4, 0.06, 8.2, 0.12), ("Wall_South", 4, -5.06, 8.2, 0.12),
    ("Wall_West", -0.06, -2.5, 0.12, 5.2), ("Wall_East", 8.06, -2.5, 0.12, 5.2),
    ("Wall_Bed_Hall", 3, -2.5, 0.10, 5), ("Wall_Hall_Living", 5, -2.5, 0.10, 5),
    ("Wall_Bath", 6.5, -1, 0.10, 2), ("Terrace_Rail", 10, -3.3, 0.08, 2.2),
]:
    arch.append(box(name, x, z, w, d, 2.6, wall))
arch.append(box("Ceiling_Main", 4, -2.5, 8.2, 5.2, 0.06, wall))
export("architecture", arch)

furn = {
    "furniture_living_room": [
        box("Sofa_Main", 6.5, -4.45, 1.9, 0.75, 0.75, sofa_mat, "Sofa_Main", "living-room", "sofa"),
        box("Coffee_Table", 6.5, -3.55, 0.9, 0.5, 0.35, wood, "Coffee_Table", "living-room", "table"),
    ],
    "furniture_bedroom_1": [box("Bed_Bedroom_1", 1.4, -4.2, 1.5, 1.9, 0.55, bed_mat, "Bed_Bedroom_1", "bedroom-1", "bed")],
    "furniture_bedroom_2": [box("Bed_Bedroom_2", 1.35, -2.25, 1.35, 1.75, 0.50, bed_mat, "Bed_Bedroom_2", "bedroom-2", "bed")],
    "furniture_bedroom_3": [box("Bed_Bedroom_3", 1.35, -0.75, 1.35, 1.35, 0.50, bed_mat, "Bed_Bedroom_3", "bedroom-3", "bed")],
    "furniture_bedroom_4": [box("Desk_Studio", 4.15, -0.55, 1.1, 0.55, 0.75, wood, "Desk_Studio", "bedroom-4", "desk")],
    "furniture_terrace": [
        box("Terrace_Table", 9.0, -3.25, 0.75, 0.75, 0.72, wood, "Terrace_Table", "terrace", "table"),
        box("Plant_Terrace", 9.6, -2.65, 0.35, 0.35, 0.9, plant_mat, "Plant_Terrace", "terrace", "plant"),
    ],
}
for name, objects in furn.items():
    export(name, objects)


def dims(poly):
    xs = [p[0] for p in poly]
    zs = [p[1] for p in poly]
    return [round(max(xs) - min(xs), 2), round(max(zs) - min(zs), 2)]


def area(poly):
    total = 0
    for i, a in enumerate(poly):
        b = poly[(i + 1) % len(poly)]
        total += a[0] * b[1] - b[0] * a[1]
    return round(abs(total) / 2, 2)


furniture = []
colliders = []
for objects in furn.values():
    for o in objects:
        fid = o["furnitureId"]
        sx, sy, sz = o.dimensions
        x, by, y = o.location
        z = -by
        furniture.append({
            "id": fid, "name": fid.replace("_", " "), "room": o["room"], "type": o["kind"], "objectName": o.name,
            "width": round(sx, 2), "depth": round(sy, 2), "height": round(sz, 2), "visible": True,
            "position": [round(x, 3), round(y, 3), round(z, 3)], "rotation": [0, 0, 0]
        })
        colliders.append({
            "id": "Collider_" + fid, "furnitureId": fid, "minHeight": 0, "maxHeight": round(sz, 2),
            "polygon": [[round(x - sx / 2, 3), round(z - sy / 2, 3)], [round(x + sx / 2, 3), round(z - sy / 2, 3)], [round(x + sx / 2, 3), round(z + sy / 2, 3)], [round(x - sx / 2, 3), round(z + sy / 2, 3)]]
        })

world = {
    "version": 1,
    "units": "meters",
    "parameters": {"CEILING_HEIGHT": 2.6, "INTERIOR_WALL_THICKNESS": 0.10, "EXTERIOR_WALL_THICKNESS": 0.12, "DOOR_HEIGHT": 2.1, "WINDOW_HEIGHT": 1.2, "WINDOW_SILL_HEIGHT": 0.9, "PLAYER_HEIGHT": 1.8, "CAMERA_HEIGHT": 1.7, "PLAYER_RADIUS": 0.2},
    "outer": [[0, -5], [8, -5], [8, 0], [0, 0]],
    "rooms": [{**r, "areaOfficial": area(r["polygon"]), "areaModel": area(r["polygon"]), "dimensions": dims(r["polygon"]), "confidence": "Demo ficticia"} for r in rooms],
    "colliders": colliders,
    "furniture": furniture,
    "entry": [4.0, -4.6],
    "kitchenSpawn": [7.35, -2.75],
    "precisionLabel": "Demo ficticia sin datos privados",
}
(OUT / "world.json").write_text(json.dumps(world, indent=2), encoding="utf8")
(OUT / "world.raw.json").write_text(json.dumps(world, indent=2), encoding="utf8")
print("DEMO_SCENE_OK", OUT)
