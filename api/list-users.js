import { createClient } from '@supabase/supabase-js'
import { verifyCaller } from './_verify-caller.js'

/**
 * Lista todos os usuários com o sua permissão e último acesso.
 * Usa a service role key no servidor, por isso não depende de funções
 * RPC nem de políticas RLS na base de dados — basta o schema base.
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Configuração incompleta: SUPABASE_SERVICE_ROLE_KEY não está definida no Vercel.'
    })
  }

  try {
    const { role: callerRole } = await verifyCaller(req.headers.authorization)

    if (callerRole !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas administradores podem listar usuários.' })
    }

    const admin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (authErr) return res.status(400).json({ error: authErr.message })

    const { data: perfis } = await admin.from('profiles').select('id, role, created_at')
    const roleById = Object.fromEntries((perfis ?? []).map((p) => [p.id, p.role]))

    const usuários = (authData?.users ?? []).map((u) => ({
      id:              u.id,
      email:           u.email,
      role:            roleById[u.id] ?? 'worker',
      last_sign_in_at: u.last_sign_in_at,
      invited_at:      u.invited_at,
      created_at:      u.created_at
    })).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    return res.status(200).json({ usuários })

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    console.error('list-users:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
