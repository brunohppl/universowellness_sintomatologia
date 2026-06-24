-- ============================================================================
-- Universo Wellness · Sintomatologia Dolorosa
-- Execute este script completo no Supabase: Project > SQL Editor > New query
--
-- Este arquivo é seguro de rodar mais de uma vez (todos os comandos usam
-- "if not exists" / equivalentes), então se você já rodou uma versão
-- anterior, pode simplesmente colar este arquivo inteiro de novo.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Empresas (clientes da Universo Wellness, ex: Coca-Cola, Gillette, Colgate)
-- ----------------------------------------------------------------------------
create table if not exists public.empresas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  logo_url   text,                 -- opcional: URL de uma imagem do logo do cliente
  created_at timestamptz not null default now()
);
comment on table public.empresas is 'Empresas clientes da Universo Wellness (ex: Coca-Cola, Gillette).';

-- ----------------------------------------------------------------------------
-- Filiais (unidades/fábricas de cada empresa cliente)
-- ----------------------------------------------------------------------------
create table if not exists public.filiais (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  slug       text not null unique, -- usado na URL pública: /f/<slug>
  created_at timestamptz not null default now()
);
comment on table public.filiais is 'Unidades/fábricas de cada empresa. O slug define o link público do formulário.';
create index if not exists filiais_empresa_idx on public.filiais (empresa_id);

-- ----------------------------------------------------------------------------
-- Setores (lista de departamentos, gerenciada por empresa)
-- ----------------------------------------------------------------------------
create table if not exists public.setores (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  filial_id  uuid references public.filiais(id) on delete cascade,
  nome       text not null,
  created_at timestamptz not null default now()
);
comment on table public.setores is 'Lista de setores/departamentos, agora configurável por filial (cada filial tem sua própria lista).';
create index if not exists setores_empresa_idx on public.setores (empresa_id);
create index if not exists setores_filial_idx on public.setores (filial_id);

-- Se você rodou uma versão anterior deste schema, esta linha adiciona a
-- coluna que faltava sem apagar nenhum setor já cadastrado:
alter table public.setores add column if not exists filial_id uuid references public.filiais(id) on delete cascade;

-- ----------------------------------------------------------------------------
-- Tabela principal: cada linha é um registro preenchido por um trabalhador
-- ----------------------------------------------------------------------------
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  matricula     text,
  setor         text not null,
  data_registro date not null default current_date,
  areas_dor     integer[] not null default '{}',
  observacoes   text,
  created_at    timestamptz not null default now()
);

-- Colunas novas para suportar múltiplos clientes/filiais (seguro rodar de novo)
alter table public.submissions add column if not exists empresa_id uuid references public.empresas(id);
alter table public.submissions add column if not exists filial_id uuid references public.filiais(id);

comment on table public.submissions is
  'Registros de sintomatologia dolorosa (desconforto corporal) preenchidos pelos trabalhadores.';
comment on column public.submissions.areas_dor is
  '1 Cabeça, 2 Pescoço, 3 Ombro, 4 Braço e antebraço, 5 Costas alta (dorsais), 6 Costas baixa (lombares), 7 Mão e punho, 8 Coxa e joelho, 9 Perna, 10 Pé e tornozelo';
comment on column public.submissions.empresa_id is
  'Cliente (empresa) ao qual este registro pertence. Nulo = formulário genérico/teste em "/".';
comment on column public.submissions.filial_id is
  'Filial específica onde o registro foi feito. Nulo = formulário genérico/teste em "/".';

create index if not exists submissions_data_idx on public.submissions (data_registro);
create index if not exists submissions_setor_idx on public.submissions (setor);
create index if not exists submissions_areas_idx on public.submissions using gin (areas_dor);
create index if not exists submissions_empresa_idx on public.submissions (empresa_id);
create index if not exists submissions_filial_idx on public.submissions (filial_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.submissions enable row level security;
alter table public.empresas enable row level security;
alter table public.filiais enable row level security;
alter table public.setores enable row level security;

-- submissions: qualquer um insere, só autenticado lê (sem update/delete por design)
drop policy if exists "Trabalhadores podem enviar registros" on public.submissions;
create policy "Trabalhadores podem enviar registros"
  on public.submissions for insert to anon, authenticated with check (true);

drop policy if exists "Equipe autenticada pode ler registros" on public.submissions;
create policy "Equipe autenticada pode ler registros"
  on public.submissions for select to authenticated using (true);

-- empresas/filiais/setores: leitura pública (o formulário precisa carregar o
-- nome/logo da empresa e a lista de setores antes do login existir), mas
-- só a equipe autenticada da Universo Wellness pode criar/editar/remover.
drop policy if exists "Leitura pública de empresas" on public.empresas;
create policy "Leitura pública de empresas" on public.empresas for select to anon, authenticated using (true);
drop policy if exists "Equipe gerencia empresas" on public.empresas;
create policy "Equipe gerencia empresas" on public.empresas for all to authenticated using (true) with check (true);

drop policy if exists "Leitura pública de filiais" on public.filiais;
create policy "Leitura pública de filiais" on public.filiais for select to anon, authenticated using (true);
drop policy if exists "Equipe gerencia filiais" on public.filiais;
create policy "Equipe gerencia filiais" on public.filiais for all to authenticated using (true) with check (true);

drop policy if exists "Leitura pública de setores" on public.setores;
create policy "Leitura pública de setores" on public.setores for select to anon, authenticated using (true);
drop policy if exists "Equipe gerencia setores" on public.setores;
create policy "Equipe gerencia setores" on public.setores for all to authenticated using (true) with check (true);

-- ============================================================================
-- Próximos passos:
-- 1. Crie pelo menos um usuário da equipe em Authentication > Users > Add user.
-- 2. Faça login em /admin, abra "Clientes" e cadastre cada empresa, suas
--    filiais (cada uma gera um link único, ex: seusite.com/f/coca-cola-sp)
--    e a lista de setores daquela empresa.
-- ============================================================================
