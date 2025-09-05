-- Script SQL para limpar matches duplicados
-- Garantir que cada transação bancária tenha apenas 1 match

-- 1. Identificar transações bancárias com múltiplos matches
SELECT 
  bank_transaction_id,
  COUNT(*) as match_count,
  array_agg(id ORDER BY 
    CASE WHEN status = 'confirmed' THEN 1 ELSE 2 END,
    created_at DESC
  ) as match_ids
FROM transaction_matches 
GROUP BY bank_transaction_id 
HAVING COUNT(*) > 1;

-- 2. Remover matches duplicados (manter apenas o melhor de cada transação)
WITH duplicates AS (
  SELECT 
    bank_transaction_id,
    array_agg(id ORDER BY 
      CASE WHEN status = 'confirmed' THEN 1 ELSE 2 END,
      created_at DESC
    ) as match_ids
  FROM transaction_matches 
  GROUP BY bank_transaction_id 
  HAVING COUNT(*) > 1
),
matches_to_delete AS (
  SELECT unnest(match_ids[2:]) as id_to_delete
  FROM duplicates
)
DELETE FROM transaction_matches 
WHERE id IN (SELECT id_to_delete FROM matches_to_delete);

-- 3. Atualizar status das transações bancárias baseado nos matches restantes
UPDATE bank_transactions 
SET 
  reconciliation_status = CASE 
    WHEN tm.status = 'confirmed' THEN 'conciliado'
    WHEN tm.status = 'suggested' THEN 'sugerido'
    ELSE 'pending'
  END,
  status_conciliacao = CASE 
    WHEN tm.status = 'confirmed' THEN 'conciliado'
    ELSE 'pendente'
  END,
  matched_lancamento_id = CASE 
    WHEN tm.status = 'confirmed' THEN tm.system_transaction_id
    ELSE NULL
  END,
  match_confidence = tm.match_score,
  updated_at = NOW()
FROM transaction_matches tm
WHERE bank_transactions.id = tm.bank_transaction_id;

-- 4. Verificação final - deve retornar 0 duplicatas
SELECT 
  bank_transaction_id,
  COUNT(*) as match_count
FROM transaction_matches 
GROUP BY bank_transaction_id 
HAVING COUNT(*) > 1;

-- 5. Estatísticas finais
SELECT 
  COUNT(*) as total_matches,
  COUNT(DISTINCT bank_transaction_id) as unique_bank_transactions,
  COUNT(*) - COUNT(DISTINCT bank_transaction_id) as duplicates_remaining
FROM transaction_matches;

-- 6. Contagem por status
SELECT 
  status,
  COUNT(*) as count
FROM transaction_matches 
GROUP BY status
ORDER BY count DESC;
