-- SCRIPT SIMPLES PARA CORRIGIR CONSTRAINT
-- Execute cada comando separadamente

-- 1. Remover constraint existente
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_reconciliation_status_check;

-- 2. Criar nova constraint
ALTER TABLE bank_transactions 
ADD CONSTRAINT bank_transactions_reconciliation_status_check 
CHECK (reconciliation_status IN ('pending', 'transferencia', 'sugerido', 'sem_match'));

-- 3. Verificar se funcionou
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'bank_transactions' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%reconciliation_status%';
