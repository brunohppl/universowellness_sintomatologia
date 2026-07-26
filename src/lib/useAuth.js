import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [role, setRole] = useState(null)            // 'admin' | 'user' | null

  const fetchRole = async (userId) => {
    if (!userId) { setRole(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setRole(data?.role ?? 'user')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      fetchRole(data.session?.user?.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      fetchRole(newSession?.user?.id)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return {
    session,
    role,
    isAdmin: role === 'admin',
    loading: session === undefined,
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({
        email,
        password,
        options: { persistSession: true }
      }),
    signOut: () => supabase.auth.signOut()
  }
}
