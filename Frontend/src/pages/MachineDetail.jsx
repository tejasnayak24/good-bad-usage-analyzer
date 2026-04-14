import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMachine, getMachineAlerts, getMachineAnalytics, simulateBadUsage } from '../services/api'
import Card from '../components/Card'

const MONO = "'JetBrains Mono', monospace"

export default function MachineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [machine, setMachine] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [badUsageActive, setBadUsageActive] = useState(false)

  useEffect(() => {
    getMachine(id).then(r => setMachine(r.data.data)).catch(() => { })
    getMachineAlerts(id).then(r => setAlerts(r.data.data || [])).catch(() => { })
    getMachineAnalytics(id).then(r => setAnalytics(r.data.data)).catch(() => { })
  }, [id])

  const handleSimulateBad = () => {
    simulateBadUsage(id)
      .then(() => {
        setBadUsageActive(true)
        setTimeout(() => setBadUsageActive(false), 62000)
      })
      .catch(() => { })
  }

  if (!machine) return <div style={{ paddingTop: 70, color: '#6E6E73', fontFamily: MONO }}>Loading...</div>

  const stats = analytics?.stats || {}

  return (
    <div style={{ paddingTop: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/machines')} style={{
          background: '#E5E5EA', border: 'none', color: '#1C1C1E',
          padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 11
        }}>← BACK</button>
        <div className="page-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          {machine.name}
        </div>
      </div>

      {/* Machine Info */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 18, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            ['Machine ID', `ID-${String(machine.id).padStart(3, '0')}`],
            ['Name', machine.name],
            ['Type', machine.type],
            ['Location', machine.location],
            ['Status', machine.status?.toUpperCase()],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {analytics?.readings?.length > 0 && (
        <div className="grid-4" style={{ marginBottom: 16 }}>
          <Card title="Avg Temperature" value={stats.avg_temp} unit="°C"
            status={stats.avg_temp > 80 ? 'Bad' : stats.avg_temp > 60 ? 'Warning' : 'Good'} />
          <Card title="Max Temperature" value={stats.max_temp} unit="°C"
            status={stats.max_temp > 80 ? 'Bad' : stats.max_temp > 60 ? 'Warning' : 'Good'} />
          <Card title="Avg Current" value={stats.avg_current} unit="A"
            status={stats.avg_current > 10 ? 'Bad' : stats.avg_current > 7 ? 'Warning' : 'Good'} />
          <Card title="Avg Vibration" value={stats.avg_vibration} unit="mm/s"
            status={stats.avg_vibration > 6 ? 'Bad' : stats.avg_vibration > 4 ? 'Warning' : 'Good'} />
        </div>
      )}

      {/* Status Counts */}
      {stats.status_counts && (
        <div className="grid-3" style={{ marginBottom: 16 }}>
          {Object.entries(stats.status_counts).map(([status, count]) => (
            <Card key={status} title={`${status} Readings`} value={count}
              status={status} icon={status === 'Good' ? '✓' : status === 'Warning' ? '⚡' : '✗'} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(`/realtime?machine=${id}`)} style={{
          background: '#34C759', border: 'none', color: '#FFFFFF',
          padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: MONO, fontSize: 12, letterSpacing: 1
        }}>◉ REALTIME MONITOR</button>
        <button onClick={() => navigate(`/machines/${id}/sensors`)} style={{
          background: '#007AFF', border: 'none', color: '#FFFFFF',
          padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: MONO, fontSize: 12, letterSpacing: 1
        }}>◎ SENSOR DETAIL</button>
        <button onClick={() => navigate(`/machines/${id}/components`)} style={{
          background: '#FF9500', border: 'none', color: '#FFFFFF',
          padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: MONO, fontSize: 12, letterSpacing: 1
        }}>⬡ COMPONENTS</button>
        <button onClick={handleSimulateBad} disabled={badUsageActive} style={{
          background: badUsageActive ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.08)',
          border: `1px solid #FF3B30`, color: '#FF3B30',
          padding: '8px 20px', borderRadius: 10, cursor: badUsageActive ? 'default' : 'pointer',
          fontFamily: MONO, fontSize: 12, letterSpacing: 1, opacity: badUsageActive ? 0.7 : 1,
        }}>
          {badUsageActive ? '⚠ OVERLOAD ACTIVE…' : '⚠ SIMULATE BAD USAGE'}
        </button>
      </div>

      {/* Recent Alerts */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ color: '#6E6E73', fontSize: 11, fontFamily: MONO, letterSpacing: 2, marginBottom: 12 }}>
          RECENT ALERTS ({alerts.length})
        </div>
        {alerts.length === 0 ? (
          <div style={{ color: '#6E6E73', fontFamily: MONO, fontSize: 12 }}>No alerts yet. Start realtime monitoring to generate data.</div>
        ) : alerts.slice(0, 8).map(a => (
          <div key={a.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid #F2F2F7', gap: 12
          }}>
            <span className={`badge badge-${a.severity === 'critical' ? 'bad' : 'warning'}`}>{a.severity}</span>
            <span style={{ flex: 1, fontSize: 13, color: '#1C1C1E' }}>{a.message}</span>
            <span style={{ fontSize: 11, color: '#6E6E73', fontFamily: MONO }}>
              {new Date(a.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
