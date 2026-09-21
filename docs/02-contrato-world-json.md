# Contrato `world.json`

La web espera `public/models/world.json` con estas claves principales:

- `units`: normalmente `meters`.
- `parameters`: altura de persona, camara, radio y alturas de puertas/ventanas.
- `outer`: poligono caminable principal.
- `rooms`: habitaciones con `id`, `name`, `polygon`, `spawn`, areas y dimensiones.
- `entry`: punto inicial.
- `kitchenSpawn`: punto especifico para cocina si no es una estancia separada.
- `colliders`: poligonos solidos para paredes, muebles o equipamiento.
- `furniture`: catalogo de muebles seleccionables, con `id`, estancia, dimensiones y transform.

Los IDs de muebles deben coincidir entre `world.json` y los `userData.furnitureId` exportados en los GLB.
