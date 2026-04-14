import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMachine, getRealtime } from '../services/api'

const MONO = "'JetBrains Mono', monospace"

const COMPONENTS = [
  { id: 'bearing',  name: 'Bearing Assembly',  icon: '◎', checkFn: r => r.vibration > 6 ? 'Bad' : r.vibration > 4 ? 'Warning' : 'Good' },
  { id: 'motor',    name: 'Motor Windings',     icon: '⚙', checkFn: r => r.current > 10 ? 'Bad' : r.current > 7 ? 'Warning' : 'Good' },
  { id: 'cooling',  name: 'Cooling System',     icon: '❄', checkFn: r => r.temperature > 80 ? 'Bad' : r.temperature > 60 ? 'Warning' : 'Good' },
  { id: 'shaft',    name: 'Drive Shaft',        icon: '⬡', checkFn: r => r.rpm < 200 ? 'Bad' : r.rpm < 1680 ? 'Warning' : 'Good' },
  { id: 'power',    name: 'Power Supply',       icon: '⚡', checkFn: r => r.current > 13 ? 'Bad' : r.current > 9 ? 'Warning' : 'Good' },
  { id: 'sensor',   name: 'Sensor Array',       icon: '◈', checkFn: () => 'Good' },
]

export default function Components() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [machine, setMachine] = useState(null)
  const [reading, setReading] = useState(null)

  useEffect(() => {
    getMachine(id).then(r => setMachine(r.data.data)).catch(() => {})
    getRealtime(id).then(r => setReading(r.data.data)).catch(() => {})
  }, [id])

  const statusColor = s => s === 'Good' ? '#34C759' : s === 'Warning' ? '#FF9500' : '#FF3B30'

  return (
    <div style={{ paddingTop: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(`/machines/${id}`)} style={{
          background: '#E5E5EA', border: 'none', color: '#1C1C1E',
          padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 11
        }}>← BACK</button>
        <div className="page-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          ⬡ Components — {machine?.name}
        </div>
      </div>

      {reading && (
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 14, marginBottom: 20,
          display: 'flex', gap: 24, flexWrap: 'wrap', fontFamily: MONO, fontSize: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          {[
            ['TEMP', `${reading.temperature}°C`],
            ['CURRENT', `${reading.current}A`],
            ['RPM', reading.rpm],
            ['VIBRATION', `${reading.vibration} mm/s`],
            ['ML STATUS', reading.status],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ color: '#6E6E73' }}>{k}: </span>
              <span style={{ color: '#007AFF', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {COMPONENTS.map(comp => {
          const status = reading ? comp.checkFn(reading) : 'Good'
          const color  = statusColor(status)
          return (
            <div key={comp.id} style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5EA',
              borderLeft: `4px solid ${color}`,
              borderRadius: 14, padding: 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{comp.icon}</span>
                <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#1C1C1E' }}>{comp.name}</div>
              <div style={{ fontSize: 11, color: '#6E6E73', fontFamily: MONO }}>
                {status === 'Bad' ? '⚠ Requires immediate attention' :
                 status === 'Warning' ? '⚡ Monitor closely' : '✓ Operating normally'}
              </div>
              {reading && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#F2F2F7', borderRadius: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color }}>
                    Health: {status === 'Good' ? '100%' : status === 'Warning' ? '60%' : '25%'}
                  </span>
                  <div style={{ marginTop: 4, height: 4, background: '#E5E5EA', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: color,
                      width: status === 'Good' ? '100%' : status === 'Warning' ? '60%' : '25%',
                      transition: 'width 0.5s'
                    }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
