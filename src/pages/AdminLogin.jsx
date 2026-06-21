import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function AdminLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

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
    navigate('/admin')
  }

  return (
    <div className="min-h-screen grid place-items-center bg-canvas px-4">
      <div className="bg-white rounded-3xl shadow-card p-8 w-full max-w-sm">
        <p className="font-display font-bold tracking-widest text-teal-700 text-xs uppercase mb-2 text-center">
          Universo Wellness
        </p>
        <h1 className="font-display font-extrabold text-2xl text-ink text-center mb-6">Painel da equipe</h1>

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
          Contas de acesso são criadas pelo administrador do Supabase. Fale com o time de TI se precisar de acesso.
        </p>
      </div>
    </div>
  )
}
