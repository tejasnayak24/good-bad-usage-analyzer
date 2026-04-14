import React from 'react'
import { NavLink } from 'react-router-dom'
import { useSimulation } from '../context/SimulationContext'

const links = [
  { to: '/', icon: '⬡', label: 'Dashboard' },
  { to: '/machines', icon: '⚙', label: 'Machines' },
  { to: '/realtime', icon: '◉', label: 'Realtime' },
  { to: '/alerts', icon: '⚠', label: 'Alerts' },
  { to: '/analytics', icon: '◈', label: 'Analytics' },
]

export default function Sidebar() {
  const { running, backendAlerts } = useSimulation()
  const alertCount = backendAlerts.filter(a => !a.resolved && a.status !== 'ack').length

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
      background: '#FFFFFF', borderRight: '1px solid #E5E5EA',
      display: 'flex', flexDirection: 'column', zIndex: 200,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #E5E5EA' }}>
        <div style={{
          color: '#007AFF', fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16, fontWeight: 700, letterSpacing: 1,
        }}>
          NEXUS
        </div>
        <div style={{ color: '#6E6E73', fontSize: 10, marginTop: 2, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>
          MONITOR · SYSTEM
        </div>
        {running && (
          <div style={{
            marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#34C759'
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34C759', animation: 'pulse 1.2s infinite' }} />
            SIMULATION LIVE
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0' }}>
        {links.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 18px', textDecoration: 'none',
              fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13,
              letterSpacing: 0.5, textTransform: 'uppercase',
              color: isActive ? '#007AFF' : '#6E6E73',
              background: isActive ? 'rgba(0,122,255,0.07)' : 'transparent',
              borderLeft: isActive ? '2px solid #007AFF' : '2px solid transparent',
              transition: 'all 0.15s', position: 'relative',
            })}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            {label}
            {label === 'Alerts' && alertCount > 0 && (
              <span style={{
                marginLeft: 'auto', background: '#FF3B30', color: '#fff',
                borderRadius: '50%', width: 18, height: 18, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              }}>
                {Math.min(alertCount, 9)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{
        padding: '14px 18px', borderTop: '1px solid #E5E5EA',
        color: '#6E6E73', fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
      }}>
        © 2026 NEXUS MONITOR
      </div>
    </aside>
  )
}
