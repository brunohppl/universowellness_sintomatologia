// Vercel serverless function — runs server-side only.
// Convida um utilizador por e-mail e define o seu papel (role).
// Requer SUPABASE_SERVICE_ROLE_KEY nas env vars do Vercel (nunca exposta ao browser).
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify the caller is authenticated and is a superadmin
  const authHeader = req.headers.authorization ?? ''
  const callerJwt  = authHeader.replace('Bearer ', '')
  if (!callerJwt) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify caller's role
  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(callerJwt)
  if (!caller) return res.status(401).json({ error: 'Unauthorized' })

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden — superadmin required' })
  }

  const { email, role } = req.body
  const validRoles = ['worker', 'analyst', 'manager', 'superadmin']
  if (!email || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'email and valid role are required' })
  }

  // Invite via Supabase Auth — the trigger will create the profile with this role
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { role }  // picked up by the handle_new_user trigger
  })

  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ id: data.user?.id })
}
