-- ============================================================================
-- Universo Wellness · Sintomatologia Dolorosa
-- Execute este script completo no Supabase: Project > SQL Editor > New query
-- ============================================================================

-- Extensão para gerar UUIDs (já vem habilitada na maioria dos projetos Supabase)
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tabela principal: cada linha é um registro preenchido por um trabalhador
-- ----------------------------------------------------------------------------
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  matricula     text,                          -- "CR" no formulário original (opcional)
  setor         text not null,                 -- departamento / setor da fábrica
  data_registro date not null default current_date,
  areas_dor     integer[] not null default '{}', -- códigos 1-10, ver tabela de referência abaixo
  observacoes   text,
  created_at    timestamptz not null default now()
);

comment on table public.submissions is
  'Registros de sintomatologia dolorosa (desconforto corporal) preenchidos pelos trabalhadores.';
comment on column public.submissions.areas_dor is
  '1 Cabeça, 2 Pescoço, 3 Ombro, 4 Braço e antebraço, 5 Costas alta (dorsais), 6 Costas baixa (lombares), 7 Mão e punho, 8 Coxa e joelho, 9 Perna, 10 Pé e tornozelo';

-- Índices para acelerar os filtros mais comuns do painel
create index if not exists submissions_data_idx on public.submissions (data_registro);
create index if not exists submissions_setor_idx on public.submissions (setor);
create index if not exists submissions_areas_idx on public.submissions using gin (areas_dor);

-- ----------------------------------------------------------------------------
-- Row Level Security
--   - Qualquer pessoa (papel "anon", usado pelo formulário público) pode INSERIR
--     um registro, mas NUNCA ler, alterar ou apagar dados existentes.
--   - Apenas usuários autenticados (contas criadas no Supabase Auth para a
--     equipe de RH / Saúde e Segurança) podem ler os dados, no painel admin.
-- ----------------------------------------------------------------------------
alter table public.submissions enable row level security;

drop policy if exists "Trabalhadores podem enviar registros" on public.submissions;
create policy "Trabalhadores podem enviar registros"
  on public.submissions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Equipe autenticada pode ler registros" on public.submissions;
create policy "Equipe autenticada pode ler registros"
  on public.submissions
  for select
  to authenticated
  using (true);

-- Nenhuma policy de UPDATE/DELETE é criada de propósito: por padrão, com RLS
-- habilitado e sem policy correspondente, ninguém pode alterar ou apagar
-- registros pela API pública. Isso preserva a integridade do histórico.
-- Se precisar corrigir um registro manualmente, faça isso pelo Table Editor
-- do Supabase (autenticado como dono do projeto), que ignora RLS.

-- ============================================================================
-- Próximo passo: crie pelo menos um usuário para a equipe em
-- Authentication > Users > Add user (e-mail + senha), e use esse login na
-- tela /admin/login do aplicativo.
-- ============================================================================
