import { NIVEIS_ESTRESSE } from '../data/stressLevels'

/**
 * Seletor de nível de estresse (1 a 5).
 * Botões grandes, pensados para uso em tablet no chão de fábrica.
 */
export default function StressSelector({ valor, onChange }) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {NIVEIS_ESTRESSE.map((nivel) => {
          const selecionado = valor === nivel.valor
          return (
            <button
              key={nivel.valor}
              type="button"
              onClick={() => onChange(nivel.valor)}
              aria-pressed={selecionado}
              aria-label={`${nivel.valor} — ${nivel.nome}`}
              className="rounded-2xl border-2 py-3 px-1 transition-all duration-150 flex flex-col items-center gap-1"
              style={{
                borderColor: selecionado ? nivel.cor : '#E2E8F0',
                backgroundColor: selecionado ? nivel.corClara : '#FFFFFF',
                transform: selecionado ? 'scale(1.04)' : 'scale(1)'
              }}
            >
              <span
                className="font-display font-extrabold text-xl leading-none"
                style={{ color: selecionado ? nivel.cor : '#94A3B8' }}
              >
                {nivel.valor}
              </span>
              <span
                className="text-[10px] sm:text-xs font-medium leading-tight text-center"
                style={{ color: selecionado ? nivel.cor : '#64706F' }}
              >
                {nivel.nome}
              </span>
            </button>
          )
        })}
      </div>

      {/* Escala visual de referência */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-[11px] text-muted">← Menos estresse</span>
        <span className="text-[11px] text-muted">Mais estresse →</span>
      </div>
    </div>
  )
}
