import React, { useEffect, useState } from 'react'
import { getAnalytics } from '../services/api'
import { DonutChart, BarChart } from '../components/Chart'
import Card from '../components/Card'

const MONO = "'JetBrains Mono', monospace"

export default function Analytics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getAnalytics().then(r => setData(r.data.data)).catch(() => {})
  }, [])

  if (!data) return <div style={{ paddingTop: 70, color: '#6E6E73', fontFamily: MONO }}>Loading...</div>

  const perMachine = data.per_machine || []

  return (
    <div style={{ paddingTop: 52 }}>
      <div className="page-title">◈ Analytics</div>

      {/* KPI Row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <Card title="Total Readings"  value={data.total_readings} icon="◎" />
        <Card title="Good %"    value={data.good_pct}    unit="%"  status="Good"    icon="✓" />
        <Card title="Warning %"  value={data.warning_pct}  unit="%"  status="Warning" icon="⚡" />
        <Card title="Bad %"     value={data.bad_pct}     unit="%"  status="Bad"     icon="✗" />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Donut */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 11, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 14 }}>
            STATUS DISTRIBUTION
          </div>
          {data.total_readings > 0 ? (
            <DonutChart
              labels={['Good', 'Warning', 'Bad']}
              data={[data.good_pct, data.warning_pct, data.bad_pct]}
              height={240}
            />
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6E73', fontFamily: MONO, fontSize: 12 }}>
              NO DATA — START REALTIME MONITORING
            </div>
          )}
        </div>

        {/* Per-machine bars */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 11, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 14 }}>
            GOOD % PER MACHINE
          </div>
          {perMachine.length > 0 ? (
            <BarChart
              labels={perMachine.map(m => m.machine_name)}
              datasets={[{
                label: 'Good %',
                data: perMachine.map(m => m.good_pct),
                backgroundColor: perMachine.map(m =>
                  m.good_pct > 70 ? 'rgba(52,199,89,0.55)' : m.good_pct > 40 ? 'rgba(255,149,0,0.55)' : 'rgba(255,59,48,0.55)'
                ),
                borderColor: perMachine.map(m =>
                  m.good_pct > 70 ? '#34C759' : m.good_pct > 40 ? '#FF9500' : '#FF3B30'
                ),
                borderWidth: 1,
              }]}
              height={240}
            />
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6E73', fontFamily: MONO, fontSize: 12 }}>
              NO DATA
            </div>
          )}
        </div>
      </div>

      {/* Avg Sensor Metrics */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <Card title="Avg Temperature" value={data.avg_temperature} unit="°C"
          status={data.avg_temperature > 80 ? 'Bad' : data.avg_temperature > 60 ? 'Warning' : 'Good'} />
        <Card title="Avg Current"     value={data.avg_current}     unit="A"
          status={data.avg_current > 10 ? 'Bad' : data.avg_current > 7 ? 'Warning' : 'Good'} />
        <Card title="Avg RPM"         value={data.avg_rpm}         unit="rpm" />
        <Card title="Avg Vibration"   value={data.avg_vibration}   unit="mm/s"
          status={data.avg_vibration > 6 ? 'Bad' : data.avg_vibration > 4 ? 'Warning' : 'Good'} />
      </div>

      {/* Per-machine table */}
      {perMachine.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 11, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 12 }}>
            PER MACHINE BREAKDOWN
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E5EA' }}>
                {['Machine', 'Readings', 'Last Status', 'Last Temp', 'Last RPM', 'Good %', 'Bad %'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6E6E73', fontSize: 10, fontFamily: MONO, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perMachine.map(m => (
                <tr key={m.machine_id} style={{ borderBottom: '1px solid #F2F2F7' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F2F2F7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1C1C1E' }}>{m.machine_name}</td>
                  <td style={{ padding: '10px 12px', fontFamily: MONO, color: '#6E6E73' }}>{m.readings}</td>
                  <td style={{ padding: '10px 12px' }}><span className={`badge badge-${m.last_status.toLowerCase()}`}>{m.last_status}</span></td>
                  <td style={{ padding: '10px 12px', fontFamily: MONO, color: '#1C1C1E' }}>{m.last_temp}°C</td>
                  <td style={{ padding: '10px 12px', fontFamily: MONO, color: '#1C1C1E' }}>{m.last_rpm}</td>
                  <td style={{ padding: '10px 12px', fontFamily: MONO, color: '#34C759', fontWeight: 600 }}>{m.good_pct}%</td>
                  <td style={{ padding: '10px 12px', fontFamily: MONO, color: '#FF3B30', fontWeight: 600 }}>{m.bad_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
