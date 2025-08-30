-- =========================================================
-- DIAGNÓSTICO COMPLETO - ESTRUTURA DAS TABELAS
-- Versão que retorna resultados visíveis
-- =========================================================

-- 1. Verificar se tabelas existem
SELECT 
    'bank_transactions' as tabela,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bank_transactions'
    ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status;

-- 2. Verificar se coluna conta_bancaria_id existe
SELECT 
    'conta_bancaria_id' as coluna,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_transactions' 
        AND column_name = 'conta_bancaria_id'
    ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status;

-- 3. Listar TODAS as colunas da tabela bank_transactions
SELECT 
    'ESTRUTURA DA TABELA bank_transactions' as titulo;

SELECT 
    ordinal_position as posicao,
    column_name as coluna,
    data_type as tipo,
    is_nullable as aceita_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'bank_transactions'
ORDER BY ordinal_position;

-- 4. Verificar se o campo status_conciliacao já existe
SELECT 
    'status_conciliacao' as coluna,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_transactions' 
        AND column_name = 'status_conciliacao'
    ) THEN '✅ JÁ EXISTE' ELSE '❌ PRECISA SER CRIADO' END as status;

-- 5. Verificar estrutura da tabela bank_statements também
SELECT 
    'ESTRUTURA DA TABELA bank_statements' as titulo;

SELECT 
    ordinal_position as posicao,
    column_name as coluna,
    data_type as tipo,
    is_nullable as aceita_null
FROM information_schema.columns 
WHERE table_name = 'bank_statements'
ORDER BY ordinal_position;
