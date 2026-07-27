import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/AppBar'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabaseClient'
import { ROLE_LABELS, ROLES } from '../lib/roles'

const ROLE_OPTIONS = [
  { value: ROLES.WORKER,     label: 'Utilizador — formulários' },
  { value: ROLES.ANALYST,    label: 'Analista — resultados' },
  { value: ROLES.MANAGER,    label: 'Gestor — empresas/filiais' },
  { value: ROLES.SUPERADMIN, label: 'Administrador — acesso total' }
]

const ROLE_BADGE = {
  worker:     'bg-slate-100 text-slate-600',
  analyst:    'bg-blue-50 text-blue-700',
  manager:    'bg-teal-50 text-teal-700',
  superadmin: 'bg-coral-50 text-coral-700'
}

async function callApi(path, method, body, jwt) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
  return json
}

export default function AdminUsers() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [utilizadores, setUtilizadores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState(ROLES.WORKER)
  const [enviandoConvite, setEnviandoConvite] = useState(false)

  // Role change
  const [atualizandoId, setAtualizandoId] = useState(null)

  useEffect(() => {
    if (session === null) navigate('/login')
  }, [session, navigate])

  const carregarUtilizadores = async () => {
    setCarregando(true)
    setErro('')
    // list_user_profiles() is a security definer function that joins
    // profiles with auth.users to expose the email field
    const { data, error } = await supabase.rpc('list_user_profiles')
    if (error) {
      console.error('list_user_profiles error:', error)
      setErro('Não foi possível carregar os utilizadores. Verifique as permissões.')
      setUtilizadores([])
    } else {
      setUtilizadores(data ?? [])
    }
    setCarregando(false)
  }

  useEffect(() => {
    if (session) carregarUtilizadores()
  }, [session])

  const flash = (msg, isErro = false) => {
    if (isErro) setErro(msg)
    else setSucesso(msg)
    setTimeout(() => { setErro(''); setSucesso('') }, 4000)
  }

  const handleConvidar = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setEnviandoConvite(true)
    setErro('')
    try {
      const jwt = session.access_token
      await callApi('/api/invite-user', 'POST', { email: inviteEmail.trim(), role: inviteRole }, jwt)
      flash(`Convite enviado para ${inviteEmail.trim()}.`)
      setInviteEmail('')
      setInviteRole(ROLES.WORKER)
      await carregarUtilizadores()
    } catch (e) {
      flash(e.message, true)
    }
    setEnviandoConvite(false)
  }

  const handleMudarRole = async (userId, novoRole) => {
    setAtualizandoId(userId)
    setErro('')
    const { error } = await supabase
      .from('profiles')
      .update({ role: novoRole })
      .eq('id', userId)
    setAtualizandoId(null)
    if (error) {
      flash('Não foi possível actualizar o papel.', true)
    } else {
      setUtilizadores((prev) =>
        prev.map((u) => u.id === userId ? { ...u, role: novoRole } : u)
      )
      flash('Papel actualizado.')
    }
  }

  const handleRemover = async (userId, email) => {
    if (!window.confirm(`Remover o utilizador "${email}"? Esta acção não pode ser desfeita.`)) return
    setErro('')
    try {
      const jwt = session.access_token
      await callApi('/api/remove-user', 'DELETE', { userId }, jwt)
      setUtilizadores((prev) => prev.filter((u) => u.id !== userId))
      flash('Utilizador removido.')
    } catch (e) {
      flash(e.message, true)
    }
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-canvas">
      <AppBar />
      <div className="px-2 py-3 bg-white border-b border-teal-50">
        <h1 className="font-display font-extrabold text-lg text-ink px-4 sm:px-8">Utilizadores</h1>
      </div>

      <main className="px-4 sm:px-8 py-6 max-w-4xl mx-auto space-y-6">

        {/* Feedback */}
        {erro && (
          <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-2xl px-4 py-3 text-sm font-medium">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="bg-green-50 border border-green-300 text-green-700 rounded-2xl px-4 py-3 text-sm font-medium">
            {sucesso}
          </div>
        )}

        {/* Invite form */}
        <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
          <h2 className="font-display font-semibold text-ink mb-1">Convidar utilizador</h2>
          <p className="text-sm text-muted mb-4">
            O utilizador receberá um e-mail com um link para definir a sua senha e aceder à plataforma.
          </p>
          <form onSubmit={handleConvidar} className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@empresa.com"
              className="rounded-xl border border-teal-100 px-4 py-2.5 text-sm outline-none focus:border-teal-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-xl border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-500 bg-white"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={enviandoConvite}
              className="bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              {enviandoConvite ? 'A enviar...' : 'Enviar convite'}
            </button>
          </form>
        </div>

        {/* Users list */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-teal-50">
            <h2 className="font-display font-semibold text-ink">
              Utilizadores ativos
              {!carregando && <span className="text-muted font-normal text-sm ml-2">({utilizadores.length})</span>}
            </h2>
          </div>

          {carregando ? (
            <div className="p-8 text-center text-muted text-sm">A carregar...</div>
          ) : utilizadores.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm italic">Nenhum utilizador encontrado.</div>
          ) : (
            <div className="divide-y divide-teal-50">
              {utilizadores.map((u) => {
                const email = u.email ?? u.id
                const lastLogin = u.last_sign_in_at
                  ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR')
                  : u.invited_at ? 'Convite pendente' : '—'
                const isSelf = u.id === session.user.id

                return (
                  <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-teal-50 grid place-items-center text-teal-700 font-bold text-sm flex-shrink-0">
                      {(email[0] ?? '?').toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">
                        {email}
                        {isSelf && <span className="text-muted font-normal ml-1">(você)</span>}
                      </p>
                      <p className="text-xs text-muted">Último acesso: {lastLogin}</p>
                    </div>

                    {/* Role badge + selector */}
                    <div className="flex items-center gap-2">
                      {isSelf ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE[u.role] ?? ''}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={atualizandoId === u.id}
                          onChange={(e) => handleMudarRole(u.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border outline-none cursor-pointer ${ROLE_BADGE[u.role] ?? 'bg-slate-100'} border-current/20`}
                        >
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Remove */}
                    {!isSelf && (
                      <button
                        onClick={() => handleRemover(u.id, email)}
                        className="text-xs font-semibold text-coral-600 hover:text-coral-700 px-2 py-1"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Role legend */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Níveis de acesso</h3>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((o, i) => (
              <div key={o.value} className="flex items-center gap-3 text-sm">
                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${ROLE_BADGE[o.value]}`}>
                  Nível {i + 1}
                </span>
                <span className="text-muted">{o.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            Cada nível inclui tudo do nível anterior. O papel pode ser alterado a qualquer momento — o utilizador
            não precisa de iniciar sessão novamente para o efeito se reflectir.
          </p>
        </div>
      </main>
    </div>
  )
}
