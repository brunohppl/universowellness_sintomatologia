import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = carregando, null = sem sessão

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return {
    session,
    loading: session === undefined,
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({
        email,
        password,
        options: { persistSession: true }  // 30-day session by default, refreshed silently
      }),
    signOut: () => supabase.auth.signOut()
  }
}
