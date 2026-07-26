import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import WorkerForm from './pages/WorkerForm'
import AdminDashboard from './pages/AdminDashboard'
import AdminClientes from './pages/AdminClientes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — login only */}
        <Route path="/login" element={<LoginPage />} />

        {/* All authenticated users — workers and admins */}
        <Route path="/" element={
          <RequireAuth>
            <LandingPage />
          </RequireAuth>
        } />
        <Route path="/f/:slug" element={
          <RequireAuth>
            <WorkerForm />
          </RequireAuth>
        } />

        {/* Admin only */}
        <Route path="/admin" element={
          <RequireAuth adminOnly>
            <AdminDashboard />
          </RequireAuth>
        } />
        <Route path="/admin/clientes" element={
          <RequireAuth adminOnly>
            <AdminClientes />
          </RequireAuth>
        } />

        {/* Legacy login path redirect */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
