import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { canManageData, canManageUsers, canViewResults, ROLE_LEVEL } from './roles'

const AuthContext = createContext(null)

/**
 * Fonte única de verdade para sessão + papel do utilizador.
 * Antes, cada componente chamava useAuth() e criava a sua própria cópia do
 * estado, o seu próprio listener e a sua própria consulta à tabela profiles
 * — três cópias só na página de Utilizadores, que podiam discordar entre si.
 * Agora existe apenas uma instância, partilhada por toda a app.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = a carregar
  const [role, setRole]       = useState(null)

  const fetchRole = useCallback(async (userId) => {
    if (!userId) { setRole(null); return }
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('Erro ao carregar o papel do utilizador:', error)
      setRole('worker')
      return
    }
    // maybeSingle devolve null (sem erro) se a linha não existir
    setRole(data?.role ?? 'worker')
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      fetchRole(data.session?.user?.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      fetchRole(s?.user?.id)
    })
    return () => listener.subscription.unsubscribe()
  }, [fetchRole])

  /**
   * Devolve sempre um access_token válido.
   * O token guardado em `session` pode estar expirado — o Supabase renova-o
   * em segundo plano, mas a cópia no estado do React fica desactualizada.
   * Era esta a causa do erro "Sessão inválida" que só desaparecia após
   * logout/login. Aqui pedimos sempre a sessão actual antes de chamar a API.
   */
  const getAccessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) {
      throw new Error('A sua sessão expirou. Faça login novamente.')
    }
    return data.session.access_token
  }, [])

  const value = {
    session,
    role,
    roleLevel:      ROLE_LEVEL[role] ?? 0,
    loading:        session === undefined,
    canViewResults: canViewResults(role),
    canManageData:  canManageData(role),
    canManageUsers: canManageUsers(role),
    getAccessToken,
    refreshRole:    () => fetchRole(session?.user?.id),
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password, options: { persistSession: true } }),
    signOut: () => supabase.auth.signOut()
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
