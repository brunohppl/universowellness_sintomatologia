// Os 10 segmentos corporais do formulário original "Sintomatologia Dolorosa".
export const AREAS_DOR = [
  { codigo: 1, nome: 'Cabeça' },
  { codigo: 2, nome: 'Pescoço' },
  { codigo: 3, nome: 'Ombro' },
  { codigo: 4, nome: 'Braço e antebraço' },
  { codigo: 5, nome: 'Costas (alta) "dorsais"' },
  { codigo: 6, nome: 'Costas (baixa) "lombares"' },
  { codigo: 7, nome: 'Mão e punho' },
  { codigo: 8, nome: 'Coxa e joelho' },
  { codigo: 9, nome: 'Perna' },
  { codigo: 10, nome: 'Pé e tornozelo' }
]

export const getAreaNome = (codigo) =>
  AREAS_DOR.find((a) => a.codigo === codigo)?.nome ?? `Área ${codigo}`
