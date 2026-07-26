import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

/**
 * Rota protegida.
 * minLevel: nível mínimo exigido (1=worker, 2=analyst, 3=manager, 4=superadmin)
 * Se não autenticado → /login
 * Se autenticado mas nível insuficiente → /
 */
export default function RequireAuth({ children, minLevel = 1 }) {
  const { session, roleLevel, loading } = useAuth()
  const location = useLocation()

  if (loading || (session && roleLevel === 0)) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roleLevel < minLevel) {
    return <Navigate to="/" replace />
  }

  return children
}
