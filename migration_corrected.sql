-- =========================================================
-- MIGRATION CORRIGIDA: Sistema de Múltiplos Matches
-- Versão: 002_v2 (Corrigida)
-- Data: 2025-09-07
-- Descrição: Adiciona suporte para múltiplas seleções persistentes
-- =========================================================

-- ✅ PASSO 1: Adicionar colunas para múltiplos matches na tabela transaction_matches
ALTER TABLE transaction_matches 
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS match_order integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS group_size integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS system_amount decimal(15,2),
ADD COLUMN IF NOT EXISTS bank_amount decimal(15,2),
ADD COLUMN IF NOT EXISTS total_group_amount decimal(15,2);

-- ✅ PASSO 2: Adicionar colunas para múltiplos matches na tabela bank_transactions
-- NOTA: match_type já existe, adicionando apenas as colunas novas
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS matched_amount decimal(15,2),
ADD COLUMN IF NOT EXISTS match_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS primary_lancamento_id uuid,
ADD COLUMN IF NOT EXISTS confidence_level varchar(20);

-- ✅ PASSO 2.1: Atualizar constraint do match_type para incluir 'multiple_transactions'
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_match_type_check;
ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_match_type_check 
CHECK (match_type = ANY (ARRAY['exact'::text, 'fuzzy'::text, 'manual'::text, 'rule'::text, 'multiple_transactions'::text]));

-- ✅ PASSO 3: Adicionar colunas para múltiplos matches na tabela lancamentos
ALTER TABLE lancamentos
ADD COLUMN IF NOT EXISTS bank_transaction_id uuid,
ADD COLUMN IF NOT EXISTS is_multiple_match boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS match_group_size integer DEFAULT 1;

-- ✅ PASSO 4: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transaction_matches_bank_transaction_multiple 
ON transaction_matches(bank_transaction_id, is_primary, match_order);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_multiple_matches 
ON bank_transactions(match_type, match_count, primary_lancamento_id);

CREATE INDEX IF NOT EXISTS idx_lancamentos_multiple_matches 
ON lancamentos(bank_transaction_id, is_multiple_match, match_group_size);

-- ✅ PASSO 5: Criar constraint para garantir apenas um primário por grupo
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_per_bank_transaction
ON transaction_matches(bank_transaction_id, is_primary) 
WHERE is_primary = true;

-- ✅ PASSO 6: Comentários para documentação
COMMENT ON COLUMN transaction_matches.is_primary IS 'Indica se este é o lançamento primário no grupo de múltiplos matches';
COMMENT ON COLUMN transaction_matches.match_order IS 'Ordem do lançamento na seleção múltipla (1, 2, 3...)';
COMMENT ON COLUMN transaction_matches.group_size IS 'Número total de lançamentos no grupo';
COMMENT ON COLUMN transaction_matches.system_amount IS 'Valor individual do lançamento do sistema';
COMMENT ON COLUMN transaction_matches.bank_amount IS 'Valor da transação bancária';
COMMENT ON COLUMN transaction_matches.total_group_amount IS 'Valor total de todos os lançamentos do grupo';

COMMENT ON COLUMN bank_transactions.matched_amount IS 'Valor total dos lançamentos matched';
COMMENT ON COLUMN bank_transactions.match_count IS 'Número de lançamentos matched com esta transação';
COMMENT ON COLUMN bank_transactions.primary_lancamento_id IS 'ID do lançamento marcado como primário';
COMMENT ON COLUMN bank_transactions.confidence_level IS 'Nível de confiança: high, medium, low';

COMMENT ON COLUMN lancamentos.bank_transaction_id IS 'ID da transação bancária associada';
COMMENT ON COLUMN lancamentos.is_multiple_match IS 'Indica se este lançamento faz parte de um match múltiplo';
COMMENT ON COLUMN lancamentos.match_group_size IS 'Tamanho do grupo de match múltiplo';

-- ✅ PASSO 7: Função para validar consistência de grupos múltiplos
CREATE OR REPLACE FUNCTION validate_multiple_match_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que group_size é consistente entre todos os matches do mesmo bank_transaction_id
  IF EXISTS (
    SELECT 1 FROM transaction_matches 
    WHERE bank_transaction_id = NEW.bank_transaction_id 
    AND group_size != NEW.group_size
  ) THEN
    RAISE EXCEPTION 'Inconsistência no group_size para bank_transaction_id %', NEW.bank_transaction_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ PASSO 8: Criar trigger para validação
DROP TRIGGER IF EXISTS trigger_validate_multiple_match_group ON transaction_matches;
CREATE TRIGGER trigger_validate_multiple_match_group
  BEFORE INSERT OR UPDATE ON transaction_matches
  FOR EACH ROW
  EXECUTE FUNCTION validate_multiple_match_group();

-- ✅ PASSO 9: Migrar dados existentes (se houver)
-- Atualizar registros existentes para ter valores padrão corretos
UPDATE transaction_matches 
SET 
  is_primary = true,
  match_order = 1,
  group_size = 1,
  system_amount = (SELECT valor FROM lancamentos WHERE id = transaction_matches.system_transaction_id),
  total_group_amount = (SELECT valor FROM lancamentos WHERE id = transaction_matches.system_transaction_id)
WHERE is_primary IS NULL;

UPDATE bank_transactions 
SET 
  match_count = 1,
  confidence_level = 'medium'
WHERE match_count IS NULL AND id IN (
  SELECT DISTINCT bank_transaction_id FROM transaction_matches
);

UPDATE lancamentos 
SET 
  is_multiple_match = false,
  match_group_size = 1
WHERE is_multiple_match IS NULL;
