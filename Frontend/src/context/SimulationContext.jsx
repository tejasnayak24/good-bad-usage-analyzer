import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { getMachines, getRealtime, getAlerts } from '../services/api'

const SimulationContext = createContext(null)

const MAX_HISTORY = 60

export function SimulationProvider({ children }) {
  const [machines, setMachines] = useState([])
  const [readings, setReadings] = useState({})
  const [histories, setHistories] = useState({})
  const [running, setRunning] = useState(false)
  const [backendAlerts, setBackendAlerts] = useState([])
  const [alerts, setAlerts] = useState([])
  const intervalRef = useRef(null)
  const machinesRef = useRef([])

  useEffect(() => {
    getMachines()
      .then(r => {
        const ms = r.data.data
        setMachines(ms)
        machinesRef.current = ms
        const h = {}
        ms.forEach(m => { h[m.id] = [] })
        setHistories(h)
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    const load = () =>
      getAlerts().then(r => setBackendAlerts(r.data.data || [])).catch(() => { })
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  const fetchAll = useCallback(() => {
    const ms = machinesRef.current
    if (!ms.length) return
    ms.forEach(m => {
      getRealtime(m.id)
        .then(r => {
          const reading = r.data.data
          setReadings(prev => ({ ...prev, [m.id]: reading }))
          setHistories(prev => {
            const old = prev[m.id] || []
            return {
              ...prev,
              [m.id]: [...old, reading].slice(-MAX_HISTORY),
            }
          })
          if (reading.status === 'Bad' || reading.status === 'Warning') {
            setAlerts(prev => {
              const lastForMachine = prev.find(a => a.machineId === m.id)
              if (lastForMachine && lastForMachine.status === reading.status) return prev
              const alert = {
                id: Date.now() + m.id,
                machineId: m.id,
                machineName: m.name,
                status: reading.status,
                reason: reading.reason,
                warning: reading.prediction_warning,
                timestamp: reading.timestamp,
              }
              return [alert, ...prev].slice(0, 50)
            })
          }
        })
        .catch(() => { })
    })
  }, [])

  useEffect(() => {
    if (running) {
      fetchAll()
      intervalRef.current = setInterval(fetchAll, 2000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, fetchAll])

  const refreshMachines = useCallback(() => {
    getMachines().then(r => {
      const ms = r.data.data
      setMachines(ms)
      machinesRef.current = ms
      setHistories(prev => {
        const h = { ...prev }
        ms.forEach(m => { if (!h[m.id]) h[m.id] = [] })
        return h
      })
    }).catch(() => { })
  }, [])

  const value = {
    machines,
    readings,
    histories,
    running,
    setRunning,
    alerts,
    backendAlerts,
    refreshMachines,
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used inside SimulationProvider')
  return ctx
}
