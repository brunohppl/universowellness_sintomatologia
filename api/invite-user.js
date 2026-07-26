import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Always return JSON, even for crashes
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check env vars are present before doing anything
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

    // Verify caller is authenticated
    const { data: { user: caller }, error: callerErr } = await supabaseAdmin.auth.getUser(callerJwt)
    if (callerErr || !caller) return res.status(401).json({ error: 'Sessão inválida.' })

    // Verify caller is superadmin
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas administradores podem convidar utilizadores.' })
    }

    const { email, role } = req.body
    const validRoles = ['worker', 'analyst', 'manager', 'superadmin']
    if (!email || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'E-mail e papel (role) são obrigatórios.' })
    }

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role }
    })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ id: data.user?.id })

  } catch (err) {
    console.error('invite-user error:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
