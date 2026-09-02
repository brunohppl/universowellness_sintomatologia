import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

/**
 * Handles the invite link redirect from Supabase.
 * Supabase appends #access_token=...&type=invite to the URL.
 * This page picks that up, verifies the session, then prompts
 * the user to set their own password before entering the app.
 */
export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState('loading') // loading | set-password | error
  const [novaSenha, setNovaSenha]   = useState('')
  const [confirmar, setConfirmar]   = useState('')
  const [erro, setErro]         = useState('')
  const [salvando, setSalvando] = useState(false)
  const [email, setEmail]       = useState('')

  useEffect(() => {
    // Supabase JS v2 automatically processes the #access_token fragment
    // and fires onAuthStateChange with event 'SIGNED_IN' or 'USER_UPDATED'
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        setEmail(session.user.email ?? '')
        setStep('set-password')
      }
    })

    // Also check if a session is already established from the URL hash
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setEmail(data.session.user.email ?? '')
        setStep('set-password')
      } else if (step === 'loading') {
        // Give Supabase 3 seconds to process the hash, then show error
        setTimeout(() => {
          setStep((s) => s === 'loading' ? 'error' : s)
        }, 3000)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }

    // Password set — go to the app
    navigate('/', { replace: true })
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

        {step === 'loading' && (
          <div className="text-center py-4">
            <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted text-sm">Validando o convite...</p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center">
            <h2 className="font-display font-extrabold text-xl text-ink mb-2">Link inválido</h2>
            <p className="text-muted text-sm mb-6">
              Este link de convite é inválido ou já expirou. Peça ao administrador que envie um novo convite.
            </p>
            <a href="/login" className="text-teal-700 underline text-sm">
              Ir para o login
            </a>
          </div>
        )}

        {step === 'set-password' && (
          <>
            <h1 className="font-display font-extrabold text-2xl text-ink text-center mb-1">
              Bem-vindo
            </h1>
            <p className="text-sm text-muted text-center mb-6">
              Defina uma senha para sua conta<br />
              <span className="font-medium text-ink">{email}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none"
                  autoComplete="new-password"
                />
              </div>

              {erro && (
                <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-xl px-4 py-2.5 text-sm">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-teal-700 hover:bg-teal-600 disabled:opacity-60 text-white font-display font-semibold py-3 rounded-xl transition-colors"
              >
                {salvando ? 'Salvando...' : 'Entrar na plataforma'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
