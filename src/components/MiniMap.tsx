import { useApp } from '../store'
export function MiniMap() {
  const world = useApp(s => s.world)!, position = useApp(s => s.position), yaw = useApp(s => s.yaw), mode = useApp(s => s.mode)
  return <div className="minimap"><span>Tu posición <small>{mode === 'walk' ? 'EN RECORRIDO' : 'PLANTA'}</small></span>
    <svg viewBox="-0.4 -9.3 14.1 11" aria-label="Minimapa de la vivienda">
      {world.rooms.map(r => <polygon key={r.id} points={r.polygon.map(p => p.join(',')).join(' ')} fill={r.id === 'terrace' ? '#bfd2c0' : '#e3e5dd'} stroke="#789087" strokeWidth=".04" />)}
      <line x1={position[0]} y1={position[1]} x2={position[0] - Math.sin(yaw) * .8} y2={position[1] - Math.cos(yaw) * .8} stroke="#d28d43" strokeWidth=".12" />
      <circle cx={position[0]} cy={position[1]} r=".22" fill="#285e51" stroke="white" strokeWidth=".09" />
    </svg></div>
}
