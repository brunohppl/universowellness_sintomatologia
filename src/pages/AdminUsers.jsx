import { useCallback, useEffect, useRef, useState } from 'react'
import AppBar from '../components/AppBar'
import { useAuth } from '../lib/useAuth'
import { ROLES } from '../lib/roles'
import { listarEmpresas } from '../lib/empresas'

const ROLE_OPTIONS = [
  { value: ROLES.WORKER,     label: 'Usuário — formulários' },
  { value: ROLES.ANALYST,    label: 'Analista — resultados' },
  { value: ROLES.MANAGER,    label: 'Gestor — empresas/filiais' },
  { value: ROLES.SUPERADMIN, label: 'Administrador — acesso total' }
]

const ROLE_BADGE = {
  worker:     'bg-slate-100 text-slate-600 border-slate-200',
  analyst:    'bg-blue-50 text-blue-700 border-blue-200',
  manager:    'bg-teal-50 text-teal-700 border-teal-200',
  superadmin: 'bg-coral-50 text-coral-700 border-coral-200'
}

async function callApi(path, body, jwt, method = 'POST') {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: method === 'GET' ? undefined : JSON.stringify(body ?? {})
  })
  // A função pode falhar antes de devolver JSON (ex: crash da serverless):
  // ler como texto primeiro evita o erro "Unexpected token 'A'".
  const texto = await res.text()
  let json
  try {
    json = JSON.parse(texto)
  } catch {
    throw new Error(
      res.status === 404
        ? 'Endpoint não encontrado. O aplicativo pode não estar totalmente publicado.'
        : `Resposta inesperada do servidor (${res.status}).`
    )
  }
  if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
  return json
}

export default function AdminUsers() {
  const { session, getAccessToken, refreshRole } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando]     = useState(true)
  const [erroCarregar, setErroCarregar] = useState('')
  const [podeArrancar, setPodeArrancar] = useState(false)

  const [mensagem, setMensagem] = useState(null) // { texto, tipo: 'erro' | 'sucesso' }
  const timerRef = useRef(null)

  const [inviteEmail, setInviteEmail]         = useState('')
  const [inviteRole, setInviteRole]           = useState(ROLES.WORKER)
  const [inviteEmpresa, setInviteEmpresa]     = useState('')   // '' = acesso global
  const [empresas, setEmpresas]               = useState([])
  const [enviandoConvite, setEnviandoConvite] = useState(false)
  const [ocupadoId, setOcupadoId]             = useState(null)

  // Uma mensagem de cada vez — antes, timers sobrepostos apagavam
  // mensagens novas antes de serem lidas.
  const flash = useCallback((texto, tipo = 'sucesso') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMensagem({ texto, tipo })
    timerRef.current = setTimeout(() => setMensagem(null), 5000)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true)
    setErroCarregar('')
    setPodeArrancar(false)
    try {
      const jwt = await getAccessToken()
      const { usuarios: lista } = await callApi('/api/list-users', null, jwt)
      setUsuarios(lista ?? [])
    } catch (err) {
      setUsuarios([])
      // Sem permissão: verificar se ainda ninguém é administrador,
      // caso em que oferecemos o arranque inicial.
      try {
        const jwt = await getAccessToken()
        const { disponivel } = await callApi('/api/bootstrap-admin', null, jwt, 'GET')
        if (disponivel) {
          setPodeArrancar(true)
          setErroCarregar('')
        } else {
          setErroCarregar(err.message)
        }
      } catch {
        setErroCarregar(err.message)
      }
    }
    setCarregando(false)
  }, [getAccessToken])

  useEffect(() => { if (session) carregarUsuarios() }, [session, carregarUsuarios])

  useEffect(() => {
    if (session) listarEmpresas().then(setEmpresas).catch(() => setEmpresas([]))
  }, [session])

  // Restringir a uma empresa implica acesso somente de leitura: gestores e
  // administradores atuam sobre os dados de todos os clientes.
  const papeisPermitidos = inviteEmpresa
    ? ROLE_OPTIONS.filter((o) => o.value === ROLES.WORKER || o.value === ROLES.ANALYST)
    : ROLE_OPTIONS

  useEffect(() => {
    if (inviteEmpresa && !['worker', 'analyst'].includes(inviteRole)) {
      setInviteRole(ROLES.ANALYST)
    }
  }, [inviteEmpresa, inviteRole])

  const handleConvidar = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setEnviandoConvite(true)
    try {
      const jwt = await getAccessToken()
      await callApi('/api/invite-user', { email: inviteEmail.trim(), role: inviteRole, empresaId: inviteEmpresa || null }, jwt)
      flash(`Convite enviado para ${inviteEmail.trim()}.`)
      setInviteEmail('')
      setInviteRole(ROLES.WORKER)
      setInviteEmpresa('')
      await carregarUsuarios()
    } catch (err) {
      flash(err.message, 'erro')
    }
    setEnviandoConvite(false)
  }

  const handleReenviar = async (email, role, empresaId) => {
    setOcupadoId(email)
    try {
      const jwt = await getAccessToken()
      await callApi('/api/invite-user', { email, role, empresaId: empresaId || null }, jwt)
      flash(`Convite reenviado para ${email}.`)
    } catch (err) {
      flash(err.message, 'erro')
    }
    setOcupadoId(null)
  }

  const handleMudarRole = async (userId, novoRole) => {
    const atual = usuarios.find((u) => u.id === userId)
    setOcupadoId(userId)
    try {
      const jwt = await getAccessToken()
      await callApi('/api/set-user-role',
        { userId, role: novoRole, empresaId: atual?.empresa_id ?? null }, jwt)
      setUsuarios((prev) => prev.map((u) => (u.id === userId ? { ...u, role: novoRole } : u)))
      flash('Permissão atualizada.')
    } catch (err) {
      flash(err.message, 'erro')
    }
    setOcupadoId(null)
  }

  const handleMudarEmpresa = async (userId, novaEmpresa) => {
    const atual = usuarios.find((u) => u.id === userId)
    // Ao restringir a uma empresa, rebaixa gestor/administrador para analista.
    const papel = novaEmpresa && !['worker', 'analyst'].includes(atual?.role)
      ? ROLES.ANALYST
      : (atual?.role ?? ROLES.WORKER)
    setOcupadoId(userId)
    try {
      const jwt = await getAccessToken()
      await callApi('/api/set-user-role',
        { userId, role: papel, empresaId: novaEmpresa || null }, jwt)
      setUsuarios((prev) => prev.map((u) => (u.id === userId
        ? { ...u,
            empresa_id: novaEmpresa || null,
            empresa_nome: empresas.find((e) => e.id === novaEmpresa)?.nome ?? null,
            role: papel }
        : u)))
      flash(novaEmpresa ? 'Acesso restrito à empresa selecionada.' : 'Acesso global restaurado.')
    } catch (err) {
      flash(err.message, 'erro')
    }
    setOcupadoId(null)
  }

  const handleArrancar = async () => {
    setOcupadoId('bootstrap')
    try {
      const jwt = await getAccessToken()
      await callApi('/api/bootstrap-admin', null, jwt)
      await refreshRole()
      flash('Você agora é administrador. Carregando usuários...')
      await carregarUsuarios()
    } catch (err) {
      flash(err.message, 'erro')
    }
    setOcupadoId(null)
  }

  const handleRemover = async (userId, email) => {
    if (!window.confirm(`Remover o usuário "${email}"? Esta ação não pode ser desfeita.`)) return
    setOcupadoId(userId)
    try {
      const jwt = await getAccessToken()
      await callApi('/api/remove-user', { userId }, jwt)
      setUsuarios((prev) => prev.filter((u) => u.id !== userId))
      flash('Usuário removido.')
    } catch (err) {
      flash(err.message, 'erro')
    }
    setOcupadoId(null)
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-canvas">
      <AppBar />
      <div className="px-2 py-3 bg-white border-b border-teal-50">
        <h1 className="font-display font-extrabold text-lg text-ink px-4 sm:px-8">Usuários</h1>
      </div>

      <main className="px-4 sm:px-8 py-6 max-w-4xl mx-auto space-y-6">

        {mensagem && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium border ${
              mensagem.tipo === 'erro'
                ? 'bg-coral-50 border-coral-300 text-coral-700'
                : 'bg-green-50 border-green-300 text-green-700'
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        {podeArrancar && (
          <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 border-2 border-coral-300">
            <h2 className="font-display font-semibold text-ink mb-1">Configuração inicial</h2>
            <p className="text-sm text-muted mb-4">
              Ainda não existe nenhum administrador neste sistema. Como você já tem uma conta,
              pode assumir essa função agora — isso só é possível uma vez.
            </p>
            <button
              onClick={handleArrancar}
              disabled={ocupadoId === 'bootstrap'}
              className="bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              {ocupadoId === 'bootstrap' ? 'Configurando...' : 'Tornar-me administrador'}
            </button>
          </div>
        )}

        {/* Convidar */}
        <div className={`bg-white rounded-2xl shadow-card p-5 sm:p-6 ${podeArrancar ? 'opacity-40 pointer-events-none' : ''}`}>
          <h2 className="font-display font-semibold text-ink mb-1">Convidar usuário</h2>
          <p className="text-sm text-muted mb-4">
            O usuário recebe um e-mail com um link para definir sua senha e acessar a plataforma.
            {inviteEmpresa && (
              <> Restrito a uma empresa, ele verá apenas os dados dela — sem poder cadastrar
              ou alterar nada.</>
            )}
          </p>
          <form onSubmit={handleConvidar} className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@empresa.com"
              className="rounded-xl border border-teal-100 px-4 py-2.5 text-sm outline-none focus:border-teal-500"
            />
            <select
              value={inviteEmpresa}
              onChange={(e) => setInviteEmpresa(e.target.value)}
              title="Limitar o acesso aos dados de uma empresa"
              className="rounded-xl border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-500 bg-white"
            >
              <option value="">Todas as empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>Apenas {e.nome}</option>
              ))}
            </select>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-xl border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-500 bg-white"
            >
              {papeisPermitidos.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={enviandoConvite}
              className="bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              {enviandoConvite ? 'Enviando...' : 'Enviar convite'}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-teal-50 flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink">
              Usuários ativos
              {!carregando && !erroCarregar && (
                <span className="text-muted font-normal text-sm ml-2">({usuarios.length})</span>
              )}
            </h2>
            <button
              onClick={carregarUsuarios}
              className="text-xs font-semibold text-teal-700 hover:text-teal-600 px-2 py-1"
            >
              Atualizar
            </button>
          </div>

          {carregando ? (
            <div className="p-8 text-center text-muted text-sm">Carregando...</div>
          ) : erroCarregar ? (
            <div className="p-6">
              <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-xl px-4 py-3 text-sm">
                {erroCarregar}
              </div>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm italic">Nenhum usuário encontrado.</div>
          ) : (
            <div className="divide-y divide-teal-50">
              {usuarios.map((u) => {
                const email      = u.email ?? u.id
                const pendente   = !u.last_sign_in_at
                const ultimo     = u.last_sign_in_at
                  ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR')
                  : null
                const isSelf     = u.id === session.user.id
                const ocupado    = ocupadoId === u.id || ocupadoId === email

                return (
                  <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-teal-50 grid place-items-center text-teal-700 font-bold text-sm flex-shrink-0">
                      {(email[0] ?? '?').toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">
                        {email}
                        {isSelf && <span className="text-muted font-normal ml-1">(você)</span>}
                      </p>
                      <p className="text-xs text-muted">
                        {pendente ? (
                          <span className="text-amber-600">Convite pendente — ainda não acessou</span>
                        ) : (
                          <>Último acesso: {ultimo}</>
                        )}
                        {u.empresa_nome && (
                          <> · <span className="text-teal-700 font-medium">
                            Apenas {u.empresa_nome}
                          </span></>
                        )}
                      </p>
                    </div>

                    <select
                      value={u.empresa_id ?? ''}
                      disabled={isSelf || ocupado}
                      onChange={(e) => handleMudarEmpresa(u.id, e.target.value)}
                      title={isSelf ? 'Não pode alterar o seu próprio acesso' : 'Limitar acesso a uma empresa'}
                      className="text-xs font-semibold rounded-full px-2.5 py-1.5 border outline-none disabled:opacity-60 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-600 max-w-[150px]"
                    >
                      <option value="">Todas as empresas</option>
                      {empresas.map((e) => (
                        <option key={e.id} value={e.id}>Apenas {e.nome}</option>
                      ))}
                    </select>

                    <select
                      value={u.role}
                      disabled={isSelf || ocupado}
                      onChange={(e) => handleMudarRole(u.id, e.target.value)}
                      title={isSelf ? 'Você não pode alterar sua própria permissão' : 'Alterar permissão'}
                      className={`text-xs font-semibold rounded-full px-2.5 py-1.5 border outline-none disabled:opacity-60 disabled:cursor-not-allowed ${ROLE_BADGE[u.role] ?? 'bg-slate-100 border-slate-200'}`}
                    >
                      {(u.empresa_id
                        ? ROLE_OPTIONS.filter((o) => o.value === ROLES.WORKER || o.value === ROLES.ANALYST)
                        : ROLE_OPTIONS
                      ).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>

                    {pendente && !isSelf && (
                      <button
                        onClick={() => handleReenviar(email, u.role, u.empresa_id)}
                        disabled={ocupado}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-600 disabled:opacity-50 px-2 py-1"
                      >
                        Reenviar
                      </button>
                    )}

                    {!isSelf && (
                      <button
                        onClick={() => handleRemover(u.id, email)}
                        disabled={ocupado}
                        className="text-xs font-semibold text-coral-600 hover:text-coral-700 disabled:opacity-50 px-2 py-1"
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

        {/* Legenda */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Níveis de acesso</h3>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((o, i) => (
              <div key={o.value} className="flex items-center gap-3 text-sm">
                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs border ${ROLE_BADGE[o.value]}`}>
                  Nível {i + 1}
                </span>
                <span className="text-muted">{o.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            Cada nível inclui tudo do nível anterior. Você não pode alterar nem remover sua própria conta —
            peça a outro administrador.
            <br />
            Um usuário restrito a uma empresa vê apenas os dados dela e não pode cadastrar nem
            alterar empresas, filiais ou outros usuários — por isso só aceita os níveis 1 e 2.
          </p>
        </div>
      </main>
    </div>
  )
}
