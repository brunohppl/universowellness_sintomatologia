// Shared helper: verifies the caller's JWT directly against the Supabase
// Auth API (raw fetch, no SDK quirks) and returns their profile role.
// Returns { userId, role } on success, or throws with a user-facing message.

import { createClient } from '@supabase/supabase-js'

export async function verifyCaller(authHeader) {
  const jwt = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader ?? ''

  if (!jwt) throw { status: 401, message: 'Token em falta.' }

  // Call Supabase Auth directly — avoids SDK client config issues
  const authRes = await fetch(
    `${process.env.VITE_SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }
  )

  if (!authRes.ok) {
    const body = await authRes.json().catch(() => ({}))
    throw {
      status: 401,
      message: `Sessão inválida: ${body.msg ?? body.error_description ?? authRes.status}`
    }
  }

  const userData = await authRes.json()
  if (!userData?.id) throw { status: 401, message: 'Utilizador não encontrado.' }

  // Look up their role in profiles using the admin client (bypasses RLS)
  const admin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.id)
    .single()

  return { userId: userData.id, role: profile?.role ?? 'worker' }
}
