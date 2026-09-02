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
        {/* ---- Público — sem necessidade de login ---- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite" element={<AcceptInvitePage />} />

        {/* Formulário partilhado por link — qualquer pessoa pode preencher */}
        <Route path="/f/:slug" element={<WorkerForm />} />

        {/* ---- Área da equipe — requer login ---- */}

        {/* Nível 1+ — seletor de empresa/filial (entrada da equipe) */}
        <Route path="/" element={<RequireAuth minLevel={1}><LandingPage /></RequireAuth>} />

        {/* Nível 2+ — painel de resultados */}
        <Route path="/admin" element={<RequireAuth minLevel={2}><AdminDashboard /></RequireAuth>} />

        {/* Nível 3+ — gestão de empresas/filiais */}
        <Route path="/admin/clientes" element={<RequireAuth minLevel={3}><AdminClientes /></RequireAuth>} />

        {/* Gestão de usuários — a própria página valida o nível 4 no
            servidor. O guard fica no nível 1 para que, num sistema ainda sem
            administrador, seja possível fazer a configuração inicial. */}
        <Route path="/admin/usuários" element={<RequireAuth minLevel={1}><AdminUsers /></RequireAuth>} />

        {/* Redirecionamentos antigos */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
