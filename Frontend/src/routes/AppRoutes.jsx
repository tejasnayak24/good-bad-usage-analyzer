import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard    from '../pages/Dashboard'
import MachineList  from '../pages/MachineList'
import MachineDetail from '../pages/MachineDetail'
import Components   from '../pages/Components'
import SensorDetail from '../pages/SensorDetail'
import Realtime     from '../pages/Realtime'
import Alerts       from '../pages/Alerts'
import Analytics    from '../pages/Analytics'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                           element={<Dashboard />} />
      <Route path="/machines"                   element={<MachineList />} />
      <Route path="/machines/:id"               element={<MachineDetail />} />
      <Route path="/machines/:id/components"    element={<Components />} />
      <Route path="/machines/:id/sensors"       element={<SensorDetail />} />
      <Route path="/realtime"                   element={<Realtime />} />
      <Route path="/alerts"                     element={<Alerts />} />
      <Route path="/analytics"                  element={<Analytics />} />
    </Routes>
  )
}
