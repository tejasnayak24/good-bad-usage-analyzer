import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import AppRoutes from './routes/AppRoutes'
import { SimulationProvider } from './context/SimulationContext'
import { ToastProvider } from './components/Toast'

export default function App() {
  return (
    <BrowserRouter>
      <SimulationProvider>
        <ToastProvider>
          <div className="layout">
            <Sidebar />
            <Navbar />
            <main className="main-content">
              <AppRoutes />
            </main>
          </div>
        </ToastProvider>
      </SimulationProvider>
    </BrowserRouter>
  )
}

