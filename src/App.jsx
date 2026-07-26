import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import WorkerForm from './pages/WorkerForm'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminClientes from './pages/AdminClientes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* "/" is now the company/branch selector landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* "/f/:slug" is the actual form for a specific branch */}
        <Route path="/f/:slug" element={<WorkerForm />} />

        {/* Admin area */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/clientes" element={<AdminClientes />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
