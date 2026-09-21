import { Component, Suspense, useEffect, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { useApp } from './store'
import { Navigation } from './controls/Navigation'
import { House, Measurements } from './components/House'
import { MiniMap } from './components/MiniMap'
import { TouchControls } from './components/TouchControls'
import { Sidebar } from './components/Sidebar'
import { Diagnostics } from './components/Diagnostics'
import type { World } from './data/types'

class Boundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() { return this.state.error ? <div className="load-error"><h2>No se pudo abrir la vivienda</h2><p>{this.state.error}</p><button onClick={() => location.reload()}>Reintentar</button></div> : this.props.children }
}
function Loading() {
  const { progress } = useProgress(), loaded = useApp(s => s.loaded)
  if (loaded) return null
  return <div className="loading" role="status"><div className="spinner" /><h2>Cargando vivienda…</h2><progress value={progress} max={100} /><p>{Math.round(progress)} % · Preparando tus espacios</p></div>
}
export default function App() {
  const world = useApp(s => s.world), mode = useApp(s => s.mode), panel = useApp(s => s.panel), minimap = useApp(s => s.minimap), loaded = useApp(s => s.loaded), locked = useApp(s => s.locked), measuring = useApp(s => s.measuring), error = useApp(s => s.error)
  useEffect(() => {
    const c = new AbortController()
    fetch('/models/world.json', { signal: c.signal }).then(r => { if (!r.ok) throw new Error('No se encuentran los datos métricos. Ejecuta export_web.bat.'); return r.json() }).then((w: World) => {
      if (w.units !== 'meters' || !w.rooms?.length) throw new Error('Los datos del modelo no son válidos.')
      useApp.getState().init(w)
    }).catch(e => { if (e.name !== 'AbortError') useApp.setState({ error: e.message }) })
    return () => c.abort()
  }, [])
  if (error) return <div className="load-error"><h1>No se pudo cargar el proyecto</h1><p>{error}</p><button onClick={() => location.reload()}>Reintentar</button></div>
  return <div className="app">
    <header><a className="brand" href="#" aria-label="3DPiso inicio">3DPISO<span>DEMO / WEB 3D</span></a><nav aria-label="Modos de cámara">{([['walk', 'Recorrer'], ['overview', 'Vista general'], ['plan', 'Planta']] as const).map(([id, label]) => <button key={id} aria-pressed={mode === id} className={mode === id ? 'active' : ''} onClick={() => useApp.getState().setMode(id)}>{label}</button>)}</nav><span className="project-mark">PLANTILLA <b>1:1</b></span></header>
    <main className={panel ? 'layout' : 'layout folded'}>
      {world && panel && <Sidebar />}
      <div className="viewer">
        <div className="viewer-tools"><button aria-label={panel ? 'Plegar panel' : 'Abrir panel'} onClick={() => useApp.setState({ panel: !panel })}>☰</button><span className="status-pill"><i />{loaded ? 'Casa cargada · escala 1:1' : 'Preparando vivienda'}</span></div>
        <Boundary>
          {world && <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
            <color attach="background" args={['#e8ebe4']} />
            <ambientLight intensity={.85} /><hemisphereLight args={['#ecf4ff', '#c4b19a', 1.5]} />
            <directionalLight position={[8, 15, 5]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-normalBias={.035} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, -.25, -4]} receiveShadow raycast={() => null}><planeGeometry args={[100, 100]} /><meshStandardMaterial color="#d7ded4" roughness={1} /></mesh>
            <Navigation />
            <Diagnostics />
            <Suspense fallback={null}><House /><Measurements /></Suspense>
          </Canvas>}
          <Loading />
        </Boundary>
        {world && loaded && minimap && <MiniMap />}
        {world && loaded && mode === 'walk' && !locked && !measuring && <button className="enter-walk" onClick={() => {
          const canvas = document.querySelector('canvas')
          canvas?.requestPointerLock()?.catch(() => useApp.setState({ locked: false }))
        }}>Entrar en recorrido <small>Ratón para mirar · WASD para caminar · ESC para salir</small></button>}
        {locked && <div className="crosshair">+</div>}
        <TouchControls />
        <div className="viewer-footer"><span>{mode === 'walk' ? 'Persona 1,80 m · ojos 1,70 m' : mode === 'plan' ? 'Vista cenital · rueda para acercar' : 'Arrastra para girar · rueda para acercar'}</span><span>Demo ficticia · sustituye los modelos por los tuyos</span></div>
      </div>
    </main>
  </div>
}
