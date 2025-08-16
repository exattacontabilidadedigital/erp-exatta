-- Script para atualizar usuário existente no Supabase Auth
-- Email: exattagestaocontabil@gmail.com
-- Nova senha: R@102030

-- Primeiro, vamos atualizar o usuário no sistema de auth
UPDATE auth.users 
SET 
  encrypted_password = crypt('R@102030', gen_salt('bf')),
  email_confirmed_at = now(),
  confirmed_at = now(),
  updated_at = now()
WHERE email = 'exattagestaocontabil@gmail.com';

-- Verificar se existe empresa Exatta, se não existir, criar
INSERT INTO empresas (
  id,
  razao_social,
  nome_fantasia,
  cnpj,
  email,
  telefone,
  endereco,
  cidade,
  estado,
  cep,
  regime_tributario,
  ativo,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Exatta Gestão Contábil Ltda',
  'Exatta Contábil',
  '12.345.678/0001-90',
  'contato@exattagestao.com.br',
  '(11) 99999-9999',
  'Rua das Empresas, 123',
  'São Paulo',
  'SP',
  '01234-567',
  'lucro_presumido',
  true,
  now(),
  now()
)
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir ou atualizar usuário na tabela usuarios
INSERT INTO usuarios (
  id,
  nome,
  email,
  telefone,
  cargo,
  role,
  empresa_id,
  permissoes,
  ativo,
  created_at,
  updated_at
)
SELECT 
  au.id,
  'Administrador Exatta',
  'exattagestaocontabil@gmail.com',
  '(11) 99999-9999',
  'Administrador',
  'admin',
  e.id,
  '{"dashboard": true, "lancamentos": true, "contas": true, "plano_contas": true, "centro_custos": true, "relatorios": true, "configuracoes": true, "usuarios": true}'::jsonb,
  true,
  now(),
  now()
FROM auth.users au
CROSS JOIN empresas e
WHERE au.email = 'exattagestaocontabil@gmail.com'
  AND e.cnpj = '12.345.678/0001-90'
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  telefone = EXCLUDED.telefone,
  cargo = EXCLUDED.cargo,
  role = EXCLUDED.role,
  empresa_id = EXCLUDED.empresa_id,
  permissoes = EXCLUDED.permissoes,
  ativo = EXCLUDED.ativo,
  updated_at = now();

-- Verificar se a atualização foi bem-sucedida
SELECT 
  'Usuário atualizado com sucesso!' as status,
  au.email,
  au.email_confirmed_at,
  u.nome,
  u.role,
  e.nome_fantasia as empresa
FROM auth.users au
LEFT JOIN usuarios u ON au.id = u.id
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE au.email = 'exattagestaocontabil@gmail.com';
