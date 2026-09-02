import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ChangePasswordModal({ onClose }) {
  const [novaSenha, setNovaSenha]           = useState('')
  const [confirmar, setConfirmar]           = useState('')
  const [salvando, setSalvando]             = useState(false)
  const [erro, setErro]                     = useState('')
  const [sucesso, setSucesso]               = useState(false)

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
    setSucesso(true)
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-card w-full max-w-sm p-6 animate-popIn">
        {sucesso ? (
          <>
            <div className="w-12 h-12 rounded-full bg-leaf-500 grid place-items-center text-white text-2xl mx-auto mb-4">✓</div>
            <h2 className="font-display font-extrabold text-xl text-ink text-center mb-2">Senha alterada</h2>
            <p className="text-muted text-sm text-center mb-6">Sua senha foi atualizada com sucesso.</p>
            <button
              onClick={onClose}
              className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Fechar
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-extrabold text-xl text-ink">Alterar senha</h2>
              <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                  className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none"
                  autoComplete="new-password"
                />
              </div>

              {erro && (
                <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-xl px-4 py-2.5 text-sm">
                  {erro}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 bg-teal-700 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {salvando ? 'Salvando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
