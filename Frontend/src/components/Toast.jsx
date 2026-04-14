import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const typeConfig = {
  good:     { bg: '#FFFFFF', border: 'rgba(52,199,89,0.3)',   left: '#34C759', color: '#34C759', icon: '✓' },
  warning:  { bg: '#FFFFFF', border: 'rgba(255,149,0,0.3)',   left: '#FF9500', color: '#FF9500', icon: '⚡' },
  bad:      { bg: '#FFFFFF', border: 'rgba(255,59,48,0.3)',   left: '#FF3B30', color: '#FF3B30', icon: '✗' },
  info:     { bg: '#FFFFFF', border: 'rgba(0,122,255,0.3)',   left: '#007AFF', color: '#007AFF', icon: 'ℹ' },
  critical: { bg: '#FFFFFF', border: 'rgba(255,59,48,0.35)',  left: '#FF3B30', color: '#FF3B30', icon: '🚨' },
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed', top: 68, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360,
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const cfg = typeConfig[toast.type] || typeConfig.info
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      onClick={() => onRemove(toast.id)}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.left}`,
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <span style={{ fontSize: 16, color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#1C1C1E',
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}>
          {toast.message}
        </div>
      </div>
      <span style={{ color: '#6E6E73', fontSize: 14, flexShrink: 0, marginTop: 1 }}>×</span>
    </div>
  )
}
