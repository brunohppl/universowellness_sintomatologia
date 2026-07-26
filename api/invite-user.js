import { createClient } from '@supabase/supabase-js'
import { verifyCaller } from './_verify-caller.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Configuração incompleta: SUPABASE_SERVICE_ROLE_KEY não está definida.'
    })
  }

  try {
    const { role: callerRole } = await verifyCaller(req.headers.authorization)

    if (callerRole !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas administradores podem convidar utilizadores.' })
    }

    const { email, role } = req.body ?? {}
    const validRoles = ['worker', 'analyst', 'manager', 'superadmin']

    if (!email || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'E-mail e papel (role) válidos são obrigatórios.' })
    }

    const admin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { role }
    })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ id: data.user?.id })

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    console.error('invite-user:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
