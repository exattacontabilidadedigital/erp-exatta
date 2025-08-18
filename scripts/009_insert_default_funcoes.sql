-- Funções padrão do sistema
INSERT INTO funcoes (id, nome, permissoes) VALUES
  (gen_random_uuid(), 'Administrador', ARRAY['dashboard','lancamentos','contas','plano-contas','centro-custos','fluxo-caixa','relatorios','cadastros','usuarios','configuracoes']),
  (gen_random_uuid(), 'Contador', ARRAY['dashboard','lancamentos','contas','plano-contas','centro-custos','fluxo-caixa','relatorios']),
  (gen_random_uuid(), 'Usuário', ARRAY['dashboard','lancamentos','relatorios']),
  (gen_random_uuid(), 'Auditor', ARRAY['dashboard','relatorios','contas','plano-contas','fluxo-caixa']);
