// Funções de acesso a dados para empresas (clientes), filiais e setores.
// Centralizado aqui para ser usado tanto no formulário público quanto no
// painel de administração de clientes.
import { supabase } from './supabaseClient'

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

export async function listarSetoresPorEmpresa(empresaId) {
  const { data, error } = await supabase
    .from('setores')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

// Busca uma filial pelo slug da URL pública, já trazendo os dados da empresa
// e a lista de setores daquela empresa em uma única chamada.
export async function buscarFilialPorSlug(slug) {
  const { data: filial, error } = await supabase
    .from('filiais')
    .select('*, empresas(*)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!filial) return null

  const setores = await listarSetoresPorEmpresa(filial.empresa_id)
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

export async function criarSetor(empresaId, nome) {
  const { data, error } = await supabase
    .from('setores')
    .insert({ empresa_id: empresaId, nome: nome.trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removerSetor(id) {
  const { error } = await supabase.from('setores').delete().eq('id', id)
  if (error) throw error
}
