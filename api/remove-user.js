import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Configuração incompleta: SUPABASE_SERVICE_ROLE_KEY não está definida nas variáveis de ambiente do Vercel.'
    })
  }

  try {
    const authHeader = req.headers.authorization ?? ''
    const callerJwt  = authHeader.replace('Bearer ', '')
    if (!callerJwt) return res.status(401).json({ error: 'Não autorizado.' })

    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user: caller }, error: callerErr } = await supabaseAdmin.auth.getUser(callerJwt)
    if (callerErr || !caller) return res.status(401).json({ error: 'Sessão inválida.' })

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas administradores podem remover utilizadores.' })
    }

    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId é obrigatório.' })

    if (userId === caller.id) {
      return res.status(400).json({ error: 'Não pode remover a sua própria conta.' })
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('remove-user error:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
