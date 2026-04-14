import React, { useEffect, useState, useCallback, useRef } from 'react'
import { getAlerts, getAlertStats, ackAlert } from '../services/api'
import { useToast } from '../components/Toast'

const MONO = "'JetBrains Mono', monospace"

const ICONS = {
  high_temperature: '🌡',
  high_vibration:   '📳',
  ml_bad:           '🤖',
  default:          '⚠',
}

const isAcked    = (a) => a.status === 'ack' || a.acknowledged === true
const isResolved = (a) => a.resolved === true
const isActive   = (a) => !isResolved(a) && !isAcked(a)

const getState = (a) => {
  if (isAcked(a))    return 'ack'
  if (isResolved(a)) return 'resolved'
  return 'active'
}

const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  : null

function TimestampRow({ label, iso, color }) {
  if (!iso) return null
  return (
    <div style={{ fontSize: 9, fontFamily: MONO, color: color || '#6E6E73', marginTop: 2, display: 'flex', gap: 4 }}>
      <span style={{ opacity: 0.55 }}>{label}</span>
      <span>{fmtTime(iso)}</span>
    </div>
  )
}

const ROW_STYLE = {
  active: (isCrit) => ({
    opacity: 1,
    background:  '#FFFFFF',
    borderLeft:  `3px solid ${isCrit ? '#FF3B30' : '#FF9500'}`,
  }),
  resolved: () => ({
    opacity:    0.85,
    background: '#FFFFFF',
    borderLeft: '3px solid #34C759',
  }),
  ack: () => ({
    opacity:    0.35,
    background: '#FFFFFF',
    borderLeft: '3px solid #E5E5EA',
  }),
}

function StateBadge({ state, sevColor }) {
  if (state === 'ack') return null
  const cfg = state === 'resolved'
    ? { color: '#34C759', bg: 'rgba(52,199,89,0.10)', border: 'rgba(52,199,89,0.25)', label: '● RECOVERED' }
    : { color: sevColor,  bg: `${sevColor}15`,        border: `${sevColor}35`,        label: '● ACTIVE' }
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, letterSpacing: 1,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      padding: '2px 8px', borderRadius: 6,
      animation: state === 'active' ? 'blink 2s ease-in-out infinite' : 'none',
    }}>{cfg.label}</span>
  )
}

function AckControl({ state, alertId, isInFlight, onAck }) {
  if (state === 'ack') {
    return (
      <span style={{
        fontFamily: MONO, fontSize: 10, color: '#34C759',
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 8,
        background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)',
      }}>✓ ACKED</span>
    )
  }
  return (
    <button
      onClick={() => onAck(alertId)}
      disabled={isInFlight}
      style={{
        background:  isInFlight ? 'rgba(52,199,89,0.08)' : '#E5E5EA',
        border:      `1px solid ${isInFlight ? '#34C759' : '#E5E5EA'}`,
        color:       isInFlight ? '#34C759' : '#1C1C1E',
        padding:     '4px 12px', borderRadius: 8,
        cursor:      isInFlight ? 'wait' : 'pointer',
        fontFamily:  MONO, fontSize: 10, whiteSpace: 'nowrap',
        transition:  'all 0.15s',
      }}
      onMouseEnter={e => {
        if (isInFlight) return
        e.currentTarget.style.background = 'rgba(52,199,89,0.08)'
        e.currentTarget.style.borderColor = '#34C759'
        e.currentTarget.style.color       = '#34C759'
      }}
      onMouseLeave={e => {
        if (isInFlight) return
        e.currentTarget.style.background  = '#E5E5EA'
        e.currentTarget.style.borderColor = '#E5E5EA'
        e.currentTarget.style.color       = '#1C1C1E'
      }}
    >{isInFlight ? '…' : '✓ ACK'}</button>
  )
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [stats,  setStats]  = useState({ critical: 0, warning: 0, unack: 0, resolved_unack: 0 })
  const [filter, setFilter] = useState('active')
  const [acking, setAcking] = useState(new Set())
  const ackingRef = useRef(new Set())
  const { addToast } = useToast()

  const addAcking = useCallback((id) => {
    ackingRef.current = new Set([...ackingRef.current, id])
    setAcking(new Set(ackingRef.current))
  }, [])

  const removeAcking = useCallback((id) => {
    const s = new Set(ackingRef.current)
    s.delete(id)
    ackingRef.current = s
    setAcking(s)
  }, [])

  const loadAlerts = useCallback(() =>
    getAlerts().then(r => {
      const fresh = r.data.data || []
      setAlerts(prev => {
        if (ackingRef.current.size === 0) return fresh
        return fresh.map(freshAlert => {
          if (ackingRef.current.has(freshAlert.id)) {
            const local = prev.find(p => p.id === freshAlert.id)
            return local ?? freshAlert
          }
          return freshAlert
        })
      })
    }).catch(() => {}),
  [])

  const loadStats = useCallback(() =>
    getAlertStats().then(r => setStats(r.data.data || {})).catch(() => {}), [])

  const load = useCallback(() => { loadAlerts(); loadStats() }, [loadAlerts, loadStats])

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  const handleAck = async (id) => {
    if (ackingRef.current.has(id)) return
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'ack', acknowledged: true } : a
    ))
    addAcking(id)
    try {
      const res = await ackAlert(id)
      const updated = res.data?.data
      if (updated) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
      }
      loadStats()
      addToast('Alert acknowledged', 'good')
    } catch (err) {
      setAlerts(prev => prev.map(a =>
        a.id === id ? { ...a, status: 'active', acknowledged: false } : a
      ))
      addToast('Failed to acknowledge alert', 'bad')
    } finally {
      removeAcking(id)
    }
  }

  const FILTERS = {
    active:   (a) => isActive(a),
    resolved: (a) => isResolved(a) && !isAcked(a),
    ack:      (a) => isAcked(a),
    critical: (a) => a.severity === 'critical' && isActive(a),
    warning:  (a) => a.severity === 'warning'  && isActive(a),
    all:      ()  => true,
  }
  const filtered = alerts.filter(FILTERS[filter] ?? FILTERS.all)

  const tabs = [
    { key: 'active',   label: 'ACTIVE',    badge: alerts.filter(isActive).length,                          color: '#FF3B30' },
    { key: 'resolved', label: 'RECOVERED', badge: alerts.filter(a => isResolved(a) && !isAcked(a)).length, color: '#34C759' },
    { key: 'ack',      label: 'ACKED',     badge: alerts.filter(isAcked).length,                           color: '#6E6E73' },
    { key: 'critical', label: 'CRITICAL',  badge: stats.critical,                                          color: '#FF3B30' },
    { key: 'warning',  label: 'WARNING',   badge: stats.warning,                                           color: '#FF9500' },
    { key: 'all',      label: 'ALL',       badge: alerts.length,                                           color: '#007AFF' },
  ]

  return (
    <div style={{ paddingTop: 52 }}>
      <div className="page-title">⚠ Alert Center</div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          {
            label: 'CRITICAL ACTIVE', count: stats.critical,
            color: '#FF3B30', icon: '✗',
            sub: 'unresolved faults requiring action',
          },
          {
            label: 'WARNING ACTIVE', count: stats.warning,
            color: '#FF9500', icon: '⚡',
            sub: 'unresolved warnings requiring action',
          },
          {
            label: 'NEEDS ATTENTION', count: stats.unack ?? 0,
            color: '#007AFF', icon: '◉',
            sub: `${stats.resolved_unack ?? 0} recovered but unacknowledged`,
          },
        ].map(({ label, count, color, icon, sub }) => (
          <div key={label} style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5EA', borderTop: `3px solid ${color}`,
            borderRadius: 14, padding: 18,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'box-shadow 0.4s',
          }}>
            <div style={{ fontSize: 9, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
              <div style={{ fontSize: 36, fontWeight: 700, fontFamily: MONO, color }}>{count}</div>
              <span style={{ fontSize: 20, color }}>{icon}</span>
            </div>
            <div style={{ fontSize: 9, color: '#6E6E73', fontFamily: MONO, marginTop: 4, letterSpacing: 1 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {tabs.map(({ key, label, badge, color }) => {
          const isSelected = filter === key
          return (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              fontFamily: MONO, fontSize: 10, letterSpacing: 1,
              display: 'flex', alignItems: 'center', gap: 6,
              background: isSelected ? '#007AFF' : '#FFFFFF',
              border: `1px solid ${isSelected ? '#007AFF' : '#E5E5EA'}`,
              color: isSelected ? '#FFFFFF' : '#6E6E73',
              transition: 'all 0.15s',
            }}>
              {label}
              {badge > 0 && (
                <span style={{
                  background: isSelected ? 'rgba(255,255,255,0.25)' : `${color}15`,
                  border: `1px solid ${isSelected ? 'rgba(255,255,255,0.4)' : `${color}35`}`,
                  color: isSelected ? '#fff' : color,
                  borderRadius: 10, padding: '0 5px',
                  fontSize: 9, fontFamily: MONO, minWidth: 16, textAlign: 'center',
                }}>{badge}</span>
              )}
            </button>
          )
        })}

        <button onClick={load} title="Refresh" style={{
          marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
          fontFamily: MONO, fontSize: 10, background: '#FFFFFF',
          border: '1px solid #E5E5EA', color: '#6E6E73',
        }}>↻ REFRESH</button>
      </div>

      {/* Alert rows */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: 48, textAlign: 'center',
            fontFamily: MONO, color: '#6E6E73', fontSize: 12, letterSpacing: 2,
          }}>
            NO ALERTS FOUND
          </div>
        ) : filtered.map((a, i) => {
          const state      = getState(a)
          const isCrit     = a.severity === 'critical'
          const sevColor   = isCrit ? '#FF3B30' : '#FF9500'
          const icon       = ICONS[a.type] || ICONS.default
          const isInFlight = acking.has(a.id)

          return (
            <div key={a.id} className="alert-enter" style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 18px', borderBottom: '1px solid #F2F2F7',
              animationDelay: `${i * 0.04}s`,
              transition: 'opacity 0.4s, background 0.4s',
              ...ROW_STYLE[state]?.(isCrit),
            }}>

              <span style={{ fontSize: 20, marginTop: 2, flexShrink: 0, opacity: state === 'ack' ? 0.5 : 1 }}>
                {icon}
              </span>

              <span
                className={`badge badge-${isCrit ? 'bad' : 'warning'}`}
                style={{ flexShrink: 0, marginTop: 3, opacity: state === 'ack' ? 0.5 : 1 }}
              >
                {a.severity}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#1C1C1E', marginBottom: 3, lineHeight: 1.4 }}>
                  {a.message}
                </div>
                <div style={{ fontSize: 10, color: '#6E6E73', fontFamily: MONO, marginBottom: 3 }}>
                  {a.machine_name}
                </div>
                {a.reason && (
                  <p style={{ color: '#6E6E73', fontSize: 12, margin: '4px 0 0' }}>{a.reason}</p>
                )}
                {a.recommendation && (
                  <p style={{ color: '#007AFF', fontSize: 12, margin: '4px 0 0' }}>AI Recommendation: {a.recommendation}</p>
                )}
                <TimestampRow label="🕐 Created:"    iso={a.created_at || a.timestamp} color="#6E6E73" />
                <TimestampRow label="✅ Recovered:"  iso={a.resolved_at}               color="#34C759" />
                <TimestampRow label="✓  Acked:"      iso={a.acknowledged_at}           color="#007AFF" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <StateBadge state={state} sevColor={sevColor} />
                <AckControl
                  state={state}
                  alertId={a.id}
                  isInFlight={isInFlight}
                  onAck={handleAck}
                />
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}
