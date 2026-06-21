// Os 10 segmentos corporais do formulário original "Sintomatologia Dolorosa".
// `views` indica em qual(is) diagrama(s) o segmento aparece como região clicável.
export const AREAS_DOR = [
  { codigo: 1, nome: 'Cabeça', views: ['frente'] },
  { codigo: 2, nome: 'Pescoço', views: ['frente', 'verso'] },
  { codigo: 3, nome: 'Ombro', views: ['frente', 'verso'] },
  { codigo: 4, nome: 'Braço e antebraço', views: ['frente', 'verso'] },
  { codigo: 5, nome: 'Costas (alta) "dorsais"', views: ['verso'] },
  { codigo: 6, nome: 'Costas (baixa) "lombares"', views: ['verso'] },
  { codigo: 7, nome: 'Mão e punho', views: ['frente', 'verso'] },
  { codigo: 8, nome: 'Coxa e joelho', views: ['frente', 'verso'] },
  { codigo: 9, nome: 'Perna', views: ['frente', 'verso'] },
  { codigo: 10, nome: 'Pé e tornozelo', views: ['frente', 'verso'] }
]

export const getAreaNome = (codigo) =>
  AREAS_DOR.find((a) => a.codigo === codigo)?.nome ?? `Área ${codigo}`
