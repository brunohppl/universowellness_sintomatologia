import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

/**
 * Rota protegida. Redireciona para /login se não autenticado.
 * Se adminOnly=true, utilizadores com papel 'user' são redirecionados
 * para a landing page em vez do painel.
 */
export default function RequireAuth({ children, adminOnly = false }) {
  const { session, role, loading } = useAuth()
  const location = useLocation()

  // Still loading session — show nothing to avoid flash
  if (loading || (session && role === null)) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // Not logged in — redirect to login, remembering where they wanted to go
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but not admin, trying to access admin-only route
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
