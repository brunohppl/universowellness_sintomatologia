import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/useAuth'
import { AREAS_DOR, getAreaNome } from '../data/painAreas'
import { exportSubmissionsToCsv } from '../lib/csv'
import StatCard from '../components/StatCard'
import AreaFrequencyChart from '../components/AreaFrequencyChart'
import SetorChart from '../components/SetorChart'

const isoDaysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
const todayISO = () => new Date().toISOString().slice(0, 10)

const PAGE_SIZE = 12

export default function AdminDashboard() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dataInicio, setDataInicio] = useState(isoDaysAgo(30))
  const [dataFim, setDataFim] = useState(todayISO())
  const [setorFiltro, setSetorFiltro] = useState('todos')
  const [areaFiltro, setAreaFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    if (session === null) navigate('/admin/login')
  }, [session, navigate])

  useEffect(() => {
    let ativo = true
    async function carregar() {
      setLoading(true)
      setError('')
      const { data, error: err } = await supabase
        .from('submissions')
        .select('*')
        .gte('data_registro', dataInicio)
        .lte('data_registro', dataFim)
        .order('data_registro', { ascending: false })
      if (!ativo) return
      if (err) {
        setError('Não foi possível carregar os dados. Verifique sua conexão e permissões no Supabase.')
        setRows([])
      } else {
        setRows(data ?? [])
      }
      setLoading(false)
    }
    if (session) carregar()
    return () => {
      ativo = false
    }
  }, [session, dataInicio, dataFim])

  const setoresDisponiveis = useMemo(
    () => Array.from(new Set(rows.map((r) => r.setor))).sort(),
    [rows]
  )

  const filtradas = useMemo(() => {
    return rows.filter((r) => {
      if (setorFiltro !== 'todos' && r.setor !== setorFiltro) return false
      if (areaFiltro !== 'todas') {
        const cod = Number(areaFiltro)
        if (!(r.areas_dor ?? []).includes(cod)) return false
      }
      if (busca.trim()) {
        const termo = busca.trim().toLowerCase()
        if (!r.nome?.toLowerCase().includes(termo) && !r.matricula?.toLowerCase().includes(termo)) return false
      }
      return true
    })
  }, [rows, setorFiltro, areaFiltro, busca])

  const stats = useMemo(() => {
    const total = filtradas.length
    const semDor = filtradas.filter((r) => (r.areas_dor ?? []).length === 0).length
    const contagem = {}
    filtradas.forEach((r) => (r.areas_dor ?? []).forEach((c) => (contagem[c] = (contagem[c] ?? 0) + 1)))
    const areaTopEntry = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]
    const setorContagem = {}
    filtradas.forEach((r) => (setorContagem[r.setor] = (setorContagem[r.setor] ?? 0) + 1))
    const setorTopEntry = Object.entries(setorContagem).sort((a, b) => b[1] - a[1])[0]
    return {
      total,
      semDor,
      areaTop: areaTopEntry ? `${getAreaNome(Number(areaTopEntry[0]))} (${areaTopEntry[1]})` : '—',
      setorTop: setorTopEntry ? `${setorTopEntry[0]} (${setorTopEntry[1]})` : '—',
      contagem,
      setorContagem
    }
  }, [filtradas])

  const dadosAreaChart = useMemo(
    () =>
      AREAS_DOR.map((a) => ({ nome: a.nome, total: stats.contagem[a.codigo] ?? 0 }))
        .filter((d) => d.total > 0)
        .sort((a, b) => b.total - a.total),
    [stats]
  )

  const dadosSetorChart = useMemo(
    () =>
      Object.entries(stats.setorContagem)
        .map(([setor, total]) => ({ setor, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
    [stats]
  )

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginaAtual = filtradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  if (!session) return null

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-white border-b border-teal-100 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="font-display font-bold tracking-widest text-teal-700 text-xs uppercase">Universo Wellness</p>
          <h1 className="font-display font-extrabold text-xl text-ink">Painel de Sintomatologia</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-teal-700 underline hidden sm:inline">
            Ir para o formulário
          </a>
          <button
            onClick={() => signOut().then(() => navigate('/admin/login'))}
            className="text-sm font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 px-4 py-2 rounded-xl transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-8 py-6 max-w-7xl mx-auto">
        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-card p-4 sm:p-5 mb-6 grid sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-xl border border-teal-100 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-xl border border-teal-100 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Setor</label>
            <select
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
              className="w-full rounded-xl border border-teal-100 px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              <option value="todos">Todos</option>
              {setoresDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Área</label>
            <select
              value={areaFiltro}
              onChange={(e) => setAreaFiltro(e.target.value)}
              className="w-full rounded-xl border border-teal-100 px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              <option value="todas">Todas</option>
              {AREAS_DOR.map((a) => (
                <option key={a.codigo} value={a.codigo}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Buscar nome/matrícula</label>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-xl border border-teal-100 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-2xl px-4 py-3 text-sm font-medium mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Registros no período" value={loading ? '…' : stats.total} />
          <StatCard label="Sem desconforto" value={loading ? '…' : stats.semDor} accent="leaf" />
          <StatCard label="Área mais reportada" value={loading ? '…' : stats.areaTop} accent="coral" />
          <StatCard label="Setor mais afetado" value={loading ? '…' : stats.setorTop} accent="coral" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <AreaFrequencyChart data={dadosAreaChart.length ? dadosAreaChart : [{ nome: 'Sem dados', total: 0 }]} />
          <SetorChart data={dadosSetorChart.length ? dadosSetorChart : [{ setor: 'Sem dados', total: 0 }]} />
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-teal-50">
            <h3 className="font-display font-semibold text-ink">Registros detalhados</h3>
            <button
              onClick={() => exportSubmissionsToCsv(filtradas, `sintomatologia_${dataInicio}_a_${dataFim}.csv`)}
              disabled={filtradas.length === 0}
              className="text-sm font-semibold bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-teal-50">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Setor</th>
                  <th className="px-4 py-3 font-semibold">Matrícula</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Áreas</th>
                  <th className="px-4 py-3 font-semibold">Observações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      Carregando...
                    </td>
                  </tr>
                ) : paginaAtual.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginaAtual.map((r) => (
                    <tr key={r.id} className="border-b border-teal-50/60 hover:bg-teal-50/40">
                      <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">{r.nome}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.setor}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.matricula || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(r.data_registro + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        {(r.areas_dor ?? []).length === 0 ? (
                          <span className="text-leaf-600 font-medium">Sem dor</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(r.areas_dor ?? []).map((c) => (
                              <span
                                key={c}
                                className="bg-coral-50 text-coral-700 border border-coral-100 rounded-full px-2 py-0.5 text-xs"
                              >
                                {getAreaNome(c)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted max-w-[240px] truncate" title={r.observacoes || ''}>
                        {r.observacoes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-teal-50 text-sm">
              <span className="text-muted">
                Página {pagina} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-3 py-1.5 rounded-lg border border-teal-100 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-3 py-1.5 rounded-lg border border-teal-100 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted text-center mt-6 pb-4">
          Precisa de uma visão mais avançada (cruzar dados, relatórios customizados)? Os mesmos dados também
          podem ser acessados diretamente pelo{' '}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="underline text-teal-700"
          >
            painel do Supabase
          </a>
          , na tabela <code className="font-mono">submissions</code>.
        </p>
      </main>
    </div>
  )
}
