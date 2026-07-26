import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

/**
 * Barra de topo partilhada por todas as páginas autenticadas.
 * Mostra o logo, e a navegação conforme o papel do utilizador.
 */
export default function AppBar() {
  const { isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-20 px-4 sm:px-8 py-3 flex items-center justify-between">
      <a href="/" className="flex items-center">
        <img
          src="/logo-universo-wellness.png"
          alt="Universo Wellness"
          className="h-8 object-contain"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </a>

      <nav className="flex items-center gap-2 sm:gap-3">
        {isAdmin && (
          <>
            <a
              href="/"
              className="text-sm font-medium text-muted hover:text-ink transition-colors hidden sm:inline"
            >
              Formulários
            </a>
            <a
              href="/admin"
              className="text-sm font-medium text-muted hover:text-ink transition-colors hidden sm:inline"
            >
              Painel
            </a>
            <a
              href="/admin/clientes"
              className="text-sm font-medium text-muted hover:text-ink transition-colors hidden sm:inline"
            >
              Clientes
            </a>
          </>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-xl transition-colors"
        >
          Sair
        </button>
      </nav>
    </header>
  )
}
