import { useState } from 'react'
import { SILHOUETTE, MARKERS, VIEW_BOX } from '../data/bodyShapes'
import { getAreaNome } from '../data/painAreas'

const renderSilhouetteShape = (shape, key) => {
  const common = { key, fill: '#B8C6CB', stroke: 'none' }
  if (shape.shape === 'ellipse') {
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />
  }
  if (shape.shape === 'rect') {
    return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />
  }
  return <path d={shape.d} {...common} />
}

/**
 * Mapa corporal: silhueta humana ilustrativa + marcadores circulares
 * clicáveis sobre as 10 regiões do formulário.
 * props:
 *  - selected: Set<number>
 *  - onToggle: (codigo) => void
 */
export default function BodyMap({ selected, onToggle }) {
  const [pings, setPings] = useState([])
  const [hovered, setHovered] = useState(null)

  const handleClick = (marker) => {
    const id = `${marker.codigo}-${Date.now()}-${Math.random()}`
    setPings((p) => [...p, { id, x: marker.cx, y: marker.cy }])
    setTimeout(() => setPings((p) => p.filter((ping) => ping.id !== id)), 900)
    onToggle(marker.codigo)
  }

  const renderMarker = (marker, i) => {
    const isSelected = selected.has(marker.codigo)
    const isHovered = hovered === `${marker.cx}-${marker.cy}`
    const fill = isSelected ? '#E8714A' : isHovered ? '#CFE6FB' : '#FFFFFF'
    const stroke = isSelected ? '#B3492B' : '#4090D1'

    return (
      <circle
        key={i}
        cx={marker.cx}
        cy={marker.cy}
        r={marker.r}
        fill={fill}
        stroke={stroke}
        strokeWidth={isSelected ? 2.5 : 2}
        className="transition-colors duration-150 cursor-pointer"
        onClick={() => handleClick(marker)}
        onMouseEnter={() => setHovered(`${marker.cx}-${marker.cy}`)}
        onMouseLeave={() => setHovered(null)}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={getAreaNome(marker.codigo)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick(marker)
          }
        }}
      />
    )
  }

  return (
    <svg
      viewBox={VIEW_BOX}
      className="w-full h-full max-h-[70vh] mx-auto select-none touch-manipulation"
      aria-label="Diagrama do corpo humano"
    >
      {/* Silhueta: centro (não espelhado) */}
      {SILHOUETTE.center.map((s, i) => renderSilhouetteShape(s, `c-${i}`))}
      {/* Silhueta: lado esquerdo */}
      {SILHOUETTE.left.map((s, i) => renderSilhouetteShape(s, `l-${i}`))}
      {/* Silhueta: lado direito (espelhado) */}
      <g transform="translate(240,0) scale(-1,1)">
        {SILHOUETTE.left.map((s, i) => renderSilhouetteShape(s, `r-${i}`))}
      </g>

      {/* Marcadores clicáveis */}
      {MARKERS.map(renderMarker)}

      {pings.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={10}
          fill="#E8714A"
          className="animate-pulseRing pointer-events-none"
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        />
      ))}
    </svg>
  )
}
