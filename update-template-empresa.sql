-- Script para atualizar empresa_id dos templates de importação
-- Execute com cuidado e faça backup antes

-- Primeiro, vamos verificar os dados atuais
SELECT 
    id,
    nome,
    empresa_id,
    categoria,
    created_at
FROM templates_importacao 
WHERE id IN (
    '496d8048-8051-48ee-8bf5-fc758061794f',
    '8216991b-d47d-467d-9185-88818b0722dd'
)
ORDER BY nome;

-- Verificar qual empresa_id usar (do usuário romario.hj2@gmail.com)
SELECT 
    u.id as usuario_id,
    u.email,
    u.nome,
    u.empresa_id,
    e.razao_social,
    e.nome_fantasia
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.email = 'romario.hj2@gmail.com';

-- Atualizar o template "terdfa" para a empresa correta
-- (assumindo que queremos mover para a empresa do romario.hj2@gmail.com)
UPDATE templates_importacao 
SET 
    empresa_id = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'
WHERE id = '8216991b-d47d-467d-9185-88818b0722dd';

-- Verificar se a atualização funcionou
SELECT 
    id,
    nome,
    empresa_id,
    categoria,
    updated_at
FROM templates_importacao 
WHERE id IN (
    '496d8048-8051-48ee-8bf5-fc758061794f',
    '8216991b-d47d-467d-9185-88818b0722dd'
)
ORDER BY nome;

-- Verificar todos os templates da empresa correta
SELECT 
    id,
    nome,
    categoria,
    empresa_id,
    ativo
FROM templates_importacao 
WHERE empresa_id = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'
ORDER BY nome;