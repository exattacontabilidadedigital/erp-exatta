-- Este script deve ser executado APÓS criar os usuários via Auth API
-- Ele apenas insere dados complementares caso o script JS não funcione

-- Primeiro, verificar se existem usuários no auth.users
-- Se existirem, inserir dados complementares na tabela usuarios

-- Exemplo de inserção manual (substitua os IDs pelos IDs reais dos usuários criados)
-- INSERT INTO usuarios (id, email, nome, telefone, cargo, role, empresa_id, ativo, permissoes)
-- SELECT 
--   auth.uid,
--   auth.email,
--   'Nome do Usuário',
--   '(11) 99999-9999',
--   'Cargo',
--   'admin',
--   (SELECT id FROM empresas LIMIT 1),
--   true,
--   '{"lancamentos": {"criar": true, "editar": true, "excluir": true, "visualizar": true}}'::jsonb
-- FROM auth.users auth
-- WHERE auth.email = 'admin@techsolutions.com.br'
-- AND NOT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.id);

-- Para verificar usuários criados no auth:
-- SELECT id, email, created_at FROM auth.users;
