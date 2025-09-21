-- Script para renomear a coluna updated_at para data_atualizacao
-- Isso alinha a estrutura da tabela com o que o trigger espera

-- 1. Verificar a estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'templates_importacao' 
  AND table_schema = 'public'
  AND column_name IN ('updated_at', 'data_atualizacao')
ORDER BY column_name;

-- 2. Renomear a coluna updated_at para data_atualizacao
ALTER TABLE templates_importacao 
RENAME COLUMN updated_at TO data_atualizacao;

-- 3. Verificar se a alteração foi feita corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'templates_importacao' 
  AND table_schema = 'public'
  AND column_name = 'data_atualizacao';

-- 4. Testar se o trigger agora funciona
UPDATE templates_importacao 
SET nome = nome 
WHERE id = (SELECT id FROM templates_importacao LIMIT 1);

-- 5. Verificar se data_atualizacao foi atualizada automaticamente
SELECT 
    id,
    nome,
    data_atualizacao,
    created_at
FROM templates_importacao 
ORDER BY data_atualizacao DESC 
LIMIT 3;

SELECT '✅ Coluna renomeada com sucesso! O trigger agora deve funcionar.' as resultado;