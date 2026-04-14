import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSensor, getMachine } from '../services/api'
import { LineChart } from '../components/Chart'

const MONO = "'JetBrains Mono', monospace"

export default function SensorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [machine, setMachine] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    getMachine(id).then(r => setMachine(r.data.data)).catch(() => {})
    getSensor(id).then(r => setHistory(r.data.data?.history || [])).catch(() => {})
  }, [id])

  const labels = history.map(r => new Date(r.timestamp).toLocaleTimeString())

  const mkDataset = (label, key, color) => ({
    label, data: history.map(r => r[key]),
    borderColor: color, backgroundColor: color + '18',
    borderWidth: 2, pointRadius: 2, tension: 0.4, fill: true,
  })

  return (
    <div style={{ paddingTop: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(`/machines/${id}`)} style={{
          background: '#E5E5EA', border: 'none', color: '#1C1C1E',
          padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 11
        }}>← BACK</button>
        <div className="page-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          ◎ Sensor History — {machine?.name}
        </div>
      </div>

      {history.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 40, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontFamily: MONO, color: '#6E6E73', fontSize: 13 }}>
            NO SENSOR DATA YET<br />
            <span style={{ fontSize: 11 }}>Visit the Realtime page to start collecting data for this machine</span>
          </div>
          <button onClick={() => navigate(`/realtime?machine=${id}`)} style={{
            marginTop: 14, background: '#34C759', border: 'none', color: '#FFFFFF',
            padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: MONO, fontSize: 12
          }}>◉ GO TO REALTIME</button>
        </div>
      ) : (
        <>
          {/* Latest Reading */}
          {history.length > 0 && (() => {
            const latest = history[history.length - 1]
            const statusColor = latest.status === 'Good' ? '#34C759' : latest.status === 'Warning' ? '#FF9500' : '#FF3B30'
            return (
              <div style={{
                background: '#FFFFFF', border: '1px solid #E5E5EA',
                borderLeft: `4px solid ${statusColor}`,
                borderRadius: 14, padding: 16, marginBottom: 16,
                display: 'flex', gap: 30, alignItems: 'center', flexWrap: 'wrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <div>
                  <div style={{ fontSize: 10, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2 }}>LATEST STATUS</div>
                  <span className={`badge badge-${latest.status.toLowerCase()}`} style={{ marginTop: 4, display: 'inline-block' }}>{latest.status}</span>
                </div>
                {[
                  ['TEMP', `${latest.temperature}°C`],
                  ['CURRENT', `${latest.current}A`],
                  ['RPM', latest.rpm],
                  ['VIBRATION', `${latest.vibration} mm/s`],
                  ['CONFIDENCE', `${(latest.confidence * 100).toFixed(0)}%`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2 }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO, color: statusColor }}>{v}</div>
                  </div>
                ))}
              </div>
            )
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'Temperature (°C)', key: 'temperature', color: '#FF3B30' },
              { title: 'Current (A)',       key: 'current',     color: '#007AFF' },
              { title: 'RPM',              key: 'rpm',         color: '#34C759' },
              { title: 'Vibration (mm/s)', key: 'vibration',   color: '#FF9500' },
            ].map(({ title, key, color }) => (
              <div key={key} style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 11, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 10 }}>{title.toUpperCase()}</div>
                <LineChart labels={labels} datasets={[mkDataset(title, key, color)]} height={160} />
              </div>
            ))}
          </div>

          {/* ML Result Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 16, marginTop: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 11, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 12 }}>
              ML CLASSIFICATION LOG
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E5EA' }}>
                    {['Time', 'Temp', 'Current', 'RPM', 'Vibration', 'Status', 'Confidence'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#6E6E73', fontFamily: MONO, fontSize: 10, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().slice(0, 15).map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F2F2F7' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F2F2F7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '6px 10px', fontFamily: MONO, color: '#6E6E73' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                      <td style={{ padding: '6px 10px', fontFamily: MONO, color: '#1C1C1E' }}>{r.temperature}°C</td>
                      <td style={{ padding: '6px 10px', fontFamily: MONO, color: '#1C1C1E' }}>{r.current}A</td>
                      <td style={{ padding: '6px 10px', fontFamily: MONO, color: '#1C1C1E' }}>{r.rpm}</td>
                      <td style={{ padding: '6px 10px', fontFamily: MONO, color: '#1C1C1E' }}>{r.vibration}</td>
                      <td style={{ padding: '6px 10px' }}><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                      <td style={{ padding: '6px 10px', fontFamily: MONO, color: '#6E6E73' }}>{(r.confidence * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
