import React from 'react'

const statusColor = s => s === 'Good' ? '#34C759' : s === 'Warning' ? '#FF9500' : s === 'Bad' ? '#FF3B30' : '#007AFF'

export default function Card({ title, value, unit, status, icon, sub, trend }) {
  const color = statusColor(status)

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E5EA',
      borderTop: `3px solid ${status ? color : '#007AFF'}`,
      borderRadius: 14,
      padding: '16px 18px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
          color: '#6E6E73', fontFamily: "'JetBrains Mono', monospace",
        }}>
          {title}
        </span>
        {icon && <span style={{ fontSize: 18, color: status ? color : '#007AFF' }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: 28, fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: status ? color : '#1C1C1E',
        }}>
          {value ?? '—'}
        </span>
        {unit && <span style={{ fontSize: 13, color: '#6E6E73', fontFamily: "'JetBrains Mono', monospace" }}>{unit}</span>}
        {trend && (
          <span style={{ fontSize: 14, color: trend === 'up' ? '#FF3B30' : '#34C759', marginLeft: 4 }}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      {sub && <div style={{ marginTop: 6, fontSize: 12, color: '#6E6E73' }}>{sub}</div>}
    </div>
  )
}
