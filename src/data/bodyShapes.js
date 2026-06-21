// Mapa corporal: uma silhueta humana (puramente ilustrativa, sem interação)
// + pequenos marcadores circulares clicáveis sobre os pontos do corpo,
// no mesmo estilo de referência usado em fichas de avaliação de dor
// (silhueta cinza + marcadores coloridos sobre cada região).
//
// viewBox "0 0 240 580". Lado esquerdo é desenhado explicitamente;
// o lado direito é a mesma forma espelhada (ver BodyMap.jsx).

export const VIEW_BOX = '0 0 240 580'

// --- Silhueta (decorativa, não-interativa) ------------------------------
// Formas do lado esquerdo + centrais. As bilaterais são espelhadas no render.
export const SILHOUETTE = {
  center: [
    { shape: 'ellipse', cx: 120, cy: 46, rx: 26, ry: 32 }, // cabeça
    { shape: 'rect', x: 104, y: 70, w: 32, h: 26, rx: 12 }, // pescoço
    {
      shape: 'path',
      d: 'M90,86 C70,86 50,93 44,106 C39,132 54,172 75,202 C67,228 60,252 64,277 C66,287 70,293 78,293 L162,293 C170,293 174,287 176,277 C180,252 173,228 165,202 C186,172 201,132 196,106 C190,93 170,86 150,86 Z'
    } // tronco
  ],
  left: [
    {
      shape: 'path',
      d: 'M72,108 C50,100 40,96 38,99 C30,142 26,182 28,222 C29,252 31,282 34,302 L62,300 C60,272 58,242 58,217 C57,182 60,146 72,108 Z'
    }, // braço e antebraço
    { shape: 'ellipse', cx: 47, cy: 314, rx: 20, ry: 25 }, // mão
    {
      shape: 'path',
      d: 'M116,291 C100,291 83,291 79,295 C74,340 70,400 76,460 C78,490 80,511 84,521 L104,519 C102,491 100,461 98,431 C96,381 98,330 116,291 Z'
    }, // coxa, joelho e perna
    { shape: 'ellipse', cx: 92, cy: 535, rx: 28, ry: 16 } // pé
  ]
}

// --- Marcadores (interativos, 1 código de área cada) ---------------------
// codigo: 1 Cabeça · 2 Pescoço · 3 Ombro · 4 Braço e antebraço ·
// 5 Costas alta · 6 Costas baixa · 7 Mão e punho · 8 Coxa e joelho ·
// 9 Perna · 10 Pé e tornozelo
export const MARKERS = [
  { codigo: 1, cx: 120, cy: 44, r: 13 },
  { codigo: 2, cx: 120, cy: 80, r: 11 },
  { codigo: 3, cx: 58, cy: 101, r: 14 },
  { codigo: 3, cx: 182, cy: 101, r: 14 },
  { codigo: 5, cx: 120, cy: 142, r: 17 },
  { codigo: 6, cx: 120, cy: 232, r: 17 },
  { codigo: 4, cx: 41, cy: 192, r: 13 },
  { codigo: 4, cx: 199, cy: 192, r: 13 },
  { codigo: 7, cx: 47, cy: 314, r: 13 },
  { codigo: 7, cx: 193, cy: 314, r: 13 },
  { codigo: 8, cx: 90, cy: 400, r: 15 },
  { codigo: 8, cx: 150, cy: 400, r: 15 },
  { codigo: 9, cx: 88, cy: 478, r: 13 },
  { codigo: 9, cx: 152, cy: 478, r: 13 },
  { codigo: 10, cx: 92, cy: 535, r: 14 },
  { codigo: 10, cx: 148, cy: 535, r: 14 }
]
