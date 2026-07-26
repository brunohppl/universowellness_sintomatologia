import { createClient } from '@supabase/supabase-js'
import { verifyCaller } from './_verify-caller.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Configuração incompleta: SUPABASE_SERVICE_ROLE_KEY não está definida.'
    })
  }

  try {
    const { userId: callerId, role: callerRole } = await verifyCaller(req.headers.authorization)

    if (callerRole !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas administradores podem remover utilizadores.' })
    }

    const { userId } = req.body ?? {}
    if (!userId) return res.status(400).json({ error: 'userId é obrigatório.' })

    if (userId === callerId) {
      return res.status(400).json({ error: 'Não pode remover a sua própria conta.' })
    }

    const admin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    console.error('remove-user:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
