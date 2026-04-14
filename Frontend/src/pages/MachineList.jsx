import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulation } from '../context/SimulationContext'
import { useToast } from '../components/Toast'
import { createMachine, deleteMachine, updateMachine } from '../services/api'

const MONO = "'JetBrains Mono', monospace"
const SC = s => s === 'Good' ? '#34C759' : s === 'Warning' ? '#FF9500' : s === 'Bad' ? '#FF3B30' : '#6E6E73'

const GROUPS = ['Motors', 'Pumps', 'Compressors', 'Sensors', 'General']

function Modal({ title, onClose, onSubmit, initial, existingMachines = [] }) {
  const [form, setForm] = useState(initial || { name: '', location: '', type: '', group: 'General' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const normalize = s => s.replace(/[^a-z0-9]/gi, '').toLowerCase()
  const isDuplicate = existingMachines.some(m => {
    if (initial && m.id === initial.id) return false
    return (
      normalize(m.name)     === normalize(form.name) &&
      normalize(m.location) === normalize(form.location)
    )
  })
  const nameAndLocFilled = form.name.trim() !== '' && form.location.trim() !== ''
  const showDupError = isDuplicate && nameAndLocFilled

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 16,
        padding: 28, minWidth: 400, maxWidth: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E', marginBottom: 20, fontFamily: MONO }}>{title}</div>

        {[
          { label: 'MACHINE NAME', key: 'name', placeholder: 'e.g. Motor E' },
          { label: 'LOCATION', key: 'location', placeholder: 'e.g. Plant Floor 3' },
          { label: 'TYPE', key: 'type', placeholder: 'e.g. Induction Motor' },
        ].map(({ label, key, placeholder }) => {
          const isDupField = showDupError && (key === 'name' || key === 'location')
          return (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 5,
                color: isDupField ? '#FF3B30' : '#6E6E73',
                transition: 'color 0.2s',
              }}>{label}</div>
              <input
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                style={{
                  width: '100%', background: '#F2F2F7',
                  border: isDupField ? '1px solid #FF3B30' : '1px solid #E5E5EA',
                  borderRadius: 10, padding: '8px 12px', color: '#1C1C1E',
                  fontFamily: MONO, fontSize: 12, outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { if (!isDupField) e.target.style.borderColor = '#007AFF' }}
                onBlur={e => { if (!isDupField) e.target.style.borderColor = '#E5E5EA' }}
              />
              {isDupField && key === 'name' && (
                <div style={{
                  marginTop: 5, fontSize: 10, color: '#FF3B30', fontFamily: MONO,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span>⚠</span> Device already exists on this floor
                </div>
              )}
            </div>
          )
        })}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2, marginBottom: 5 }}>GROUP</div>
          <select value={form.group} onChange={set('group')} style={{
            width: '100%', background: '#F2F2F7', border: '1px solid #E5E5EA',
            borderRadius: 10, padding: '8px 12px', color: '#1C1C1E',
            fontFamily: MONO, fontSize: 12, outline: 'none',
          }}>
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: MONO, fontSize: 11,
            background: '#E5E5EA', border: 'none', color: '#1C1C1E',
          }}>CANCEL</button>
          <button
            onClick={() => !showDupError && onSubmit(form)}
            disabled={showDupError}
            style={{
              padding: '8px 18px', borderRadius: 10, fontFamily: MONO, fontSize: 11,
              cursor: showDupError ? 'not-allowed' : 'pointer',
              background: showDupError ? 'rgba(255,59,48,0.08)' : '#007AFF',
              border: `1px solid ${showDupError ? '#FF3B30' : '#007AFF'}`,
              color: showDupError ? '#FF3B30' : '#FFFFFF',
              opacity: showDupError ? 0.7 : 1,
              transition: 'all 0.2s',
            }}>
            {showDupError ? '⚠ DUPLICATE' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MachineList() {
  const { machines, readings, refreshMachines } = useSimulation()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [showAdd, setShowAdd]   = useState(false)
  const [editMachine, setEditMachine] = useState(null)
  const [filterGroup, setFilterGroup] = useState('all')

  const handleAdd = async (form) => {
    try {
      await createMachine(form)
      await refreshMachines()
      addToast(`Machine "${form.name}" added successfully`, 'good')
      setShowAdd(false)
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (err?.response?.status === 400 && detail) {
        addToast(detail, 'bad')
      } else {
        addToast('Failed to add machine', 'bad')
      }
    }
  }

  const handleEdit = async (form) => {
    try {
      await updateMachine(editMachine.id, form)
      await refreshMachines()
      addToast(`Machine "${form.name}" updated`, 'info')
      setEditMachine(null)
    } catch {
      addToast('Failed to update machine', 'bad')
    }
  }

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete ${m.name}?`)) return
    try {
      await deleteMachine(m.id)
      await refreshMachines()
      addToast(`Machine "${m.name}" deleted`, 'warning')
    } catch {
      addToast('Failed to delete machine', 'bad')
    }
  }

  const groups = [...new Set(machines.map(m => m.group || 'General'))]
  const filteredMachines = filterGroup === 'all' ? machines : machines.filter(m => (m.group || 'General') === filterGroup)

  return (
    <div style={{ paddingTop: 52 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>⚙ Machine Registry</div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: MONO, fontSize: 11,
          background: '#007AFF', border: 'none', color: '#FFFFFF', letterSpacing: 1,
        }}>
          + ADD DEVICE
        </button>
      </div>

      {/* Group filter */}
      <div style={{ display: 'flex', gap: 8, margin: '16px 0', flexWrap: 'wrap' }}>
        <button onClick={() => setFilterGroup('all')} style={{
          padding: '5px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 10, letterSpacing: 1,
          background: filterGroup === 'all' ? '#007AFF' : '#FFFFFF',
          border: `1px solid ${filterGroup === 'all' ? '#007AFF' : '#E5E5EA'}`,
          color: filterGroup === 'all' ? '#FFFFFF' : '#6E6E73',
        }}>ALL</button>
        {groups.map(g => (
          <button key={g} onClick={() => setFilterGroup(g)} style={{
            padding: '5px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 10, letterSpacing: 1,
            background: filterGroup === g ? '#007AFF' : '#FFFFFF',
            border: `1px solid ${filterGroup === g ? '#007AFF' : '#E5E5EA'}`,
            color: filterGroup === g ? '#FFFFFF' : '#6E6E73',
          }}>{g.toUpperCase()}</button>
        ))}
      </div>

      {groups.filter(g => filterGroup === 'all' || g === filterGroup).map(group => {
        const groupMachines = filteredMachines.filter(m => (m.group || 'General') === group)
        if (!groupMachines.length) return null
        return (
          <div key={group} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 10, color: '#6E6E73', fontFamily: MONO, letterSpacing: 2,
              textTransform: 'uppercase', marginBottom: 12, paddingBottom: 6,
              borderBottom: '1px solid #E5E5EA',
            }}>
              — {group} ({groupMachines.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
              {groupMachines.map(m => {
                const r = readings[m.id]
                const status = r?.status
                const color  = SC(status)
                return (
                  <div key={m.id} style={{
                    background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14,
                    padding: 20, cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    borderTop: `3px solid ${status ? color : '#E5E5EA'}`,
                  }}
                    onClick={() => navigate(`/machines/${m.id}`)}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                      e.currentTarget.style.transform = 'none'
                    }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: '#6E6E73', letterSpacing: 2 }}>
                        ID-{String(m.id).padStart(3, '0')}
                      </span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {status && <span className={`badge badge-${status.toLowerCase()}`} style={{ fontSize: 9, padding: '1px 6px' }}>{status}</span>}
                        <span style={{ fontSize: 18 }}>⚙</span>
                      </div>
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#1C1C1E' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: '#6E6E73', marginBottom: 2 }}>📍 {m.location}</div>
                    <div style={{ fontSize: 12, color: '#6E6E73', marginBottom: 14 }}>🔧 {m.type}</div>

                    {r && (
                      <div style={{
                        background: '#F2F2F7', borderRadius: 10, padding: '8px 10px',
                        marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
                      }}>
                        {[
                          { label: 'TEMP', value: `${r.temperature}°C` },
                          { label: 'RPM', value: r.rpm },
                          { label: 'CURRENT', value: `${r.current}A` },
                          { label: 'VIB', value: `${r.vibration}mm/s` },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ fontSize: 10, color: '#6E6E73', fontFamily: MONO }}>
                            <span style={{ color: '#007AFF' }}>{label}: </span>{value}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={e => { e.stopPropagation(); navigate(`/machines/${m.id}`) }} style={{
                        flex: 1, background: '#007AFF', border: 'none',
                        color: '#FFFFFF', padding: '6px 0', borderRadius: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 10,
                      }}>DETAIL</button>
                      <button onClick={e => { e.stopPropagation(); setEditMachine(m) }} style={{
                        background: '#E5E5EA', border: 'none',
                        color: '#1C1C1E', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 10,
                      }}>✎</button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(m) }} style={{
                        background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)',
                        color: '#FF3B30', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 10,
                      }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {showAdd && <Modal title="+ ADD DEVICE" onClose={() => setShowAdd(false)} onSubmit={handleAdd} existingMachines={machines} />}
      {editMachine && <Modal title="✎ EDIT DEVICE" onClose={() => setEditMachine(null)} onSubmit={handleEdit} initial={editMachine} existingMachines={machines} />}
    </div>
  )
}
