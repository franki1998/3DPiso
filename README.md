# 3DPiso

Plantilla abierta para convertir un piso modelado en Blender en una web 3D navegable con React, Three.js y Vite.

Este repositorio es una demo educativa y de portfolio. La vivienda incluida es ficticia: no contiene planos, direcciones, modelos ni datos privados de una vivienda real.

## Demo local

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:5173/`.

Para compilar:

```bash
npm run build
npm run preview
```

## Que incluye

- Visor web en React + Three.js.
- Modo recorrido en primera persona con WASD, raton y colisiones.
- Vista general orbital y vista de planta.
- Medicion entre dos puntos del modelo.
- Seleccion y ocultacion de mobiliario por estancia.
- Minimap, controles moviles y exportacion de estado JSON.
- Contrato `public/models/world.json` para conectar Blender con la web.
- Demo 3D ficticia generada desde `scripts/generate_demo_scene.py`.

## Flujo recomendado

1. Modela o reconstruye tu vivienda en Blender.
2. Separa arquitectura y mobiliario por piezas con IDs estables.
3. Exporta GLB y un `world.json` con habitaciones, puntos de aparicion y colisiones.
4. Sustituye los archivos en `public/models/`.
5. Ejecuta `npm run build` y publica la carpeta generada o despliega en Vercel.

La guia paso a paso esta en `docs/`.

## Archivos clave

```text
src/components/House.tsx       Carga GLB y raycast de seleccion/medicion
src/controls/Navigation.tsx    Camaras, teclado, raton y tactil
src/controls/collision.ts      Colisiones 2D puras y testeables
src/store.ts                   Estado global del visor
public/models/world.json       Datos metricos y de navegacion
scripts/generate_demo_scene.py Genera la demo ficticia con Blender
```

## Privacidad

No subas a un repositorio publico:

- planos con direccion, bloque, portal, planta o letra;
- fotografias originales si identifican la vivienda;
- GLB o `.blend` del piso real si no quieres hacerlo publico;
- logs con rutas locales, cuentas, emails o tokens;
- backups completos del proyecto.

Para un repo publico, usa una demo ficticia o anonimizada como la incluida aqui.

## Licencia

MIT. Revisa la licencia de cualquier modelo, textura o plano que anadas por tu cuenta.
