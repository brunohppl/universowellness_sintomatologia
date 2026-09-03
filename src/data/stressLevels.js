// Escala de estresse percebido — 1 a 5.
export const NIVEIS_ESTRESSE = [
  { valor: 1, nome: 'Muito baixo', cor: '#3A9D72', corClara: '#E6F4EE' },
  { valor: 2, nome: 'Baixo',       cor: '#7FB069', corClara: '#EDF5E8' },
  { valor: 3, nome: 'Moderado',    cor: '#E5B34B', corClara: '#FBF3E0' },
  { valor: 4, nome: 'Alto',        cor: '#E8874A', corClara: '#FCEEE4' },
  { valor: 5, nome: 'Muito alto',  cor: '#D9534F', corClara: '#FAE8E7' }
]

export const getEstresseNome = (valor) =>
  NIVEIS_ESTRESSE.find((n) => n.valor === valor)?.nome ?? '—'

export const getEstresseCor = (valor) =>
  NIVEIS_ESTRESSE.find((n) => n.valor === valor)?.cor ?? '#94A3B8'
