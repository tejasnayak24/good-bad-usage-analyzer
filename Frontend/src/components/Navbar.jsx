import React, { useState, useEffect } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { useToast } from './Toast'
import { simulateAlert } from '../services/api'

const MONO = "'JetBrains Mono', monospace"

export default function Navbar() {
  const { running, setRunning } = useSimulation()
  const { addToast } = useToast()
  const [time, setTime] = useState(new Date())
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleSimulateAlert = async () => {
    if (simulating) return
    setSimulating(true)
    try {
      const res = await simulateAlert()
      const { machine_name } = res.data.data
      addToast(`⚠ Alert triggered on ${machine_name} — overload active ~50 s`, 'bad', 5000)
    } catch {
      addToast('Could not reach backend — is the server running?', 'warning')
      setSimulating(false)
      return
    }
    setTimeout(() => setSimulating(false), 6000)
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 220, right: 0, height: 52,
      background: '#FFFFFF', borderBottom: '1px solid #E5E5EA',
      display: 'flex', alignItems: 'center', padding: '0 24px',
      justifyContent: 'space-between', zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ fontFamily: MONO, color: '#007AFF', fontSize: 13, letterSpacing: 1.5, fontWeight: 600 }}>
        ⬡ NEXUS MONITOR
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#6E6E73' }}>
          {time.toLocaleTimeString()} · {time.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>

        {/* ── Simulate Alert ─────────────────────────────────────────────── */}
        <button
          onClick={handleSimulateAlert}
          disabled={simulating}
          title="Force a random machine into overload — triggers an alert within 2 s"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: simulating ? 'rgba(255,59,48,0.12)' : 'rgba(255,59,48,0.07)',
            border: '1px solid #FF3B30',
            borderRadius: 10, padding: '4px 12px', fontSize: 11,
            fontFamily: MONO, color: '#FF3B30',
            cursor: simulating ? 'default' : 'pointer',
            opacity: simulating ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#FF3B30', display: 'inline-block', flexShrink: 0,
            animation: simulating ? 'pulse 1s infinite' : 'none',
          }} />
          {simulating ? 'OVERLOAD…' : '⚡ SIM ALERT'}
        </button>

        {/* ── Start / Stop simulation ────────────────────────────────────── */}
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: running ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.08)',
            border: `1px solid ${running ? '#FF3B30' : '#34C759'}`,
            borderRadius: 10, padding: '4px 12px', fontSize: 11,
            fontFamily: MONO,
            color: running ? '#FF3B30' : '#34C759',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: running ? '#FF3B30' : '#34C759',
            display: 'inline-block',
            animation: running ? 'pulse 1.2s infinite' : 'none',
          }} />
          {running ? '■ STOP SIM' : '▶ START SIM'}
        </button>
      </div>
    </nav>
  )
}
