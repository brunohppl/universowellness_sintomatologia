import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { canManageData, canManageUsers, canViewResults, ROLE_LEVEL } from './roles'

export function useAuth() {
  const [session, setSession] = useState(undefined)
  const [role, setRole]       = useState(null)

  const fetchRole = async (userId) => {
    if (!userId) { setRole(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setRole(data?.role ?? 'worker')
  }

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
  }, [])

  return {
    session,
    role,
    roleLevel:       ROLE_LEVEL[role] ?? 0,
    loading:         session === undefined,
    // convenience booleans
    canViewResults:  canViewResults(role),
    canManageData:   canManageData(role),
    canManageUsers:  canManageUsers(role),
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password, options: { persistSession: true } }),
    signOut: () => supabase.auth.signOut()
  }
}
