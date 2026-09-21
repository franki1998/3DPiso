import { useState } from 'react'
import { useApp } from '../store'
export function TouchControls() {
  const [knob, setKnob] = useState([0, 0])
  const mode = useApp(s => s.mode)
  if (mode !== 'walk') return null
  const reset = () => { setKnob([0, 0]); useApp.setState({ virtualMove: [0, 0] }) }
  return <div className="touch-controls">
    <div className="joystick" role="application" aria-label="Joystick para caminar"
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault() }}
      onPointerMove={e => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const b = e.currentTarget.getBoundingClientRect()
        let x = (e.clientX - b.left - b.width / 2) / 36, y = (e.clientY - b.top - b.height / 2) / 36
        const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l }
        setKnob([x * 30, y * 30]); useApp.setState({ virtualMove: [x, -y] })
      }} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}>
      <span style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }}>✥</span>
    </div><small>Arrastra la vista para mirar</small>
  </div>
}
