import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { criarEmpresa, listarEmpresas, removerEmpresa } from '../lib/empresas'
import EmpresaCard from '../components/EmpresaCard'

export default function AdminClientes() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [empresas, setEmpresas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [nomeNovo, setNomeNovo] = useState('')
  const [logoNovo, setLogoNovo] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (session === null) navigate('/admin/login')
  }, [session, navigate])

  const carregar = async () => {
    setCarregando(true)
    try {
      setEmpresas(await listarEmpresas())
    } catch (e) {
      setErro('Não foi possível carregar a lista de clientes.')
    }
    setCarregando(false)
  }

  useEffect(() => {
    if (session) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const handleAdicionarEmpresa = async (e) => {
    e.preventDefault()
    if (!nomeNovo.trim()) return
    setSalvando(true)
    setErro('')
    try {
      const nova = await criarEmpresa(nomeNovo, logoNovo)
      setEmpresas((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNomeNovo('')
      setLogoNovo('')
    } catch (e) {
      setErro('Não foi possível criar o cliente.')
    }
    setSalvando(false)
  }

  const handleRemoverEmpresa = async (id) => {
    if (!window.confirm('Remover este cliente? Isso também remove suas filiais e setores cadastrados.')) return
    try {
      await removerEmpresa(id)
      setEmpresas((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      if (e?.code === '23503') {
        setErro('Este cliente já tem registros de sintomatologia salvos e não pode ser removido. Você pode mantê-lo e apenas remover suas filiais/setores não usados.')
      } else {
        setErro('Não foi possível remover este cliente.')
      }
    }
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-white border-b border-teal-100 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <img src="/logo-universo-wellness.png" alt="Universo Wellness" className="h-6 mb-1" />
          <h1 className="font-display font-extrabold text-xl text-ink">Clientes</h1>
        </div>
        <a
          href="/admin"
          className="text-sm font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 px-4 py-2 rounded-xl transition-colors"
        >
          ← Painel
        </a>
      </header>

      <main className="px-4 sm:px-8 py-6 max-w-3xl mx-auto">
        <p className="text-muted mb-6">
          Cadastre cada empresa cliente, suas filiais e a lista de setores que aparece no formulário delas. Cada
          filial gera um link único — copie e envie para o tablet/kiosk daquela unidade.
        </p>

        <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
          <h3 className="font-display font-semibold text-ink mb-3">Adicionar novo cliente</h3>
          <form onSubmit={handleAdicionarEmpresa} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              value={nomeNovo}
              onChange={(e) => setNomeNovo(e.target.value)}
              placeholder="Nome da empresa (ex: Coca-Cola)"
              className="rounded-xl border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              value={logoNovo}
              onChange={(e) => setLogoNovo(e.target.value)}
              placeholder="URL do logo (opcional)"
              className="rounded-xl border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={salvando}
              className="text-sm font-semibold bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl transition-colors"
            >
              {salvando ? 'Salvando...' : 'Criar cliente'}
            </button>
          </form>
        </div>

        {erro && (
          <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-xl px-4 py-3 text-sm mb-6">{erro}</div>
        )}

        {carregando ? (
          <p className="text-muted">Carregando clientes...</p>
        ) : empresas.length === 0 ? (
          <p className="text-muted italic">Nenhum cliente cadastrado ainda. Adicione o primeiro acima.</p>
        ) : (
          <div className="space-y-3">
            {empresas.map((empresa) => (
              <EmpresaCard key={empresa.id} empresa={empresa} onRemoverEmpresa={handleRemoverEmpresa} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
