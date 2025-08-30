-- =========================================================
-- VERIFICAÇÃO COMPLETA DA ESTRUTURA REAL
-- Para descobrir exatamente quais colunas existem
-- =========================================================

-- 1. Listar estrutura completa de bank_transactions
SELECT 
    '=== ESTRUTURA COMPLETA: bank_transactions ===' as info;

SELECT 
    ordinal_position as pos,
    column_name as coluna,
    data_type as tipo,
    character_maximum_length as tamanho_max,
    is_nullable as nulo,
    column_default as padrao
FROM information_schema.columns 
WHERE table_name = 'bank_transactions'
ORDER BY ordinal_position;

-- 2. Verificar se existem outras tabelas relacionadas
SELECT 
    '=== TABELAS DISPONÍVEIS ===' as info;

SELECT 
    table_name as tabela
FROM information_schema.tables 
WHERE table_name LIKE '%bank%' 
   OR table_name LIKE '%transaction%'
   OR table_name LIKE '%statement%'
ORDER BY table_name;

-- 3. Verificar constraints e índices existentes
SELECT 
    '=== CONSTRAINTS EM bank_transactions ===' as info;

SELECT 
    constraint_name as constraint,
    constraint_type as tipo
FROM information_schema.table_constraints 
WHERE table_name = 'bank_transactions';

-- 4. Verificar índices existentes
SELECT 
    '=== ÍNDICES EM bank_transactions ===' as info;

SELECT 
    indexname as indice,
    indexdef as definicao
FROM pg_indexes 
WHERE tablename = 'bank_transactions';
