import { useEffect, useState } from 'react'
import {
  criarFilial,
  criarSetor,
  gerarSlug,
  listarFiliaisPorEmpresa,
  listarSetoresPorEmpresa,
  removerFilial,
  removerSetor
} from '../lib/empresas'

export default function EmpresaCard({ empresa, onRemoverEmpresa }) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [filiais, setFiliais] = useState([])
  const [setores, setSetores] = useState([])
  const [erro, setErro] = useState('')

  const [novaFilialNome, setNovaFilialNome] = useState('')
  const [novoSetorNome, setNovoSetorNome] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(null)

  const carregarDetalhes = async () => {
    setCarregando(true)
    setErro('')
    try {
      const [f, s] = await Promise.all([
        listarFiliaisPorEmpresa(empresa.id),
        listarSetoresPorEmpresa(empresa.id)
      ])
      setFiliais(f)
      setSetores(s)
    } catch (e) {
      setErro('Não foi possível carregar os dados desta empresa.')
    }
    setCarregando(false)
  }

  useEffect(() => {
    if (aberto) carregarDetalhes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  const handleAdicionarFilial = async (e) => {
    e.preventDefault()
    if (!novaFilialNome.trim()) return
    try {
      const slug = gerarSlug(empresa.nome, novaFilialNome)
      const nova = await criarFilial(empresa.id, novaFilialNome, slug)
      setFiliais((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovaFilialNome('')
    } catch (e) {
      setErro('Não foi possível criar a filial (talvez o link já exista — tente um nome diferente).')
    }
  }

  const handleAdicionarSetor = async (e) => {
    e.preventDefault()
    if (!novoSetorNome.trim()) return
    try {
      const novo = await criarSetor(empresa.id, novoSetorNome)
      setSetores((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovoSetorNome('')
    } catch (e) {
      setErro('Não foi possível criar o setor.')
    }
  }

  const handleRemoverFilial = async (id) => {
    if (!window.confirm('Remover esta filial? O link público dela deixará de funcionar.')) return
    try {
      await removerFilial(id)
      setFiliais((prev) => prev.filter((f) => f.id !== id))
    } catch (e) {
      if (e?.code === '23503') {
        setErro('Esta filial já tem registros de sintomatologia salvos e não pode ser removida.')
      } else {
        setErro('Não foi possível remover a filial.')
      }
    }
  }

  const handleRemoverSetor = async (id) => {
    try {
      await removerSetor(id)
      setSetores((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      setErro('Não foi possível remover o setor.')
    }
  }

  const copiarLink = (slug) => {
    const url = `${window.location.origin}/f/${slug}`
    navigator.clipboard?.writeText(url)
    setLinkCopiado(slug)
    setTimeout(() => setLinkCopiado(null), 1800)
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-teal-50 overflow-hidden">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-teal-50/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          {empresa.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nome} className="h-8 max-w-[96px] object-contain" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-teal-50 grid place-items-center text-teal-700 font-display font-bold text-sm">
              {empresa.nome.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-display font-semibold text-ink">{empresa.nome}</span>
        </div>
        <span className="text-muted text-sm">{aberto ? 'Ocultar ▲' : 'Gerenciar ▾'}</span>
      </button>

      {aberto && (
        <div className="border-t border-teal-50 p-4 sm:p-5 space-y-6">
          {erro && (
            <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-xl px-3 py-2 text-sm">{erro}</div>
          )}

          {carregando ? (
            <p className="text-sm text-muted">Carregando...</p>
          ) : (
            <>
              {/* Filiais */}
              <div>
                <h4 className="font-display font-semibold text-sm text-ink mb-2">
                  Filiais <span className="text-muted font-normal">({filiais.length})</span>
                </h4>
                <div className="space-y-2 mb-3">
                  {filiais.length === 0 && <p className="text-sm text-muted italic">Nenhuma filial cadastrada ainda.</p>}
                  {filiais.map((f) => (
                    <div
                      key={f.id}
                      className="flex flex-wrap items-center justify-between gap-2 bg-canvas rounded-xl px-3 py-2.5"
                    >
                      <div>
                        <p className="font-medium text-ink text-sm">{f.nome}</p>
                        <p className="text-xs text-muted font-mono">/f/{f.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copiarLink(f.slug)}
                          className="text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {linkCopiado === f.slug ? 'Copiado ✓' : 'Copiar link'}
                        </button>
                        <button
                          onClick={() => handleRemoverFilial(f.id)}
                          className="text-xs font-semibold text-coral-600 hover:text-coral-700 px-2 py-1.5"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAdicionarFilial} className="flex gap-2">
                  <input
                    value={novaFilialNome}
                    onChange={(e) => setNovaFilialNome(e.target.value)}
                    placeholder="Nome da nova filial (ex: São Paulo)"
                    className="flex-1 rounded-xl border border-teal-100 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="text-sm font-semibold bg-teal-700 hover:bg-teal-600 text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    Adicionar
                  </button>
                </form>
              </div>

              {/* Setores */}
              <div>
                <h4 className="font-display font-semibold text-sm text-ink mb-2">
                  Setores <span className="text-muted font-normal">({setores.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {setores.length === 0 && <p className="text-sm text-muted italic">Nenhum setor cadastrado ainda.</p>}
                  {setores.map((s) => (
                    <span
                      key={s.id}
                      className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-full pl-3 pr-2 py-1 text-sm"
                    >
                      {s.nome}
                      <button
                        onClick={() => handleRemoverSetor(s.id)}
                        className="w-4 h-4 grid place-items-center rounded-full hover:bg-teal-100 text-teal-700"
                        title="Remover setor"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAdicionarSetor} className="flex gap-2">
                  <input
                    value={novoSetorNome}
                    onChange={(e) => setNovoSetorNome(e.target.value)}
                    placeholder="Nome do novo setor (ex: Produção)"
                    className="flex-1 rounded-xl border border-teal-100 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="text-sm font-semibold bg-teal-700 hover:bg-teal-600 text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    Adicionar
                  </button>
                </form>
              </div>

              <button
                onClick={() => onRemoverEmpresa(empresa.id)}
                className="text-xs font-semibold text-coral-600 hover:text-coral-700"
              >
                Remover este cliente
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
