import { useEffect, useState } from 'react'
import { criarSetor, criarSetoresPadrao, listarSetoresPorFilial, removerSetor } from '../lib/empresas'

export default function FilialCard({ empresa, filial, onRemoverFilial }) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [setores, setSetores] = useState([])
  const [novoSetorNome, setNovoSetorNome] = useState('')
  const [erro, setErro] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)

  const linkPublico = `${window.location.origin}/f/${filial.slug}`

  const carregarSetores = async () => {
    setCarregando(true)
    setErro('')
    try {
      setSetores(await listarSetoresPorFilial(filial.id))
    } catch {
      setErro('Não foi possível carregar os setores desta filial.')
    }
    setCarregando(false)
  }

  useEffect(() => {
    if (aberto) carregarSetores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  const handleAdicionarSetor = async (e) => {
    e.preventDefault()
    if (!novoSetorNome.trim()) return
    try {
      const novo = await criarSetor(empresa.id, filial.id, novoSetorNome)
      setSetores((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovoSetorNome('')
    } catch {
      setErro('Não foi possível criar o setor.')
    }
  }

  const handleUsarListaPadrao = async () => {
    try {
      const novos = await criarSetoresPadrao(empresa.id, filial.id)
      setSetores((prev) => [...prev, ...novos].sort((a, b) => a.nome.localeCompare(b.nome)))
    } catch {
      setErro('Não foi possível adicionar a lista padrão.')
    }
  }

  const handleRemoverSetor = async (id) => {
    try {
      await removerSetor(id)
      setSetores((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setErro('Não foi possível remover o setor.')
    }
  }

  const copiarLink = () => {
    navigator.clipboard?.writeText(linkPublico)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 1800)
  }

  return (
    <div className="bg-canvas rounded-xl border border-teal-100 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <div>
          <p className="font-medium text-ink text-sm">{filial.nome}</p>
          <p className="text-xs text-muted font-mono">/f/{filial.slug}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/f/${filial.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold bg-coral-500 hover:bg-coral-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Abrir formulário ↗
          </a>
          <button
            onClick={copiarLink}
            className="text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {linkCopiado ? 'Copiado ✓' : 'Copiar link'}
          </button>
          <button
            onClick={() => setAberto((v) => !v)}
            className="text-xs font-semibold text-muted hover:text-ink px-2 py-1.5"
          >
            {aberto ? 'Ocultar setores ▲' : 'Setores ▾'}
          </button>
          <button
            onClick={() => onRemoverFilial(filial.id)}
            className="text-xs font-semibold text-coral-600 hover:text-coral-700 px-1"
          >
            Remover
          </button>
        </div>
      </div>

      {aberto && (
        <div className="border-t border-teal-100 p-3">
          {erro && <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-lg px-3 py-2 text-xs mb-2">{erro}</div>}

          {carregando ? (
            <p className="text-xs text-muted">Carregando...</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {setores.length === 0 && (
                  <p className="text-xs text-muted italic">Nenhum setor cadastrado para esta filial ainda.</p>
                )}
                {setores.map((s) => (
                  <span
                    key={s.id}
                    className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-full pl-3 pr-2 py-1 text-xs"
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

              <div className="flex flex-wrap items-center gap-2">
                <form onSubmit={handleAdicionarSetor} className="flex gap-2 flex-1 min-w-[220px]">
                  <input
                    value={novoSetorNome}
                    onChange={(e) => setNovoSetorNome(e.target.value)}
                    placeholder="Nome do setor (ex: Produção)"
                    className="flex-1 rounded-lg border border-teal-100 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="text-xs font-semibold bg-teal-700 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Adicionar
                  </button>
                </form>
                {setores.length === 0 && (
                  <button
                    onClick={handleUsarListaPadrao}
                    className="text-xs font-semibold bg-white border border-teal-200 hover:bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Usar lista padrão
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
