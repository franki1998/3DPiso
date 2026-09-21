import { furnitureRooms } from '../data/furniture'
import { useApp } from '../store'
import { distance3D } from '../controls/collision'
export function Sidebar() {
  const s = useApp(), w = s.world!
  const room = w.rooms.find(r => r.id === s.room)
  const furniture = w.furniture.find(f => f.id === s.selected)
  function downloadLayout() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(s.layout(), null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'distribucion-3dpiso.json'; a.click(); URL.revokeObjectURL(url)
  }
  return <aside className="sidebar" aria-label="Controles de vivienda">
    <div className="intro"><span className="eyebrow">PLANTILLA ABIERTA</span><h1>Convierte un plano<br/>en visor 3D.</h1><p>Demo ficticia<br/>React · Three.js · Blender</p></div>
    <section><h2>Ir a…</h2><label className="sr-only" htmlFor="room">Elegir estancia</label>
      <select id="room" value="" onChange={e => s.teleport(e.target.value)}><option value="" disabled>Elige una estancia</option><option value="entry">Entrada</option><option value="kitchen">Cocina</option>{w.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
      <button className="text-button" onClick={() => s.teleport('entry')}>↩ Volver a entrada</button>
    </section>
    <section><div className="section-head"><h2>Mobiliario</h2><span>{w.furniture.length} piezas</span></div>
      {Object.entries(furnitureRooms).map(([id, label]) => <label className="toggle" key={id}><span>{label}</span><input type="checkbox" checked={s.roomVisible[id] !== false} onChange={() => s.toggleRoom(id)} /></label>)}
      <div className="button-pair"><button onClick={() => s.setAll(false)}>Ocultar todo</button><button onClick={() => s.setAll(true)}>Mostrar todo</button></div>
    </section>
    {furniture && <section className="selection" aria-label="Mueble seleccionado"><span className="eyebrow">MUEBLE SELECCIONADO</span><h2>{furniture.name}</h2><p>{furnitureRooms[furniture.room]} · {furniture.type}</p><strong>{(furniture.width * 100).toFixed(0)} × {(furniture.depth * 100).toFixed(0)} × {(furniture.height * 100).toFixed(0)} cm</strong><p>Envolvente real del objeto modelado.</p><button onClick={() => s.hide(furniture.id)}>Ocultar este mueble</button></section>}
    <section><h2>Explorar y medir</h2><button className={s.measuring ? 'primary full' : 'full'} onClick={s.measure}>{s.measuring ? 'Terminar medición' : 'Medir'}</button>
      {s.measuring && <p className="measure-help" role="status">{s.points.length === 0 ? 'Pulsa dos puntos sobre el modelo.' : s.points.length === 1 ? 'Ahora pulsa el segundo punto.' : `Distancia: ${distance3D(s.points[0], s.points[1]).toFixed(2)} m. Pulsa para empezar otra.`}</p>}
      {s.points.length > 0 && <button className="text-button" onClick={() => useApp.setState({ points: [] })}>Borrar medida</button>}
      <label className="toggle"><span>Mostrar medidas</span><input type="checkbox" checked={s.dimensions} onChange={() => useApp.setState({ dimensions: !s.dimensions })} /></label>
      <label className="toggle"><span>Información de estancia</span><input type="checkbox" checked={s.info} onChange={() => useApp.setState({ info: !s.info })} /></label>
      <label className="toggle"><span>Minimapa</span><input type="checkbox" checked={s.minimap} onChange={() => useApp.setState({ minimap: !s.minimap })} /></label>
    </section>
    {s.info && room && <section className="room-info"><span className="eyebrow">{room.name}</span><dl><dt>Superficie documental</dt><dd>{room.areaOfficial.toFixed(2)} m²</dd><dt>Superficie calculada</dt><dd>{room.areaModel.toFixed(2)} m²</dd><dt>Dimensiones aproximadas</dt><dd>{room.dimensions[0].toFixed(2)} × {room.dimensions[1].toFixed(2)} m</dd></dl><p>Envolvente entre paredes. Las estancias con entrantes no son rectangulares.</p></section>}
    <section><button className="full" onClick={downloadLayout}>Guardar estado JSON</button><button className="text-button full" onClick={s.reset}>Reset</button><p className="disclaimer">Demo educativa con geometría ficticia.<br/>Sustituye modelos y datos por los de tu proyecto.<br/>No es un plano ejecutivo.</p></section>
  </aside>
}
