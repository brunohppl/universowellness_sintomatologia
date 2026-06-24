import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import WorkerForm from './pages/WorkerForm'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminClientes from './pages/AdminClientes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkerForm />} />
        <Route path="/f/:slug" element={<WorkerForm />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/clientes" element={<AdminClientes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
