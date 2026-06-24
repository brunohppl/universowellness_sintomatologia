// Funções de acesso a dados para empresas (clientes), filiais e setores.
// Setores agora são sempre vinculados a uma filial específica (cada filial
// tem sua própria lista de departamentos).
import { supabase } from './supabaseClient'

export const SETORES_PADRAO_SUGESTAO = [
  'Produção',
  'Montagem',
  'Embalagem',
  'Logística',
  'Manutenção',
  'Qualidade',
  'Almoxarifado',
  'Administrativo'
]

export async function listarEmpresas() {
  const { data, error } = await supabase.from('empresas').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function listarFiliaisPorEmpresa(empresaId) {
  const { data, error } = await supabase
    .from('filiais')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function listarSetoresPorFilial(filialId) {
  const { data, error } = await supabase
    .from('setores')
    .select('*')
    .eq('filial_id', filialId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

// Busca uma filial pelo slug da URL pública, já trazendo os dados da empresa
// e a lista de setores DESSA filial em uma única chamada.
export async function buscarFilialPorSlug(slug) {
  const { data: filial, error } = await supabase
    .from('filiais')
    .select('*, empresas(*)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!filial) return null

  const setores = await listarSetoresPorFilial(filial.id)
  return { filial, empresa: filial.empresas, setores }
}

export function gerarSlug(nomeEmpresa, nomeFilial) {
  const limpar = (s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  return `${limpar(nomeEmpresa)}-${limpar(nomeFilial)}`
}

export async function criarEmpresa(nome, logoUrl) {
  const { data, error } = await supabase
    .from('empresas')
    .insert({ nome: nome.trim(), logo_url: logoUrl?.trim() || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removerEmpresa(id) {
  const { error } = await supabase.from('empresas').delete().eq('id', id)
  if (error) throw error
}

export async function criarFilial(empresaId, nome, slug) {
  const { data, error } = await supabase
    .from('filiais')
    .insert({ empresa_id: empresaId, nome: nome.trim(), slug })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removerFilial(id) {
  const { error } = await supabase.from('filiais').delete().eq('id', id)
  if (error) throw error
}

export async function criarSetor(empresaId, filialId, nome) {
  const { data, error } = await supabase
    .from('setores')
    .insert({ empresa_id: empresaId, filial_id: filialId, nome: nome.trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

// Cria de uma vez a lista padrão de setores sugeridos para uma filial nova
// (atalho para não precisar digitar um por um).
export async function criarSetoresPadrao(empresaId, filialId) {
  const linhas = SETORES_PADRAO_SUGESTAO.map((nome) => ({ empresa_id: empresaId, filial_id: filialId, nome }))
  const { data, error } = await supabase.from('setores').insert(linhas).select()
  if (error) throw error
  return data ?? []
}

export async function removerSetor(id) {
  const { error } = await supabase.from('setores').delete().eq('id', id)
  if (error) throw error
}
