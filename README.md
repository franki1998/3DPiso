# 3DPiso — Interactive 3D Home Viewer

Open portfolio project for turning a Blender scene into a navigable 3D web experience using React, Three.js and Vite.

The included home is fictional. The repository contains no plans, addresses, models or personal data from a real property.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

Production build:

```bash
npm run build
npm run preview
```

## Features

- React and Three.js 3D viewer.
- First-person navigation with WASD, mouse controls and collisions.
- Orbital overview and floor-plan views.
- Point-to-point measurements.
- Furniture selection and visibility controls by room.
- Minimap, mobile controls and JSON state export.
- `public/models/world.json` contract connecting Blender assets to the web viewer.
- Fictional demo scene generated through `scripts/generate_demo_scene.py`.

## Blender-to-web workflow

1. Model or reconstruct the space in Blender.
2. Separate architecture and furniture into components with stable IDs.
3. Export the GLB model and a `world.json` containing rooms, spawn points and collision data.
4. Replace the example files under `public/models/`.
5. Run `npm run build` and deploy the generated application.

Detailed guidance is available under `docs/`.

## Key files

```text
src/components/House.tsx       GLB loading, selection and measurement raycasting
src/controls/Navigation.tsx    Camera, keyboard, mouse and touch controls
src/controls/collision.ts      Pure, testable 2D collision logic
src/store.ts                   Viewer state
public/models/world.json       Metric and navigation data
scripts/generate_demo_scene.py Fictional Blender demo generator
```

## Privacy

Do not publish:

- plans containing an address, building, entrance, floor or unit;
- original photographs that identify a real property;
- real `.blend` or GLB files unless they are intended to be public;
- logs containing local paths, accounts, emails or tokens;
- complete project backups.

Use a fictional or properly anonymised demo for public repositories, as this project does.

## License

MIT. Check the licence of any third-party model, texture or plan before adding it.
