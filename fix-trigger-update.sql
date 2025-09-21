-- Script para corrigir o trigger que está causando erro
-- O trigger está tentando usar 'data_atualizacao' mas a coluna é 'updated_at'

-- 1. Primeiro vamos ver os triggers existentes
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'templates_importacao';

-- 2. Ver a função que está causando problema
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- 3. Recriar a função corrigida
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Verificar se o trigger existe e recriá-lo se necessário
DROP TRIGGER IF EXISTS update_templates_importacao_updated_at ON templates_importacao;

CREATE TRIGGER update_templates_importacao_updated_at
    BEFORE UPDATE ON templates_importacao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Agora fazer a atualização que estava falhando
UPDATE templates_importacao 
SET empresa_id = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'
WHERE id = '8216991b-d47d-467d-9185-88818b0722dd';

-- 6. Verificar o resultado
SELECT 
    id,
    nome,
    empresa_id,
    categoria,
    updated_at
FROM templates_importacao 
WHERE empresa_id = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'
ORDER BY nome;