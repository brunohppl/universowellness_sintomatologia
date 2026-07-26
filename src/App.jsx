import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import LoginPage from './pages/LoginPage'
import AcceptInvitePage from './pages/AcceptInvitePage'
import LandingPage from './pages/LandingPage'
import WorkerForm from './pages/WorkerForm'
import AdminDashboard from './pages/AdminDashboard'
import AdminClientes from './pages/AdminClientes'
import AdminUsers from './pages/AdminUsers'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite" element={<AcceptInvitePage />} />

        {/* Level 1+ — all authenticated users */}
        <Route path="/" element={<RequireAuth minLevel={1}><LandingPage /></RequireAuth>} />
        <Route path="/f/:slug" element={<RequireAuth minLevel={1}><WorkerForm /></RequireAuth>} />

        {/* Level 2+ — analysts and above */}
        <Route path="/admin" element={<RequireAuth minLevel={2}><AdminDashboard /></RequireAuth>} />

        {/* Level 3+ — managers and above */}
        <Route path="/admin/clientes" element={<RequireAuth minLevel={3}><AdminClientes /></RequireAuth>} />

        {/* Level 4 — superadmin only */}
        <Route path="/admin/utilizadores" element={<RequireAuth minLevel={4}><AdminUsers /></RequireAuth>} />

        {/* Legacy redirects */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
