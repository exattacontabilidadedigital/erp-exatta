-- =====================================
-- CORREÇÃO DEFINITIVA PARA DUPLICATAS
-- Adicionar constraints UNIQUE na tabela transaction_matches
-- =====================================

-- 1. Primeiro, limpar duplicatas existentes mantendo apenas o mais antigo
WITH ranked_matches AS (
  SELECT 
    id,
    bank_transaction_id,
    system_transaction_id,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY system_transaction_id 
      ORDER BY 
        CASE WHEN status = 'confirmed' THEN 1 ELSE 2 END,
        created_at ASC
    ) as rn_system,
    ROW_NUMBER() OVER (
      PARTITION BY bank_transaction_id 
      ORDER BY 
        CASE WHEN status = 'confirmed' THEN 1 ELSE 2 END,
        created_at ASC
    ) as rn_bank
  FROM transaction_matches
)
DELETE FROM transaction_matches 
WHERE id IN (
  SELECT id FROM ranked_matches 
  WHERE rn_system > 1 OR rn_bank > 1
);

-- 2. Adicionar constraint UNIQUE para system_transaction_id + status = 'confirmed'
-- Isso permite apenas UM match confirmado por lançamento do sistema
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_unique_system_confirmed
ON transaction_matches (system_transaction_id) 
WHERE status = 'confirmed';

-- 3. Adicionar constraint UNIQUE para bank_transaction_id + status = 'confirmed'  
-- Isso permite apenas UM match confirmado por transação bancária
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_unique_bank_confirmed
ON transaction_matches (bank_transaction_id) 
WHERE status = 'confirmed';

-- 4. Adicionar constraint para evitar duplicatas do mesmo par
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_unique_pair
ON transaction_matches (bank_transaction_id, system_transaction_id);

-- 5. Comentários explicativos
COMMENT ON INDEX idx_unique_system_confirmed IS 'Garante que cada lançamento do sistema tenha apenas um match confirmado';
COMMENT ON INDEX idx_unique_bank_confirmed IS 'Garante que cada transação bancária tenha apenas um match confirmado';
COMMENT ON INDEX idx_unique_pair IS 'Garante que não existam pares duplicados na tabela';
