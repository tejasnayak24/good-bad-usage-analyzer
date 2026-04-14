import React, { useState, useMemo } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { useToast } from '../components/Toast'
import { LineChart } from '../components/Chart'

const MAX_POINTS = 40
const MONO = "'JetBrains Mono', monospace"
const SC = s => s === 'Good' ? '#34C759' : s === 'Warning' ? '#FF9500' : s === 'Bad' ? '#FF3B30' : '#6E6E73'

export default function Realtime() {
  const { machines, readings, histories, running, setRunning } = useSimulation()
  const { addToast } = useToast()
  const [selectedId, setSelectedId] = useState(null)
  const [replayMode, setReplayMode] = useState(false)
  const [replayIdx, setReplayIdx] = useState(0)

  const effectiveId = selectedId ?? machines[0]?.id
  const reading     = readings[effectiveId]
  const history     = histories[effectiveId] || []

  const chartData = useMemo(() => {
    const src = replayMode ? history.slice(0, replayIdx + 1) : history.slice(-MAX_POINTS)
    const labels = src.map(r => new Date(r.timestamp).toLocaleTimeString())
    return {
      labels,
      temp:    src.map(r => r.temperature),
      current: src.map(r => r.current),
      rpm:     src.map(r => r.rpm),
      vib:     src.map(r => r.vibration),
    }
  }, [history, replayMode, replayIdx])

  const METRIC_COLORS = {
    'Temperature (°C)': '#FF3B30',
    'Current (A)':      '#007AFF',
    'RPM':              '#34C759',
    'Vibration (mm/s)': '#FF9500',
  }

  const mkDs = (label, data) => {
    const color = METRIC_COLORS[label] || '#007AFF'
    return {
      label, data, borderColor: color,
      backgroundColor: color + '18',
      borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true,
    }
  }

  const handleStart = () => { setRunning(true); addToast('Simulation started', 'good') }
  const handleStop  = () => { setRunning(false); addToast('Simulation paused', 'info') }

  const replayReading = replayMode ? history[replayIdx] : reading
  const status = replayReading?.status
  const color  = SC(status)

  return (
    <div style={{ paddingTop: 52 }}>
      <div className="page-title">◉ Realtime Monitor</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {machines.map(m => {
            const s = readings[m.id]?.status
            const c = SC(s)
            return (
              <button key={m.id} onClick={() => { setSelectedId(m.id); setReplayIdx(0) }} style={{
                padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                fontFamily: MONO, fontSize: 11, letterSpacing: 1,
                background: effectiveId === m.id ? '#007AFF' : '#FFFFFF',
                border: `1px solid ${effectiveId === m.id ? '#007AFF' : '#E5E5EA'}`,
                color: effectiveId === m.id ? '#FFFFFF' : '#6E6E73',
              }}>
                {m.name}
                {s && <span style={{ marginLeft: 6, color: effectiveId === m.id ? '#fff' : c, fontSize: 10 }}>●</span>}
              </button>
            )
          })}
        </div>

        <button onClick={running ? handleStop : handleStart} style={{
          padding: '6px 20px', borderRadius: 8, cursor: 'pointer',
          fontFamily: MONO, fontSize: 11, letterSpacing: 1,
          background: running ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.08)',
          border: `1px solid ${running ? '#FF3B30' : '#34C759'}`,
          color: running ? '#FF3B30' : '#34C759',
        }}>
          {running ? '■ STOP' : '▶ START'}
        </button>

        {running && (
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#34C759', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, background: '#34C759', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
            LIVE — 2s refresh
          </span>
        )}

        {history.length > 1 && (
          <button onClick={() => { setReplayMode(r => !r); setReplayIdx(0) }} style={{
            padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
            fontFamily: MONO, fontSize: 11, letterSpacing: 1, marginLeft: 'auto',
            background: replayMode ? 'rgba(255,149,0,0.10)' : '#FFFFFF',
            border: `1px solid ${replayMode ? '#FF9500' : '#E5E5EA'}`,
            color: replayMode ? '#FF9500' : '#6E6E73',
          }}>
            ⏪ {replayMode ? 'EXIT REPLAY' : 'REPLAY MODE'}
          </button>
        )}
      </div>

      {replayMode && history.length > 1 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 12, padding: '14px 18px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#FF9500', fontSize: 10, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>
            ⏪ REPLAY — {new Date(history[replayIdx]?.timestamp).toLocaleTimeString()} ({replayIdx + 1}/{history.length})
          </div>
          <input type="range" min={0} max={history.length - 1} value={replayIdx}
            onChange={e => setReplayIdx(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#FF9500' }} />
        </div>
      )}

      {replayReading ? (
        <>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E5EA',
            borderLeft: `4px solid ${color}`,
            borderRadius: 14,
            padding: '18px 22px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 10, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 4 }}>ML STATUS</div>
              <div style={{ fontSize: 36, fontWeight: 700, color, fontFamily: MONO }}>
                {status}
              </div>
              <div style={{ fontSize: 10, color: '#6E6E73', fontFamily: MONO, marginTop: 4 }}>
                {(replayReading.confidence * 100).toFixed(0)}% confidence · {replayReading.method}
              </div>
              {replayReading.reason && (
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 10,
                  background: '#F2F2F7', border: '1px solid #E5E5EA',
                  fontSize: 12, color: '#1C1C1E', lineHeight: 1.5,
                }}>
                  💡 {replayReading.reason}
                </div>
              )}
              {replayReading.prediction_warning && (
                <div style={{
                  marginTop: 6, padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.25)',
                  fontSize: 12, color: '#FF9500', lineHeight: 1.5,
                }}>
                  ⚡ {replayReading.prediction_warning}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'TEMP', value: replayReading.temperature, unit: '°C', warn: 60, bad: 80 },
                { label: 'CURRENT', value: replayReading.current, unit: 'A', warn: 7, bad: 10 },
                { label: 'RPM', value: replayReading.rpm, unit: 'rpm', warn: 1680, bad: 200, invert: true },
                { label: 'VIBRATION', value: replayReading.vibration, unit: 'mm/s', warn: 4, bad: 6 },
              ].map(({ label, value, unit, warn, bad, invert }) => {
                const s2 = invert
                  ? (value < bad ? 'Bad' : value < warn ? 'Warning' : 'Good')
                  : (value > bad ? 'Bad' : value > warn ? 'Warning' : 'Good')
                const c2 = SC(s2)
                return (
                  <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 9, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: MONO, color: c2 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 10, color: '#6E6E73', fontFamily: MONO }}>{unit}</div>
                  </div>
                )
              })}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 4 }}>SCENARIO</div>
                <span className={`badge badge-${replayReading.scenario === 'normal' ? 'good' : replayReading.scenario === 'bearing' ? 'warning' : 'bad'}`}>
                  {replayReading.scenario?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { title: 'Temperature (°C)', data: chartData.temp },
              { title: 'Current (A)',       data: chartData.current },
              { title: 'RPM',              data: chartData.rpm },
              { title: 'Vibration (mm/s)', data: chartData.vib },
            ].map(({ title, data }) => (
              <div key={title} style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 12, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 9, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>
                  {title.toUpperCase()}
                </div>
                <LineChart labels={chartData.labels} datasets={[mkDs(title, data)]} height={140} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontFamily: MONO, color: '#6E6E73', fontSize: 13, letterSpacing: 2 }}>
            {running ? 'FETCHING DATA...' : 'PRESS ▶ START TO BEGIN MONITORING'}
          </div>
        </div>
      )}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  )
}
