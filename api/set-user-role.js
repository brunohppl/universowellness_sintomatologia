import { createClient } from '@supabase/supabase-js'
import { verifyCaller } from './_verify-caller.js'

/**
 * Altera o papel de um utilizador. Feito no servidor com a service role key
 * para não depender das políticas RLS da tabela profiles.
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Configuração incompleta: SUPABASE_SERVICE_ROLE_KEY não está definida no Vercel.'
    })
  }

  try {
    const { userId: callerId, role: callerRole } = await verifyCaller(req.headers.authorization)

    if (callerRole !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar papéis.' })
    }

    const { userId, role } = req.body ?? {}
    const validRoles = ['worker', 'analyst', 'manager', 'superadmin']

    if (!userId || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'userId e papel válido são obrigatórios.' })
    }

    // Impede que um administrador se despromova e deixe o sistema sem acesso
    if (userId === callerId && role !== 'superadmin') {
      return res.status(400).json({
        error: 'Não pode alterar o seu próprio papel. Peça a outro administrador.'
      })
    }

    const admin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // upsert cobre o caso de a linha em profiles ainda não existir
    const { error } = await admin
      .from('profiles')
      .upsert({ id: userId, role }, { onConflict: 'id' })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    console.error('set-user-role:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
