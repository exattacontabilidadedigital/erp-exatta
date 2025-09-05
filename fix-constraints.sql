-- Script SQL para corrigir constraints da tabela bank_transactions

-- 1. Remover constraints antigas se existirem
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_reconciliation_status_check;
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_status_conciliacao_check;

-- 2. Corrigir valores inválidos existentes antes de criar constraints

-- Corrigir reconciliation_status: garantir que só tenha valores válidos
UPDATE bank_transactions 
SET reconciliation_status = 'sem_match' 
WHERE reconciliation_status NOT IN ('sugerido', 'transferencia', 'sem_match') 
   OR reconciliation_status IS NULL;

-- Corrigir status_conciliacao: garantir que só tenha valores válidos  
UPDATE bank_transactions 
SET status_conciliacao = 'pendente' 
WHERE status_conciliacao NOT IN ('pendente', 'conciliado', 'desconciliado', 'desvinculado', 'ignorado') 
   OR status_conciliacao IS NULL;

-- 3. Criar as constraints corretas

-- Constraint para reconciliation_status (classificação automática do matching)
ALTER TABLE bank_transactions 
ADD CONSTRAINT bank_transactions_reconciliation_status_check 
CHECK (reconciliation_status IN ('sugerido', 'transferencia', 'sem_match'));

-- Constraint para status_conciliacao (ações do usuário nos botões)
ALTER TABLE bank_transactions 
ADD CONSTRAINT bank_transactions_status_conciliacao_check 
CHECK (status_conciliacao IN ('pendente', 'conciliado', 'desconciliado', 'desvinculado', 'ignorado'));

-- 4. Verificar se as constraints foram criadas
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname LIKE '%bank_transactions_%status%';
