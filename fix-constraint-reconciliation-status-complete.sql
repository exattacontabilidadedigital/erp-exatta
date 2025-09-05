/*
  SCRIPT SQL PARA CORRIGIR CONSTRAINT RECONCILIATION_STATUS
  Execute este script diretamente no SQL Editor do Supabase
*/

-- ==================================================
-- 1. VERIFICAR CONSTRAINT ATUAL
-- ==================================================
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'bank_transactions' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%reconciliation_status%';

-- ==================================================
-- 2. REMOVER CONSTRAINT EXISTENTE
-- ==================================================
-- IMPORTANTE: Substitua o nome da constraint pelo nome real encontrado acima
-- Exemplo: se o nome for "bank_transactions_reconciliation_status_check"

DO $$
BEGIN
    -- Tentar remover as possíveis variações do nome da constraint
    BEGIN
        ALTER TABLE bank_transactions DROP CONSTRAINT bank_transactions_reconciliation_status_check;
        RAISE NOTICE 'Constraint bank_transactions_reconciliation_status_check removida';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Constraint bank_transactions_reconciliation_status_check não encontrada';
    END;
    
    BEGIN
        ALTER TABLE bank_transactions DROP CONSTRAINT chk_bank_transactions_reconciliation_status;
        RAISE NOTICE 'Constraint chk_bank_transactions_reconciliation_status removida';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Constraint chk_bank_transactions_reconciliation_status não encontrada';
    END;
END $$;

-- ==================================================
-- 3. CRIAR NOVA CONSTRAINT OTIMIZADA
-- ==================================================
-- Valores permitidos (SEM 'pending'):
-- 'transferencia' - Transferência detectada
-- 'sugerido' - Sugestão de match
-- 'sem_match' - Sem correspondência

ALTER TABLE bank_transactions 
ADD CONSTRAINT bank_transactions_reconciliation_status_check 
CHECK (reconciliation_status IN (
    'transferencia',
    'sugerido', 
    'sem_match'
));

-- ==================================================
-- 4. VERIFICAR SE A NOVA CONSTRAINT FOI CRIADA
-- ==================================================
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'bank_transactions' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%reconciliation_status%';

-- ==================================================
-- 5. TESTE OPCIONAL - VERIFICAR SE OS VALORES FUNCIONAM
-- ==================================================
-- Descomente e execute uma linha por vez para testar:

-- UPDATE bank_transactions SET reconciliation_status = 'transferencia' WHERE id = (SELECT id FROM bank_transactions LIMIT 1);
-- UPDATE bank_transactions SET reconciliation_status = 'sugerido' WHERE id = (SELECT id FROM bank_transactions LIMIT 1);
-- UPDATE bank_transactions SET reconciliation_status = 'sem_match' WHERE id = (SELECT id FROM bank_transactions LIMIT 1);

-- ==================================================
-- 6. VERIFICAR VALORES ÚNICOS EXISTENTES
-- ==================================================
SELECT DISTINCT reconciliation_status, COUNT(*) as count
FROM bank_transactions 
WHERE reconciliation_status IS NOT NULL
GROUP BY reconciliation_status
ORDER BY reconciliation_status;
