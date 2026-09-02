import { createClient } from '@supabase/supabase-js'
import { verifyCaller } from './_verify-caller.js'

/**
 * Arranque inicial: promove quem chama a superadmin — MAS apenas se ainda
 * não existir nenhum superadmin em todo o sistema.
 *
 * Alguém tem de ser o primeiro administrador, e essa primeira promoção não
 * pode ser autorizada por um administrador (não existe nenhum). Este endpoint
 * resolve isso sem obrigar a ir ao SQL do Supabase.
 *
 * É seguro porque só funciona uma vez: assim que existir um superadmin,
 * qualquer chamada seguinte é recusada. A partir daí, os papéis são geridos
 * normalmente por /api/set-user-role.
 *
 * GET  → indica se o arranque ainda está disponível
 * POST → executa a promoção
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Configuração incompleta: SUPABASE_SERVICE_ROLE_KEY não está definida no Vercel.'
    })
  }

  try {
    // Requer sessão válida — só contas já criadas pela equipa podem chamar isto
    const { userId: callerId } = await verifyCaller(req.headers.authorization)

    const admin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { count, error: countErr } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'superadmin')

    if (countErr) return res.status(400).json({ error: countErr.message })

    const disponivel = (count ?? 0) === 0

    if (req.method === 'GET') {
      return res.status(200).json({ disponivel })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!disponivel) {
      return res.status(403).json({
        error: 'Já existe um administrador no sistema. Peça-lhe que lhe atribua permissões.'
      })
    }

    const { error } = await admin
      .from('profiles')
      .upsert({ id: callerId, role: 'superadmin' }, { onConflict: 'id' })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    console.error('bootstrap-admin:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
