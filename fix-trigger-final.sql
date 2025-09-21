-- Script para corrigir o trigger que está causando o erro
-- "record 'new' has no field 'data_atualizacao'"

-- 1. Primeiro, vamos verificar o trigger e função atuais
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'templates_importacao';

-- 2. Ver o código da função problemática
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- 3. CORRIGIR a função para usar o campo correto (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- CORREÇÃO: usar updated_at em vez de data_atualizacao
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recriar o trigger para garantir que está usando a função corrigida
DROP TRIGGER IF EXISTS update_templates_importacao_updated_at ON templates_importacao;

CREATE TRIGGER update_templates_importacao_updated_at
    BEFORE UPDATE ON templates_importacao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Testar se a correção funcionou
-- Esta atualização deve funcionar agora
UPDATE templates_importacao 
SET nome = nome || ' (teste)'
WHERE id = (SELECT id FROM templates_importacao LIMIT 1);

-- 6. Verificar se o updated_at foi atualizado automaticamente
SELECT 
    id,
    nome,
    updated_at,
    created_at
FROM templates_importacao 
ORDER BY updated_at DESC 
LIMIT 3;

-- 7. Limpar o teste (reverter o nome)
UPDATE templates_importacao 
SET nome = REPLACE(nome, ' (teste)', '')
WHERE nome LIKE '% (teste)';

SELECT '✅ Trigger corrigido com sucesso!' as resultado;