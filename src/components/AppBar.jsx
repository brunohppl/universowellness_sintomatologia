import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import ChangePasswordModal from './ChangePasswordModal'

export default function AppBar() {
  const { session, canViewResults, canManageData, canManageUsers, signOut } = useAuth()
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto]         = useState(false)
  const [mostrarModal, setMostrarModal]     = useState(false)
  const menuRef                             = useRef(null)

  const email = session?.user?.email ?? ''

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setMenuAberto(false)
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20 px-4 sm:px-8 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img
            src="/logo-universo-wellness.png"
            alt="Universo Wellness"
            className="h-8 object-contain"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </a>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="/" className="text-sm font-medium text-muted hover:text-ink px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors hidden sm:inline">
            Formulários
          </a>
          {canViewResults && (
            <a href="/admin" className="text-sm font-medium text-muted hover:text-ink px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors hidden sm:inline">
              Resultados
            </a>
          )}
          {canManageData && (
            <a href="/admin/clientes" className="text-sm font-medium text-muted hover:text-ink px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors hidden sm:inline">
              Clientes
            </a>
          )}
          {canManageUsers && (
            <a href="/admin/utilizadores" className="text-sm font-medium text-muted hover:text-ink px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors hidden sm:inline">
              Utilizadores
            </a>
          )}

          {/* User menu */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setMenuAberto((v) => !v)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl transition-colors text-sm font-semibold"
            >
              <span className="w-5 h-5 rounded-full bg-teal-600 grid place-items-center text-white text-[10px] font-bold flex-shrink-0">
                {email.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline max-w-[140px] truncate">{email}</span>
              <span className="text-muted text-xs">{menuAberto ? '▲' : '▾'}</span>
            </button>

            {menuAberto && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-card border border-slate-100 py-1 z-30 animate-popIn">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs text-muted truncate">{email}</p>
                </div>
                <button
                  onClick={() => { setMenuAberto(false); setMostrarModal(true) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-slate-50 transition-colors"
                >
                  Alterar senha
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-coral-600 hover:bg-coral-50 transition-colors"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {mostrarModal && <ChangePasswordModal onClose={() => setMostrarModal(false)} />}
    </>
  )
}
