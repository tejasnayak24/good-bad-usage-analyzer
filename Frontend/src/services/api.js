import axios from 'axios'

const BASE = 'http://localhost:8000'
const api = axios.create({ baseURL: BASE })

export const getMachines          = ()        => api.get('/machines')
export const getMachine           = (id)      => api.get(`/machine/${id}`)
export const createMachine        = (data)    => api.post('/machines', data)
export const updateMachine        = (id, data)=> api.put(`/machines/${id}`, data)
export const deleteMachine        = (id)      => api.delete(`/machines/${id}`)
export const getSensor            = (id)      => api.get(`/sensor/${id}`)
export const getRealtime          = (id)      => api.get(`/realtime/${id}`)
export const getMachineHistory    = (id)      => api.get(`/machines/${id}/history`)
export const getAlerts            = ()        => api.get('/alerts')
export const getAlertStats        = ()        => api.get('/alerts/stats')
export const getMachineAlerts     = (id)      => api.get(`/alerts/machine/${id}`)
export const acknowledgeAlert     = (id)      => api.post(`/alerts/${id}/acknowledge`)
export const ackAlert             = (id)      => api.put(`/alerts/${id}/ack`)
export const getAnalytics         = ()        => api.get('/analytics')
export const getMachineAnalytics  = (id)      => api.get(`/analytics/machine/${id}`)
export const simulateBadUsage     = (id)      => api.put(`/machines/${id}/simulate-bad`)
export const simulateAlert        = ()        => api.put('/simulate-alert')

export default api

