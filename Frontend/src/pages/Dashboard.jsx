import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import { DonutChart } from '../components/Chart'
import { useSimulation } from '../context/SimulationContext'
import { getAnalytics, getAlerts } from '../services/api'

const SC = s => s === 'Good' ? '#34C759' : s === 'Warning' ? '#FF9500' : s === 'Bad' ? '#FF3B30' : '#007AFF'
const MONO = "'JetBrains Mono', monospace"

function HealthScore({ score, total, good }) {
  const color = score >= 75 ? '#34C759' : score >= 45 ? '#FF9500' : '#FF3B30'
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 16,
      padding: '28px 32px', marginBottom: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
    }}>
      <div style={{ textAlign: 'center', minWidth: 140 }}>
        <div style={{ color: '#6E6E73', fontSize: 10, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>
          SYSTEM HEALTH SCORE
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, fontFamily: MONO, color, lineHeight: 1 }}>
          {score}<span style={{ fontSize: 28, color: '#6E6E73' }}>%</span>
        </div>
        <div style={{ marginTop: 10, height: 6, background: '#E5E5EA', borderRadius: 3, overflow: 'hidden', width: 140 }}>
          <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'GOOD MACHINES', value: good, color: '#34C759', icon: '✓' },
          { label: 'TOTAL MACHINES', value: total, color: '#007AFF', icon: '⚙' },
          { label: 'SCORE STATUS', value: score >= 75 ? 'HEALTHY' : score >= 45 ? 'DEGRADED' : 'CRITICAL', color, icon: score >= 75 ? '●' : score >= 45 ? '◉' : '✗' },
        ].map(({ label, value, color: c, icon }) => (
          <div key={label} style={{
            background: '#F2F2F7', border: '1px solid #E5E5EA', borderRadius: 12,
            padding: '14px 20px', minWidth: 140, flex: 1,
          }}>
            <div style={{ color: '#6E6E73', fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: MONO, color: c }}>{value}</div>
            <div style={{ fontSize: 18, color: c, marginTop: 4 }}>{icon}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationItem({ text, type }) {
  const color = SC(type)
  const icons = { Good: '✓', Warning: '⚡', Bad: '⚠' }
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '10px 14px', borderRadius: 10, marginBottom: 8,
      background: '#FFFFFF', border: '1px solid #E5E5EA',
      borderLeft: `3px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      animation: 'fadeIn 0.4s ease-out forwards',
    }}>
      <span style={{ color, fontSize: 14, marginTop: 2, flexShrink: 0 }}>{icons[type] || '•'}</span>
      <span style={{ fontSize: 13, color: '#1C1C1E', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

export default function Dashboard() {
  const { machines, readings } = useSimulation()
  const [analytics, setAnalytics] = useState(null)
  const [alerts, setAlerts]       = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getAnalytics().then(r => setAnalytics(r.data.data)).catch(() => {})
    getAlerts().then(r => setAlerts(r.data.data || [])).catch(() => {})
    const t = setInterval(() => {
      getAnalytics().then(r => setAnalytics(r.data.data)).catch(() => {})
      getAlerts().then(r => setAlerts(r.data.data || [])).catch(() => {})
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const machineStatuses = machines.map(m => readings[m.id]?.status)
  const goodCount  = machineStatuses.filter(s => s === 'Good').length
  const totalCount = machines.length
  const healthScore = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged)
  const recentAlerts   = alerts.slice(0, 30)

  const recommendations = []
  machineStatuses.forEach((status, i) => {
    const m = machines[i]
    const r = readings[m?.id]
    if (!m || !r) return
    if (status === 'Bad') {
      recommendations.push({ text: `${m.name}: ${r.reason || 'Critical failure detected — inspect immediately'}`, type: 'Bad' })
      if (r.prediction_warning) recommendations.push({ text: `${m.name}: ${r.prediction_warning}`, type: 'Bad' })
    } else if (status === 'Warning') {
      recommendations.push({ text: `${m.name}: ${r.reason || 'Warning threshold exceeded — schedule maintenance'}`, type: 'Warning' })
    }
  })
  if (healthScore === 100) {
    recommendations.push({ text: 'All machines operating within normal parameters. Continue routine monitoring.', type: 'Good' })
  }
  if (criticalAlerts.length > 5) {
    recommendations.push({ text: `${criticalAlerts.length} unacknowledged critical alerts pending — review immediately`, type: 'Bad' })
  }

  return (
    <div style={{ paddingTop: 52 }}>
      <div className="page-title">⬡ System Dashboard</div>

      <HealthScore score={healthScore} total={totalCount} good={goodCount} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-4">
            <Card title="Total Machines"  value={machines.length} icon="⚙" />
            <Card title="Total Readings"  value={analytics?.total_readings ?? 0} icon="◎" />
            <Card title="Critical Alerts" value={criticalAlerts.length} icon="⚠"
              status={criticalAlerts.length > 0 ? 'Bad' : 'Good'} />
            <Card title="Good Usage %"    value={analytics?.good_pct ?? 0} unit="%"
              status={analytics?.good_pct > 70 ? 'Good' : analytics?.good_pct > 40 ? 'Warning' : 'Bad'} />
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="panel-label">ML CLASSIFICATION BREAKDOWN</div>
            {analytics?.total_readings > 0 ? (
              <DonutChart
                labels={['Good', 'Warning', 'Bad']}
                data={[analytics.good_pct, analytics.warning_pct, analytics.bad_pct]}
                height={200}
              />
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6E73', fontFamily: MONO, fontSize: 12 }}>
                START SIMULATION TO COLLECT DATA
              </div>
            )}
          </div>

          <div className="grid-4">
            <Card title="Avg Temperature" value={analytics?.avg_temperature ?? '—'} unit="°C"
              status={analytics?.avg_temperature > 80 ? 'Bad' : analytics?.avg_temperature > 60 ? 'Warning' : 'Good'}
              trend={analytics?.avg_temperature > 70 ? 'up' : null} />
            <Card title="Avg Current"   value={analytics?.avg_current ?? '—'} unit="A"
              status={analytics?.avg_current > 10 ? 'Bad' : analytics?.avg_current > 7 ? 'Warning' : 'Good'} />
            <Card title="Avg RPM"       value={analytics?.avg_rpm ?? '—'} unit="rpm" />
            <Card title="Avg Vibration" value={analytics?.avg_vibration ?? '—'} unit="mm/s"
              status={analytics?.avg_vibration > 6 ? 'Bad' : analytics?.avg_vibration > 4 ? 'Warning' : 'Good'} />
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="panel-label">MACHINE STATUS OVERVIEW</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E5EA' }}>
                  {['Machine', 'Group', 'Location', 'Live Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6E6E73', fontSize: 10, fontFamily: MONO, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {machines.map(m => {
                  const r = readings[m.id]
                  const status = r?.status
                  const color = SC(status)
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F2F2F7' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F2F2F7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13, color: '#1C1C1E' }}>{m.name}</td>
                      <td style={{ padding: '10px 12px', color: '#6E6E73', fontSize: 12 }}>{m.group || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#6E6E73', fontSize: 12 }}>{m.location}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {status ? (
                          <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
                        ) : (
                          <span style={{ color: '#6E6E73', fontSize: 11, fontFamily: MONO }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => navigate(`/machines/${m.id}`)} style={{
                          background: '#007AFF', border: 'none',
                          color: '#FFFFFF', padding: '4px 14px', borderRadius: 8, cursor: 'pointer',
                          fontFamily: MONO, fontSize: 10, letterSpacing: 1
                        }}>VIEW →</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Real-time Alerts Panel */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14,
          padding: 18, display: 'flex', flexDirection: 'column', maxHeight: 800,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div className="panel-label" style={{ marginBottom: 12 }}>
            ⚠ LIVE ALERTS
            {criticalAlerts.length > 0 && (
              <span style={{
                marginLeft: 8, background: '#FF3B30', color: '#fff',
                borderRadius: 10, padding: '1px 7px', fontSize: 10,
                fontFamily: MONO,
              }}>{criticalAlerts.length}</span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentAlerts.length === 0 ? (
              <div style={{ color: '#6E6E73', fontSize: 12, fontFamily: MONO, textAlign: 'center', marginTop: 40 }}>
                NO ALERTS YET
              </div>
            ) : recentAlerts.map(a => {
              const isCrit = a.severity === 'critical'
              const c = isCrit ? '#FF3B30' : '#FF9500'
              return (
                <div key={a.id} className="alert-enter" style={{
                  background: '#FFFFFF', border: '1px solid #E5E5EA',
                  borderLeft: `3px solid ${c}`, borderRadius: 10, padding: '8px 10px',
                  opacity: a.acknowledged ? 0.45 : 1,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: '#6E6E73', fontSize: 10, fontFamily: MONO }}>{a.machine_name}</span>
                    <span className={`badge badge-${isCrit ? 'bad' : 'warning'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                      {a.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#1C1C1E', lineHeight: 1.4 }}>{a.message}</div>
                  <div style={{ fontSize: 10, color: '#6E6E73', marginTop: 3, fontFamily: MONO }}>
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => navigate('/alerts')} style={{
            marginTop: 12, padding: '8px', borderRadius: 10, cursor: 'pointer',
            fontFamily: MONO, fontSize: 11, letterSpacing: 1,
            background: '#007AFF', border: 'none', color: '#FFFFFF',
          }}>
            VIEW ALL ALERTS →
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div className="panel-label">◈ AI RECOMMENDATIONS</div>
        {recommendations.length === 0 ? (
          <div style={{ color: '#6E6E73', fontSize: 12, fontFamily: MONO }}>
            Start simulation to generate recommendations.
          </div>
        ) : (
          <div style={{ columns: 2, gap: 12 }}>
            {recommendations.map((r, i) => (
              <div key={i} style={{ breakInside: 'avoid', marginBottom: 8 }}>
                <RecommendationItem {...r} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
