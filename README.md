# 3DPiso — 3D Home Planner

Open portfolio project for turning a synthetic apartment model into an interactive 3D interior planner using React, TypeScript, Vite, Three.js, React Three Fiber, Drei and Zustand.

The included apartment is fictional. The repository contains no plans, addresses, models, exact geometry or personal data from a real property.

## Features

- Edit, plan, overview and first-person walkthrough modes.
- Parametric furniture catalog with real metric dimensions.
- Click-to-place, drag-to-move and rotate furniture.
- Movement and rotation snapping.
- Selection ring and object properties panel.
- Hide, duplicate, delete, undo and redo.
- Save multiple layouts in `localStorage`.
- Import/export layout JSON.
- Measurement tool in meters.
- Mobile joystick and touch look.
- Synthetic Blender-generated demo GLB assets.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

```bash
npm test
npm run build
npm run preview
```

## Blender-To-Web Workflow

1. Model or reconstruct the space in Blender, or generate simple architecture from JSON.
2. Keep a metric source of truth for rooms, walls, spawns and collision polygons.
3. Export GLB models and `public/models/world.json`.
4. Replace the example files under `public/models/`.
5. Run `npm run build` and deploy the generated app.

The runtime contract lives in `public/models/world.json`:

- `rooms`: polygons, names, spawns and areas.
- `outer`: walkable envelope.
- `colliders`: walls, fixed elements and generated furniture boxes.
- `furniture`: initial editable furniture.
- `parameters`: player height, camera height and movement radius.

## Key Files

```text
src/components/House.tsx       GLB loading, editable furniture and measurement raycasting
src/components/Sidebar.tsx     Catalog, object panel, layouts and import/export
src/controls/Navigation.tsx    Camera, keyboard, mouse and touch controls
src/controls/collision.ts      Pure, testable 2D collision logic
src/store.ts                   Planner state, undo/redo and local layouts
src/data/catalog.ts            Parametric furniture catalog
public/models/world.json       Metric and navigation data
scripts/generate_demo_scene.py Fictional Blender demo generator
```

## Demo Assets

Regenerate the synthetic demo with Blender:

```bash
blender --background --python scripts/generate_demo_scene.py
```

The demo is intentionally simple and different from any real apartment.

## Privacy Checklist

Before publishing your own fork, remove:

- original floorplan photos;
- addresses, names, block, floor or unit identifiers;
- exact real geometry if the home must stay private;
- EXIF metadata;
- `.env`, tokens and hosting credentials;
- local absolute paths;
- full project backups.

Use a fictional or properly anonymised demo for public repositories, as this project does.

## License

MIT. If you add third-party assets, keep their license notices.
