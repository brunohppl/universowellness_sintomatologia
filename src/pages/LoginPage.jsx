import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function LoginPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Already logged in — send them on
  useEffect(() => {
    if (session) navigate(from, { replace: true })
  }, [session, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    const { error } = await signIn(email.trim(), senha)
    setCarregando(false)
    if (error) {
      setErro('E-mail ou senha incorretos.')
      return
    }
    // navigation happens via the useEffect above once session updates
  }

  return (
    <div className="min-h-screen grid place-items-center bg-canvas px-4">
      <div className="bg-white rounded-3xl shadow-card p-8 w-full max-w-sm">
        <img
          src="/logo-universo-wellness.png"
          alt="Universo Wellness"
          className="h-10 mx-auto mb-6 object-contain"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <h1 className="font-display font-extrabold text-2xl text-ink text-center mb-1">
          Bem-vindo
        </h1>
        <p className="text-sm text-muted text-center mb-6">
          Entre para continuar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-teal-100 px-4 py-3 focus:border-teal-500 outline-none"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="senha" className="block text-sm font-semibold text-ink mb-1">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-teal-100 px-4 py-3 focus:border-teal-500 outline-none"
              autoComplete="current-password"
            />
          </div>

          {erro && (
            <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-xl px-4 py-2.5 text-sm font-medium">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-teal-700 hover:bg-teal-600 disabled:opacity-60 text-white font-display font-semibold py-3 rounded-xl transition-colors"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-muted text-center mt-6">
          As contas de acesso são criadas pela equipe da Universo Wellness.
          <br />Fale com seu responsável se precisar de acesso.
        </p>
      </div>
    </div>
  )
}
