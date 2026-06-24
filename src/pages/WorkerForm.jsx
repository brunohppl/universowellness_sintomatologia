import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import BodyMapSelector from '../components/BodyMapSelector'
import { supabase } from '../lib/supabaseClient'
import { buscarFilialPorSlug } from '../lib/empresas'

const SETORES_SUGERIDOS_PADRAO = [
  'Produção',
  'Montagem',
  'Embalagem',
  'Logística',
  'Manutenção',
  'Qualidade',
  'Almoxarifado',
  'Administrativo'
]

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function WorkerForm() {
  const { slug } = useParams()

  // Contexto do cliente/filial (carregado a partir do link, se houver slug)
  const [carregandoContexto, setCarregandoContexto] = useState(Boolean(slug))
  const [contextoInvalido, setContextoInvalido] = useState(false)
  const [empresa, setEmpresa] = useState(null)
  const [filial, setFilial] = useState(null)
  const [setoresCliente, setSetoresCliente] = useState([])

  useEffect(() => {
    if (!slug) return
    let ativo = true
    buscarFilialPorSlug(slug)
      .then((resultado) => {
        if (!ativo) return
        if (!resultado) {
          setContextoInvalido(true)
        } else {
          setEmpresa(resultado.empresa)
          setFilial(resultado.filial)
          setSetoresCliente(resultado.setores)
        }
        setCarregandoContexto(false)
      })
      .catch(() => {
        if (!ativo) return
        setContextoInvalido(true)
        setCarregandoContexto(false)
      })
    return () => {
      ativo = false
    }
  }, [slug])

  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [setor, setSetor] = useState('')
  const [data, setData] = useState(todayISO())
  const [observacoes, setObservacoes] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [semDor, setSemDor] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const toggleArea = (codigo) => {
    setSemDor(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(codigo)) next.delete(codigo)
      else next.add(codigo)
      return next
    })
  }

  const podeEnviar = useMemo(
    () => nome.trim().length > 1 && setor.trim().length > 0 && (semDor || selected.size > 0),
    [nome, setor, semDor, selected]
  )

  const resetar = () => {
    setNome('')
    setMatricula('')
    setSetor('')
    setData(todayISO())
    setObservacoes('')
    setSelected(new Set())
    setSemDor(false)
    setErro('')
    setEnviado(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!podeEnviar) {
      setErro('Preencha nome, setor e marque ao menos uma área (ou "não sinto dor").')
      return
    }
    setErro('')
    setEnviando(true)
    const { error } = await supabase.from('submissions').insert({
      nome: nome.trim(),
      matricula: matricula.trim() || null,
      setor: setor.trim(),
      data_registro: data,
      areas_dor: semDor ? [] : Array.from(selected).sort((a, b) => a - b),
      observacoes: observacoes.trim() || null,
      empresa_id: empresa?.id ?? null,
      filial_id: filial?.id ?? null
    })
    setEnviando(false)
    if (error) {
      setErro('Não foi possível enviar agora. Verifique a conexão e tente novamente.')
      // eslint-disable-next-line no-console
      console.error(error)
      return
    }
    setEnviado(true)
  }

  if (carregandoContexto) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <p className="text-muted">Carregando...</p>
      </div>
    )
  }

  if (contextoInvalido) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas px-4">
        <div className="bg-white rounded-3xl shadow-card p-10 max-w-md text-center">
          <h1 className="font-display font-extrabold text-xl text-ink mb-2">Link não encontrado</h1>
          <p className="text-muted">
            Este link não corresponde a nenhuma filial cadastrada. Confirme o endereço ou contate a equipe da
            Universo Wellness.
          </p>
        </div>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas px-4">
        <div className="bg-white rounded-3xl shadow-card p-10 max-w-md text-center animate-popIn">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-leaf-500 grid place-items-center text-white text-3xl">
            ✓
          </div>
          <h1 className="font-display font-extrabold text-2xl text-ink mb-2">Registro enviado</h1>
          <p className="text-muted mb-8">
            Obrigado, {nome.split(' ')[0]}. Seu registro de hoje foi salvo com sucesso.
          </p>
          <button
            onClick={resetar}
            className="w-full bg-teal-700 hover:bg-teal-600 text-white font-display font-semibold py-3 rounded-2xl transition-colors"
          >
            Registrar outra pessoa
          </button>
        </div>
      </div>
    )
  }

  const setoresParaExibir = empresa ? setoresCliente.map((s) => s.nome) : SETORES_SUGERIDOS_PADRAO

  return (
    <div className="min-h-screen bg-canvas py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          {empresa ? (
            <>
              {empresa.logo_url ? (
                <img src={empresa.logo_url} alt={empresa.nome} className="h-10 mx-auto mb-2 object-contain" />
              ) : (
                <p className="font-display font-extrabold text-2xl text-ink mb-1">{empresa.nome}</p>
              )}
              <p className="text-xs text-muted mb-3">{filial?.nome} · via Universo Wellness</p>
            </>
          ) : (
            <img src="/logo-universo-wellness.png" alt="Universo Wellness" className="h-7 mx-auto mb-3" />
          )}
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">Sintomatologia Dolorosa</h1>
          <p className="text-muted mt-2">Toque no corpo para indicar onde você sente desconforto hoje.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="nome" className="block text-sm font-semibold text-ink mb-1">
                Nome completo
              </label>
              <input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="setor" className="block text-sm font-semibold text-ink mb-1">
                Setor / Departamento
              </label>
              {empresa ? (
                <select
                  id="setor"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none bg-white"
                >
                  <option value="">Selecione...</option>
                  {setoresParaExibir.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    id="setor"
                    value={setor}
                    onChange={(e) => setSetor(e.target.value)}
                    placeholder="Ex: Produção"
                    list="setores"
                    className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none"
                  />
                  <datalist id="setores">
                    {setoresParaExibir.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </>
              )}
            </div>

            <div>
              <label htmlFor="matricula" className="block text-sm font-semibold text-ink mb-1">
                Matrícula / CR <span className="text-muted font-normal">(opcional)</span>
              </label>
              <input
                id="matricula"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: 12345"
                className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="data" className="block text-sm font-semibold text-ink mb-1">
                Data
              </label>
              <input
                id="data"
                type="date"
                value={data}
                max={todayISO()}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-4 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={semDor}
                onChange={(e) => {
                  setSemDor(e.target.checked)
                  if (e.target.checked) setSelected(new Set())
                }}
                className="w-5 h-5 accent-teal-700"
              />
              <span className="text-ink font-medium">Hoje não sinto nenhum desconforto</span>
            </label>

            {!semDor && <BodyMapSelector selected={selected} onToggle={toggleArea} />}
          </div>

          <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6">
            <label htmlFor="obs" className="block text-sm font-semibold text-ink mb-1">
              Observações <span className="text-muted font-normal">(opcional)</span>
            </label>
            <textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Quer descrever melhor o desconforto? (ex: começou esta semana, piora ao final do turno...)"
              className="w-full rounded-xl border border-teal-100 px-4 py-3 text-base focus:border-teal-500 outline-none resize-none"
            />
          </div>

          {erro && (
            <div className="bg-coral-50 border border-coral-300 text-coral-700 rounded-2xl px-4 py-3 text-sm font-medium">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-display font-bold text-lg py-4 rounded-2xl shadow-card transition-colors"
          >
            {enviando ? 'Enviando...' : 'Enviar registro'}
          </button>

          <p className="text-center text-xs text-muted pb-6">
            <a href="/admin" className="underline hover:text-teal-700">
              Acesso da equipe de saúde / RH
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
