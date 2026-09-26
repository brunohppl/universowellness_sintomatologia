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
      return res.status(403).json({ error: 'Apenas administradores podem convidar usuários.' })
    }

    const { email, role, empresaId } = req.body ?? {}
    const validRoles = ['worker', 'analyst', 'manager', 'superadmin']

    if (!email || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'E-mail e permissão válidos são obrigatórios.' })
    }

    // Um usuário restrito a uma empresa só pode ter acesso de leitura.
    if (empresaId && !['worker', 'analyst'].includes(role)) {
      return res.status(400).json({
        error: 'Usuários restritos a uma empresa só podem ter permissão de Usuário ou Analista.'
      })
    }

    const admin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Redirect invite links to /invite so the page can process the token
    // before RequireAuth intercepts it. Use the request origin so this
    // works in production, preview deploys, and local dev automatically.
    const origin = req.headers.origin
      ?? req.headers.referer?.split('/').slice(0, 3).join('/')
      ?? ''
    const redirectTo = origin ? `${origin}/invite` : undefined

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { role }
    })

    if (error) return res.status(400).json({ error: error.message })

    // O gatilho cria o perfil com o papel; o escopo é aplicado logo a seguir.
    if (data.user?.id) {
      await admin
        .from('profiles')
        .upsert({ id: data.user.id, role, empresa_id: empresaId || null }, { onConflict: 'id' })
    }

    return res.status(200).json({ id: data.user?.id })

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    console.error('invite-user:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
