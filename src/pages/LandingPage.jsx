import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarEmpresas, listarFiliaisPorEmpresa } from '../lib/empresas'

export default function LandingPage() {
  const navigate = useNavigate()

  const [empresas, setEmpresas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [empresaSelecionada, setEmpresaSelecionada] = useState(null)
  const [filiais, setFiliais] = useState([])
  const [carregandoFiliais, setCarregandoFiliais] = useState(false)

  useEffect(() => {
    listarEmpresas()
      .then((data) => {
        setEmpresas(data)
        // If there's only one company, skip straight to branch selection
        if (data.length === 1) setEmpresaSelecionada(data[0])
      })
      .catch(() => setErro('Não foi possível carregar as empresas. Verifique a conexão.'))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    if (!empresaSelecionada) return
    setCarregandoFiliais(true)
    setFiliais([])
    listarFiliaisPorEmpresa(empresaSelecionada.id)
      .then((data) => {
        setFiliais(data)
        // If only one branch, go straight to the form
        if (data.length === 1) navigate(`/f/${data[0].slug}`)
      })
      .catch(() => setErro('Não foi possível carregar as filiais.'))
      .finally(() => setCarregandoFiliais(false))
  }, [empresaSelecionada, navigate])

  const handleVoltarEmpresas = () => {
    setEmpresaSelecionada(null)
    setFiliais([])
    setErro('')
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <img
          src="/logo-universo-wellness.png"
          alt="Universo Wellness"
          className="h-7 object-contain"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <a href="/admin" className="text-xs text-muted hover:text-ink underline">
          Acesso da equipe
        </a>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
              Sintomatologia Dolorosa
            </h1>
            <p className="text-muted mt-2">
              {!empresaSelecionada
                ? 'Selecione sua empresa para começar.'
                : `Selecione sua filial em ${empresaSelecionada.nome}.`}
            </p>
          </div>

          {erro && (
            <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-2xl px-4 py-3 text-sm mb-6 text-center">
              {erro}
            </div>
          )}

          {/* Step 1 — choose company */}
          {!empresaSelecionada && (
            <>
              {carregando ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-card h-20 animate-pulse" />
                  ))}
                </div>
              ) : empresas.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-card p-8 text-center">
                  <p className="text-muted">
                    Nenhuma empresa cadastrada ainda.
                  </p>
                  <a href="/admin/clientes" className="text-sm text-teal-700 underline mt-2 inline-block">
                    Cadastrar empresas
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {empresas.map((empresa) => (
                    <button
                      key={empresa.id}
                      onClick={() => setEmpresaSelecionada(empresa)}
                      className="w-full bg-white rounded-2xl shadow-card hover:shadow-lg border border-transparent hover:border-teal-200 p-5 flex items-center gap-4 text-left transition-all duration-150 group"
                    >
                      {empresa.logo_url ? (
                        <img
                          src={empresa.logo_url}
                          alt={empresa.nome}
                          className="h-10 max-w-[80px] object-contain flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-teal-50 grid place-items-center text-teal-700 font-display font-bold text-lg flex-shrink-0">
                          {empresa.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-display font-semibold text-ink text-lg group-hover:text-teal-700 transition-colors">
                        {empresa.nome}
                      </span>
                      <span className="ml-auto text-muted text-xl group-hover:text-teal-500 transition-colors">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2 — choose branch */}
          {empresaSelecionada && (
            <>
              <button
                onClick={handleVoltarEmpresas}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4 transition-colors"
              >
                ← Voltar
              </button>

              {/* Company header */}
              <div className="bg-white rounded-2xl shadow-card p-4 mb-4 flex items-center gap-3">
                {empresaSelecionada.logo_url ? (
                  <img
                    src={empresaSelecionada.logo_url}
                    alt={empresaSelecionada.nome}
                    className="h-8 max-w-[72px] object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-teal-50 grid place-items-center text-teal-700 font-bold text-sm flex-shrink-0">
                    {empresaSelecionada.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-display font-semibold text-ink">{empresaSelecionada.nome}</span>
              </div>

              {carregandoFiliais ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-card h-16 animate-pulse" />
                  ))}
                </div>
              ) : filiais.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-card p-8 text-center">
                  <p className="text-muted text-sm">
                    Nenhuma filial cadastrada para esta empresa ainda.
                  </p>
                  <a href="/admin/clientes" className="text-sm text-teal-700 underline mt-2 inline-block">
                    Cadastrar filiais
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {filiais.map((filial) => (
                    <button
                      key={filial.id}
                      onClick={() => navigate(`/f/${filial.slug}`)}
                      className="w-full bg-white rounded-2xl shadow-card hover:shadow-lg border border-transparent hover:border-teal-200 p-5 flex items-center gap-4 text-left transition-all duration-150 group"
                    >
                      <div className="h-9 w-9 rounded-xl bg-coral-50 grid place-items-center text-coral-600 flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-display font-semibold text-ink group-hover:text-teal-700 transition-colors">
                          {filial.nome}
                        </p>
                        <p className="text-xs text-muted font-mono mt-0.5">/f/{filial.slug}</p>
                      </div>
                      <span className="text-muted text-xl group-hover:text-teal-500 transition-colors">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-muted">
        Universo Wellness · Sintomatologia Dolorosa
      </footer>
    </div>
  )
}
