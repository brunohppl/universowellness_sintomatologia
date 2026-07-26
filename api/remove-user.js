// Vercel serverless function — remove um utilizador do Supabase Auth.
// Requer SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization ?? ''
  const callerJwt  = authHeader.replace('Bearer ', '')
  if (!callerJwt) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

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

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  // Prevent self-deletion
  if (userId === caller.id) {
    return res.status(400).json({ error: 'Não pode remover a sua própria conta.' })
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
