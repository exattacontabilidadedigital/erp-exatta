-- Script para atualizar apenas a senha do usuário existente
-- Execute no SQL Editor do Supabase Dashboard

-- Atualizar a senha do usuário existente no sistema de auth
UPDATE auth.users 
SET 
  encrypted_password = crypt('R@102030', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
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
  ativo
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
  true
) ON CONFLICT (cnpj) DO NOTHING;

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
  ativo
) 
SELECT 
  (SELECT id FROM auth.users WHERE email = 'exattagestaocontabil@gmail.com'),
  'Administrador Exatta',
  'exattagestaocontabil@gmail.com',
  '(11) 99999-9999',
  'Administrador',
  'admin',
  (SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-90'),
  '{"dashboard": true, "lancamentos": true, "relatorios": true, "configuracoes": true, "usuarios": true}'::jsonb,
  true
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  telefone = EXCLUDED.telefone,
  cargo = EXCLUDED.cargo,
  role = EXCLUDED.role,
  empresa_id = EXCLUDED.empresa_id,
  permissoes = EXCLUDED.permissoes,
  ativo = EXCLUDED.ativo,
  updated_at = NOW();

-- Verificar se o usuário foi criado/atualizado corretamente
SELECT 
  u.email,
  u.nome,
  u.role,
  e.nome_fantasia as empresa
FROM usuarios u
JOIN empresas e ON u.empresa_id = e.id
WHERE u.email = 'exattagestaocontabil@gmail.com';
