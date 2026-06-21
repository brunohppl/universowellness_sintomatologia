import BodyMap from './BodyMap'
import { AREAS_DOR, getAreaNome } from '../data/painAreas'

export default function BodyMapSelector({ selected, onToggle }) {
  return (
    <div>
      <div className="bg-white rounded-3xl shadow-card p-4 sm:p-6">
        <BodyMap selected={selected} onToggle={onToggle} />
      </div>

      <p className="text-center text-sm text-muted mt-3">
        Toque nas áreas do corpo onde sente desconforto. Você pode escolher mais de uma área.
      </p>

      <div className="mt-5">
        <h3 className="font-display font-semibold text-sm text-ink mb-2">
          Áreas selecionadas {selected.size > 0 && <span className="text-coral-600">({selected.size})</span>}
        </h3>
        {selected.size === 0 ? (
          <p className="text-sm text-muted italic">Nenhuma área selecionada ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {AREAS_DOR.filter((a) => selected.has(a.codigo)).map((a) => (
              <button
                key={a.codigo}
                type="button"
                onClick={() => onToggle(a.codigo)}
                className="group flex items-center gap-1.5 bg-coral-50 border border-coral-300 text-coral-700 rounded-full pl-3 pr-2 py-1.5 text-sm font-medium animate-popIn"
                title="Remover esta área"
              >
                {a.nome}
                <span className="w-4 h-4 grid place-items-center rounded-full bg-coral-300 text-white text-[10px] group-hover:bg-coral-600 transition-colors">
                  ×
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { getAreaNome }
