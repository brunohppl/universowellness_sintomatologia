import { useState } from 'react'
import { BODY_SHAPES, VIEW_BOX } from '../data/bodyShapes'
import { getAreaNome } from '../data/painAreas'

/**
 * Mapa corporal clicável (frente ou verso).
 * props:
 *  - view: 'frente' | 'verso'
 *  - selected: Set<number> com os códigos de área selecionados
 *  - onToggle: (codigo) => void
 */
export default function BodyMap({ view, selected, onToggle }) {
  const [pings, setPings] = useState([])
  const [hovered, setHovered] = useState(null)
  const shapes = BODY_SHAPES[view]

  const center = (shape) =>
    shape.shape === 'circle' || shape.shape === 'ellipse'
      ? { x: shape.cx, y: shape.cy }
      : { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 }

  const handleClick = (shape) => {
    if (shape.codigo == null) return
    const { x, y } = center(shape)
    const id = `${shape.codigo}-${Date.now()}-${Math.random()}`
    setPings((p) => [...p, { id, x, y }])
    setTimeout(() => setPings((p) => p.filter((ping) => ping.id !== id)), 900)
    onToggle(shape.codigo)
  }

  const renderShape = (shape, i) => {
    const isSelected = shape.codigo != null && selected.has(shape.codigo)
    const isHovered = shape.codigo != null && hovered === shape.codigo
    const interactive = shape.codigo != null

    const fill = !interactive
      ? '#E4E9E8'
      : isSelected
      ? '#E8714A'
      : isHovered
      ? '#CFE6E4'
      : '#DCE8E7'

    const common = {
      key: i,
      fill,
      stroke: interactive ? (isSelected ? '#B3492B' : '#7FB6B3') : '#CBD5D3',
      strokeWidth: isSelected ? 2 : 1,
      className: interactive
        ? 'transition-colors duration-150 cursor-pointer'
        : '',
      onClick: () => handleClick(shape),
      onMouseEnter: () => interactive && setHovered(shape.codigo),
      onMouseLeave: () => interactive && setHovered(null),
      role: interactive ? 'button' : undefined,
      tabIndex: interactive ? 0 : undefined,
      'aria-pressed': interactive ? isSelected : undefined,
      'aria-label': interactive ? getAreaNome(shape.codigo) : undefined,
      onKeyDown: interactive
        ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClick(shape)
            }
          }
        : undefined
    }

    if (shape.shape === 'rect') {
      return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />
    }
    if (shape.shape === 'circle') {
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />
    }
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />
  }

  return (
    <svg
      viewBox={VIEW_BOX}
      className="w-full h-full max-h-[70vh] mx-auto select-none touch-manipulation"
      aria-label={`Diagrama do corpo humano, vista ${view === 'frente' ? 'frontal' : 'posterior'}`}
    >
      {shapes.map(renderShape)}
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
