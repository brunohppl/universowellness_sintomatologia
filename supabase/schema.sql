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
-- Perfis de usuário — 4 níveis de acesso
--   worker     (1) — formulários apenas
--   analyst    (2) — + painel de resultados e exportações
--   manager    (3) — + gestão de empresas/filiais/setores
--   superadmin (4) — + gestão de usuários
--
-- A permissão é definido no convite (via /api/invite-user) ou editado directamente
-- na tabela profiles pelo superadmin. O trigger abaixo cria o perfil
-- automaticamente para cada novo usuário adicionado ao Supabase Auth.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'worker',
  created_at timestamptz not null default now()
);

-- Migrar permissões antigos ANTES de adicionar a nova constraint.
-- (se a constraint já existe com os valores antigos, removê-la primeiro)
alter table public.profiles drop constraint if exists profiles_role_check;

-- Converter valores antigos para os novos equivalentes
update public.profiles set role = 'worker'     where role = 'user';
update public.profiles set role = 'superadmin' where role = 'admin';
-- Converter qualquer outro valor inesperado para 'worker'
update public.profiles set role = 'worker'
  where role not in ('worker', 'analyst', 'manager', 'superadmin');

-- Agora é seguro adicionar a nova constraint (todos os valores já são válidos)
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('worker', 'analyst', 'manager', 'superadmin'));

comment on table public.profiles is
  'Permissões dos usuários. worker(1) analyst(2) manager(3) superadmin(4).';

-- Função auxiliar: retorna o nível numérico do usuário actual.
-- Usada nas políticas RLS para evitar repetição.
create or replace function public.my_role_level()
returns int language sql security definer stable as $$
  select case coalesce((select role from public.profiles where id = auth.uid()), 'worker')
    when 'worker'     then 1
    when 'analyst'    then 2
    when 'manager'    then 3
    when 'superadmin' then 4
    else 0
  end
$$;

-- Trigger: cria automaticamente um perfil quando um novo usuário
-- é adicionado ao Supabase Auth. A permissão vem do campo user_metadata.role
-- definido no convite; se ausente, fica 'worker' por omissão.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'worker');
  -- Garantir que só permissões válidos entram na tabela
  if requested_role not in ('worker', 'analyst', 'manager', 'superadmin') then
    requested_role := 'worker';
  end if;
  insert into public.profiles (id, role)
  values (new.id, requested_role)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

-- Cada usuário lê o seu próprio perfil (necessário para o app descobrir a permissão)
drop policy if exists "Usuário lê o próprio perfil" on public.profiles;
create policy "Usuário lê o próprio perfil"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

-- Superadmin lê todos os perfis (página de usuários)
drop policy if exists "Superadmin lê todos os perfis" on public.profiles;
create policy "Superadmin lê todos os perfis"
  on public.profiles for select to authenticated
  using (public.my_role_level() >= 4);

-- Superadmin atualiza permissões (mas não a própria, para evitar bloqueio acidental)
drop policy if exists "Superadmin gere perfis" on public.profiles;
create policy "Superadmin gere perfis"
  on public.profiles for update to authenticated
  using  (public.my_role_level() >= 4 and id <> auth.uid())
  with check (public.my_role_level() >= 4 and id <> auth.uid());

-- Remover políticas antigas se existirem
drop policy if exists "Admin lê todos os perfis" on public.profiles;
drop policy if exists "Admin gere perfis"        on public.profiles;




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
  nome       text not null,
  created_at timestamptz not null default now()
);
comment on table public.setores is 'Lista de setores/departamentos, agora configurável por filial (cada filial tem sua própria lista).';

-- Se você rodou uma versão anterior deste schema (sem filial_id), esta linha
-- adiciona a coluna que faltava sem apagar nenhum setor já cadastrado.
-- Importante: isso roda ANTES dos índices abaixo, porque se a tabela já
-- existia, o "create table if not exists" acima é ignorado e a coluna
-- definida nele nunca seria criada — então ela tem que vir de algum lugar
-- que sempre executa, que é este ALTER TABLE.
alter table public.setores add column if not exists filial_id uuid references public.filiais(id) on delete cascade;

create index if not exists setores_empresa_idx on public.setores (empresa_id);
create index if not exists setores_filial_idx on public.setores (filial_id);

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

-- submissions: QUALQUER pessoa (mesmo sem login) pode enviar um registro —
-- os formulários são públicos, partilhados por link.
-- Apenas analyst (2) e acima podem LER; manager (3) e acima podem excluir.
drop policy if exists "Trabalhadores podem enviar registros" on public.submissions;
create policy "Trabalhadores podem enviar registros"
  on public.submissions for insert to anon, authenticated
  with check (true);

drop policy if exists "Equipe autenticada pode ler registros" on public.submissions;
create policy "Equipe autenticada pode ler registros"
  on public.submissions for select to authenticated
  using (public.my_role_level() >= 2);

drop policy if exists "Gestores podem excluir registros" on public.submissions;
create policy "Gestores podem excluir registros"
  on public.submissions for delete to authenticated
  using (public.my_role_level() >= 3);

-- empresas/filiais/setores: leitura PÚBLICA (o formulário partilhado por link
-- precisa carregar o logo da empresa e a lista de setores sem login);
-- apenas manager (3) e acima podem criar/editar/remover.
drop policy if exists "Leitura pública de empresas" on public.empresas;
drop policy if exists "Leitura autenticada de empresas" on public.empresas;
create policy "Leitura pública de empresas"
  on public.empresas for select to anon, authenticated using (true);

drop policy if exists "Equipe gerencia empresas" on public.empresas;
create policy "Equipe gerencia empresas"
  on public.empresas for all to authenticated
  using  (public.my_role_level() >= 3)
  with check (public.my_role_level() >= 3);

drop policy if exists "Leitura pública de filiais" on public.filiais;
drop policy if exists "Leitura autenticada de filiais" on public.filiais;
create policy "Leitura pública de filiais"
  on public.filiais for select to anon, authenticated using (true);

drop policy if exists "Equipe gerencia filiais" on public.filiais;
create policy "Equipe gerencia filiais"
  on public.filiais for all to authenticated
  using  (public.my_role_level() >= 3)
  with check (public.my_role_level() >= 3);

drop policy if exists "Leitura pública de setores" on public.setores;
drop policy if exists "Leitura autenticada de setores" on public.setores;
create policy "Leitura pública de setores"
  on public.setores for select to anon, authenticated using (true);

drop policy if exists "Equipe gerencia setores" on public.setores;
create policy "Equipe gerencia setores"
  on public.setores for all to authenticated
  using  (public.my_role_level() >= 3)
  with check (public.my_role_level() >= 3);

-- ============================================================================
-- Função: list_user_profiles()
-- Retorna profiles + email de auth.users para superadmins.
-- Usa security definer para poder acessar a auth.users (inacessível via RLS
-- normal). Verifica a permissão do chamador antes de devolver dados.
-- ============================================================================
drop view if exists public.user_profiles;

create or replace function public.list_user_profiles()
returns table(
  id              uuid,
  role            text,
  created_at      timestamptz,
  email           text,
  last_sign_in_at timestamptz,
  invited_at      timestamptz
)
language plpgsql security definer
set search_path = public
as $$
begin
  if public.my_role_level() < 4 then
    raise exception 'Acesso negado: apenas superadmins podem listar usuários.';
  end if;

  return query
    select
      p.id,
      p.role,
      p.created_at,
      u.email,
      u.last_sign_in_at,
      u.invited_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

grant execute on function public.list_user_profiles() to authenticated;

-- ============================================================================
-- Próximos passos:
-- 1. Crie pelo menos um usuário da equipe em Authentication > Users > Add user.
-- 2. Faça login em /admin, abra "Clientes" e cadastre cada empresa, suas
--    filiais (cada uma gera um link único, ex: seusite.com/f/coca-cola-sp)
--    e a lista de setores de cada filial.
-- ============================================================================
