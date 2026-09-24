import { useRef, useState, type ChangeEvent } from 'react'
import { furnitureRooms } from '../data/furniture'
import { useApp } from '../store'
import { distance3D } from '../controls/collision'
import { catalog, categories, rotateSteps, snapSteps } from '../data/catalog'

export function Sidebar() {
  const s = useApp(), w = s.world!, file = useRef<HTMLInputElement>(null), [newName, setNewName] = useState(s.activeLayout)
  const room = w.rooms.find(r => r.id === s.room), furniture = w.furniture.find(f => f.id === s.selected)
  function downloadLayout() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(s.exportLayout(), null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = `${s.activeLayout.replaceAll(' ', '-')}.json`; a.click(); URL.revokeObjectURL(url)
  }
  function importLayout(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => { try { s.importLayout(JSON.parse(String(r.result))) } catch { alert('JSON no válido') } }; r.readAsText(f); e.target.value = ''
  }
  return <aside className="sidebar planner" aria-label="Interior planner">
    <div className="intro"><span className="eyebrow">INTERIOR PLANNER</span><h1>Diseña,<br/>mide y recorre.</h1><p>Editar muebles, guardar opciones y entrar andando al resultado.</p></div>

    <section><h2>Distribuciones</h2><select value={s.activeLayout} onChange={e => { s.loadLayout(e.target.value); setNewName(e.target.value) }}>{s.layouts.map(l => <option key={l.name}>{l.name}</option>)}</select>
      <div className="button-pair"><button onClick={() => s.saveLayout(newName || s.activeLayout)}>Guardar</button><button onClick={s.duplicateLayout}>Duplicar</button></div>
      <div className="inline-edit"><input value={newName} onChange={e => setNewName(e.target.value)} aria-label="Nombre layout" /><button onClick={() => s.renameLayout(newName)}>Renombrar</button></div>
      <div className="button-pair"><button onClick={downloadLayout}>Exportar JSON</button><button onClick={() => file.current?.click()}>Importar</button></div>
      <input ref={file} type="file" accept=".json,application/json" hidden onChange={importLayout} />
      <button className="text-button full" onClick={() => s.deleteLayout(s.activeLayout)}>Eliminar distribución</button>
    </section>

    <section><div className="section-head"><h2>Catálogo</h2><span>{catalog.length} tipos</span></div>
      {categories.map(cat => <details key={cat} open={cat === 'Salón' || cat === 'Dormitorio'}><summary>{cat}</summary><div className="catalog-grid">{catalog.filter(c => c.category === cat).map(c => <button key={c.id} className={s.pendingCatalog === c.id ? 'catalog-card active' : 'catalog-card'} onClick={() => s.startAdd(c.id)}><b>{c.name}</b><small>{(c.width*100).toFixed(0)} × {(c.depth*100).toFixed(0)} cm</small></button>)}</div></details>)}
      {s.pendingCatalog && <p className="measure-help">Pulsa el suelo para colocar. Shift mantiene el modo añadir.</p>}
    </section>

    <section><h2>Snapping</h2><label>Movimiento<select value={s.snap} onChange={e => s.setSnap(Number(e.target.value))}>{snapSteps.map(v => <option key={v} value={v}>{v ? `${Math.round(v*100)} cm` : 'OFF'}</option>)}</select></label><label>Rotación<select value={s.rotateSnap} onChange={e => s.setRotateSnap(Number(e.target.value))}>{rotateSteps.map(v => <option key={v} value={v}>{v}°</option>)}</select></label></section>

    {furniture && <section className="selection" aria-label="Mueble seleccionado"><span className="eyebrow">OBJETO</span><h2>{furniture.name}</h2><p>{furnitureRooms[furniture.room] ?? furniture.room} · {furniture.type}</p><strong>{(furniture.width * 100).toFixed(0)} × {(furniture.depth * 100).toFixed(0)} × {(furniture.height * 100).toFixed(0)} cm</strong><dl><dt>X</dt><dd>{furniture.position[0].toFixed(2)} m</dd><dt>Y</dt><dd>{furniture.position[2].toFixed(2)} m</dd><dt>Rotación</dt><dd>{(furniture.rotation[1] * 180 / Math.PI).toFixed(0)}°</dd></dl>{s.conflict[furniture.id] && <p className="warning">Conflicto con pared, mueble o elemento fijo.</p>}<div className="button-pair"><button onClick={() => s.rotateSelected()}>Rotar</button><button onClick={s.duplicateSelected}>Duplicar</button></div><div className="button-pair"><button onClick={() => s.hide(furniture.id)}>Ocultar</button><button onClick={s.deleteSelected}>Borrar</button></div></section>}

    <section><h2>Ir a…</h2><label className="sr-only" htmlFor="room">Elegir estancia</label><select id="room" value="" onChange={e => s.teleport(e.target.value)}><option value="" disabled>Elige una estancia</option><option value="entry">Entrada</option><option value="kitchen">Cocina</option>{w.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><button className="text-button" onClick={() => s.teleport('entry')}>Volver a entrada</button></section>

    <section><div className="section-head"><h2>Visibilidad</h2><span>{w.furniture.length} piezas</span></div>{Object.entries(furnitureRooms).map(([id, label]) => <label className="toggle" key={id}><span>{label}</span><input type="checkbox" checked={s.roomVisible[id] !== false} onChange={() => s.toggleRoom(id)} /></label>)}<div className="button-pair"><button onClick={() => s.setAll(false)}>Ocultar todo</button><button onClick={() => s.setAll(true)}>Mostrar todo</button></div></section>

    <section><h2>Medir</h2><button className={s.measuring ? 'primary full' : 'full'} onClick={s.measure}>{s.measuring ? 'Terminar medición' : 'Medir'}</button>{s.measuring && <p className="measure-help" role="status">{s.points.length === 0 ? 'Pulsa dos puntos sobre el modelo.' : s.points.length === 1 ? 'Ahora pulsa el segundo punto.' : `Distancia: ${distance3D(s.points[0], s.points[1]).toFixed(2)} m.`}</p>}{s.points.length > 0 && <button className="text-button" onClick={() => useApp.setState({ points: [] })}>Borrar medida</button>}<label className="toggle"><span>Mostrar medidas</span><input type="checkbox" checked={s.dimensions} onChange={() => useApp.setState({ dimensions: !s.dimensions })} /></label><label className="toggle"><span>Información estancia</span><input type="checkbox" checked={s.info} onChange={() => useApp.setState({ info: !s.info })} /></label><label className="toggle"><span>Minimapa</span><input type="checkbox" checked={s.minimap} onChange={() => useApp.setState({ minimap: !s.minimap })} /></label></section>

    {s.info && room && <section className="room-info"><span className="eyebrow">{room.name}</span><dl><dt>Superficie documental</dt><dd>{room.areaOfficial.toFixed(2)} m²</dd><dt>Superficie calculada</dt><dd>{room.areaModel.toFixed(2)} m²</dd><dt>Dimensiones aprox.</dt><dd>{room.dimensions[0].toFixed(2)} × {room.dimensions[1].toFixed(2)} m</dd></dl></section>}
    <section><div className="button-pair"><button onClick={s.undo}>Undo</button><button onClick={s.redo}>Redo</button></div><button className="text-button full" onClick={s.reset}>Reset</button><p className="disclaimer">Plano comercial · medidas calculadas.<br/>Alturas y acabados estimados.<br/>No es un plano ejecutivo.</p></section>
  </aside>
}
