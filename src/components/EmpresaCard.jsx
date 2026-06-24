import { useEffect, useState } from 'react'
import { criarFilial, gerarSlug, listarFiliaisPorEmpresa, removerFilial } from '../lib/empresas'
import FilialCard from './FilialCard'

export default function EmpresaCard({ empresa, onRemoverEmpresa }) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [filiais, setFiliais] = useState([])
  const [erro, setErro] = useState('')
  const [novaFilialNome, setNovaFilialNome] = useState('')

  const carregarFiliais = async () => {
    setCarregando(true)
    setErro('')
    try {
      setFiliais(await listarFiliaisPorEmpresa(empresa.id))
    } catch {
      setErro('Não foi possível carregar as filiais desta empresa.')
    }
    setCarregando(false)
  }

  useEffect(() => {
    if (aberto) carregarFiliais()
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
    } catch {
      setErro('Não foi possível criar a filial (talvez o link já exista — tente um nome diferente).')
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
        <div className="border-t border-teal-50 p-4 sm:p-5 space-y-4">
          {erro && (
            <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-xl px-3 py-2 text-sm">{erro}</div>
          )}

          <div>
            <h4 className="font-display font-semibold text-sm text-ink mb-2">
              Filiais <span className="text-muted font-normal">({filiais.length})</span>
            </h4>
            <p className="text-xs text-muted mb-3">
              Cada filial tem seu próprio link de formulário e sua própria lista de setores. Clique em "Setores"
              dentro de cada filial para configurar os departamentos dela, e em "Abrir formulário" para testar ou
              começar a usar.
            </p>

            {carregando ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : (
              <div className="space-y-2 mb-3">
                {filiais.length === 0 && <p className="text-sm text-muted italic">Nenhuma filial cadastrada ainda.</p>}
                {filiais.map((f) => (
                  <FilialCard key={f.id} empresa={empresa} filial={f} onRemoverFilial={handleRemoverFilial} />
                ))}
              </div>
            )}

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

          <button
            onClick={() => onRemoverEmpresa(empresa.id)}
            className="text-xs font-semibold text-coral-600 hover:text-coral-700"
          >
            Remover este cliente
          </button>
        </div>
      )}
    </div>
  )
}
