-- Script SQL para alterar a constraint da coluna reconciliation_status
-- Para permitir os valores: 'pending', 'matched', 'transferencia', 'sugerido', 'sem_match', 'conciliado', 'ignorado', 'desvinculado'

-- 1. Primeiro, vamos verificar se existe uma constraint atual
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'bank_transactions' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%reconciliation_status%';

-- 2. Remover a constraint existente (se existir)
-- NOTA: O nome da constraint pode variar, substitua pelo nome real encontrado acima
-- ALTER TABLE bank_transactions DROP CONSTRAINT bank_transactions_reconciliation_status_check;

-- 3. Adicionar nova constraint com todos os valores necessários
ALTER TABLE bank_transactions 
ADD CONSTRAINT bank_transactions_reconciliation_status_check 
CHECK (reconciliation_status IN (
    'pending',
    'matched', 
    'transferencia',
    'sugerido', 
    'sem_match',
    'conciliado',
    'ignorado',
    'desvinculado'
));

-- 4. Verificar se a nova constraint foi criada
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'bank_transactions' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%reconciliation_status%';

-- 5. Testar os novos valores (opcional)
-- UPDATE bank_transactions SET reconciliation_status = 'transferencia' WHERE id = (SELECT id FROM bank_transactions LIMIT 1);
-- UPDATE bank_transactions SET reconciliation_status = 'sugerido' WHERE id = (SELECT id FROM bank_transactions LIMIT 1); 
-- UPDATE bank_transactions SET reconciliation_status = 'sem_match' WHERE id = (SELECT id FROM bank_transactions LIMIT 1);
-- UPDATE bank_transactions SET reconciliation_status = 'conciliado' WHERE id = (SELECT id FROM bank_transactions LIMIT 1);
