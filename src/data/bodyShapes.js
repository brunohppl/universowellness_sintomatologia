// Definição geométrica das regiões clicáveis do mapa corporal.
// Cada forma tem um `codigo` (1-10, ver painAreas.js) ou null quando é apenas decorativa
// (ex: tronco frontal não é uma região do formulário, só preenche a silhueta).
// Coordenadas pensadas para viewBox "0 0 240 520", mesma figura nas duas views,
// trocando apenas a região central do tronco e a cabeça (codigo 1 só existe na frente).

const shoulders = [
  { codigo: 3, shape: 'rect', x: 38, y: 86, w: 52, h: 36, rx: 16 },
  { codigo: 3, shape: 'rect', x: 150, y: 86, w: 52, h: 36, rx: 16 }
]

const arms = [
  { codigo: 4, shape: 'rect', x: 22, y: 120, w: 36, h: 152, rx: 17 },
  { codigo: 4, shape: 'rect', x: 182, y: 120, w: 36, h: 152, rx: 17 }
]

const hands = [
  { codigo: 7, shape: 'circle', cx: 40, cy: 290, r: 21 },
  { codigo: 7, shape: 'circle', cx: 200, cy: 290, r: 21 }
]

const thighs = [
  { codigo: 8, shape: 'rect', x: 68, y: 240, w: 46, h: 112, rx: 15 },
  { codigo: 8, shape: 'rect', x: 126, y: 240, w: 46, h: 112, rx: 15 }
]

const shins = [
  { codigo: 9, shape: 'rect', x: 70, y: 354, w: 42, h: 112, rx: 15 },
  { codigo: 9, shape: 'rect', x: 128, y: 354, w: 42, h: 112, rx: 15 }
]

const feet = [
  { codigo: 10, shape: 'ellipse', cx: 91, cy: 482, rx: 27, ry: 17 },
  { codigo: 10, shape: 'ellipse', cx: 149, cy: 482, rx: 27, ry: 17 }
]

const neck = [{ codigo: 2, shape: 'rect', x: 102, y: 66, w: 36, h: 22, rx: 7 }]

export const BODY_SHAPES = {
  frente: [
    { codigo: 1, shape: 'ellipse', cx: 120, cy: 40, rx: 29, ry: 33 },
    ...neck,
    ...shoulders,
    { codigo: null, shape: 'rect', x: 94, y: 84, w: 52, h: 158, rx: 12 },
    ...arms,
    ...hands,
    ...thighs,
    ...shins,
    ...feet
  ],
  verso: [
    { codigo: null, shape: 'ellipse', cx: 120, cy: 40, rx: 29, ry: 33 },
    ...neck,
    ...shoulders,
    { codigo: 5, shape: 'rect', x: 94, y: 84, w: 52, h: 78, rx: 12 },
    { codigo: 6, shape: 'rect', x: 94, y: 164, w: 52, h: 78, rx: 12 },
    ...arms,
    ...hands,
    ...thighs,
    ...shins,
    ...feet
  ]
}

export const VIEW_BOX = '0 0 240 520'
