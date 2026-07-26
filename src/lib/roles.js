// Definição centralizada dos papéis de utilizador.
// Qualquer alteração aqui reflecte-se automaticamente em todo o app.

export const ROLES = {
  WORKER:     'worker',     // nível 1 — formulários
  ANALYST:    'analyst',    // nível 2 — + painel de resultados
  MANAGER:    'manager',    // nível 3 — + gestão de empresas/filiais
  SUPERADMIN: 'superadmin'  // nível 4 — + gestão de utilizadores
}

export const ROLE_LEVEL = {
  worker:     1,
  analyst:    2,
  manager:    3,
  superadmin: 4
}

export const ROLE_LABELS = {
  worker:     'Utilizador — apenas formulários',
  analyst:    'Analista — resultados e relatórios',
  manager:    'Gestor — empresas e filiais',
  superadmin: 'Administrador — acesso total'
}

// Retorna true se o papel do utilizador for suficiente para o nível exigido
export function hasLevel(userRole, requiredLevel) {
  return (ROLE_LEVEL[userRole] ?? 0) >= requiredLevel
}

// Atalhos
export const canViewResults  = (role) => hasLevel(role, 2)
export const canManageData   = (role) => hasLevel(role, 3)
export const canManageUsers  = (role) => hasLevel(role, 4)
