# De Blender a la web

Recomendaciones practicas:

- Trabaja en metros.
- Usa nombres estables para objetos importantes.
- Exporta arquitectura y mobiliario por grupos para no cargar un unico GLB gigante.
- Guarda `userData` o propiedades personalizadas en los objetos seleccionables.
- Mantén las colisiones simples: poligonos 2D suelen bastar para recorrer una planta.
- Valida una medida conocida despues de exportar el GLB para evitar escalados accidentales.

En esta demo, `scripts/generate_demo_scene.py` crea modelos ficticios y el contrato `world.json` automaticamente.
