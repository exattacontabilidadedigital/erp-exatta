-- =========================================================
-- SISTEMA DE CONTROLE DE DUPLICIDADE PARA CONCILIAÇÃO
-- Implementa estratégia completa anti-duplicatas
-- =========================================================

-- 1. Melhorar índices únicos para controle de duplicidade
-- =========================================================

-- Criar índice único composto para fit_id + conta_bancaria_id
-- (Evita que a mesma transação OFX seja importada mais de uma vez na mesma conta)
DROP INDEX IF EXISTS idx_bank_transactions_fit_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_fit_id_conta 
ON bank_transactions(fit_id, conta_bancaria_id) 
WHERE fit_id IS NOT NULL;

-- Índice para busca rápida por fit_id
CREATE INDEX IF NOT EXISTS idx_bank_transactions_fit_id_lookup 
ON bank_transactions(fit_id) 
WHERE fit_id IS NOT NULL;

-- 2. Adicionar campo de status na tabela bank_transactions
-- =========================================================

-- Adicionar campo de status para marcar transações já conciliadas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_transactions' 
        AND column_name = 'status_conciliacao'
    ) THEN
        ALTER TABLE bank_transactions ADD COLUMN status_conciliacao VARCHAR(20) DEFAULT 'pendente';
    END IF;
END $$;

-- Valores possíveis: 'pendente', 'conciliado', 'ignorado'
ALTER TABLE bank_transactions 
ADD CONSTRAINT chk_status_conciliacao 
CHECK (status_conciliacao IN ('pendente', 'conciliado', 'ignorado'));

-- Índice para filtrar transações pendentes
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status 
ON bank_transactions(status_conciliacao);

-- 3. Melhorar tabela transaction_matches para evitar duplicação
-- =========================================================

-- Primeiro verificar se a tabela transaction_matches existe, se não, criar
CREATE TABLE IF NOT EXISTS transaction_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_transaction_id UUID REFERENCES bank_transactions(id) ON DELETE CASCADE,
  system_transaction_id UUID, -- Pode referenciar diferentes tabelas dependendo do sistema
  reconciliation_id UUID, -- Referência à sessão de conciliação
  match_score DECIMAL(5,2),
  match_type VARCHAR(20) DEFAULT 'manual' CHECK (match_type IN ('manual', 'suggested', 'auto')),
  confidence_level VARCHAR(20) DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir que não haja matches duplicados
DROP INDEX IF EXISTS idx_transaction_matches_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_matches_unique 
ON transaction_matches(bank_transaction_id, system_transaction_id);

-- Índice para busca por bank_transaction_id
CREATE INDEX IF NOT EXISTS idx_transaction_matches_bank_txn 
ON transaction_matches(bank_transaction_id);

-- Índice para busca por system_transaction_id  
CREATE INDEX IF NOT EXISTS idx_transaction_matches_system_txn 
ON transaction_matches(system_transaction_id);

-- 4. Trigger para atualizar status automaticamente
-- =========================================================

-- Função para atualizar status quando houver conciliação
CREATE OR REPLACE FUNCTION update_bank_transaction_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um match é criado, marcar a transação bancária como conciliada
    IF TG_OP = 'INSERT' THEN
        UPDATE bank_transactions 
        SET status_conciliacao = 'conciliado'
        WHERE id = NEW.bank_transaction_id;
        RETURN NEW;
    END IF;
    
    -- Quando um match é removido, voltar para pendente
    IF TG_OP = 'DELETE' THEN
        -- Verificar se não há outros matches para esta transação
        IF NOT EXISTS (
            SELECT 1 FROM transaction_matches 
            WHERE bank_transaction_id = OLD.bank_transaction_id
        ) THEN
            UPDATE bank_transactions 
            SET status_conciliacao = 'pendente'
            WHERE id = OLD.bank_transaction_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_bank_transaction_status ON transaction_matches;
CREATE TRIGGER trigger_update_bank_transaction_status
    AFTER INSERT OR DELETE ON transaction_matches
    FOR EACH ROW EXECUTE FUNCTION update_bank_transaction_status();

-- 5. Adicionar metadados de importação
-- =========================================================

-- Adicionar campos para rastrear importações duplicadas
DO $$ 
BEGIN
    -- Hash do arquivo OFX para detectar reimportações
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_statements' 
        AND column_name = 'arquivo_hash'
    ) THEN
        ALTER TABLE bank_statements ADD COLUMN arquivo_hash VARCHAR(64);
    END IF;
    
    -- Nome original do arquivo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_statements' 
        AND column_name = 'nome_arquivo_original'
    ) THEN
        ALTER TABLE bank_statements ADD COLUMN nome_arquivo_original VARCHAR(255);
    END IF;
END $$;

-- Índice para busca por hash de arquivo
CREATE INDEX IF NOT EXISTS idx_bank_statements_arquivo_hash 
ON bank_statements(arquivo_hash) 
WHERE arquivo_hash IS NOT NULL;

-- 6. View para transações pendentes de conciliação
-- =========================================================

-- View que mostra apenas transações que precisam ser conciliadas
CREATE OR REPLACE VIEW bank_transactions_pendentes AS
SELECT 
    bt.*,
    bs.data_inicio,
    bs.data_fim,
    bs.arquivo_nome as nome_arquivo_original,
    b.nome as banco_nome,
    cb.conta,
    cb.digito,
    cb.agencia
FROM bank_transactions bt
JOIN bank_statements bs ON bt.bank_statement_id = bs.id
JOIN contas_bancarias cb ON bt.conta_bancaria_id = cb.id
LEFT JOIN bancos b ON cb.banco_id = b.id
WHERE bt.status_conciliacao = 'pendente'
ORDER BY bt.posted_at DESC;

-- 7. Função para verificar duplicatas antes da importação
-- =========================================================

CREATE OR REPLACE FUNCTION check_duplicate_ofx_import(
    p_arquivo_hash VARCHAR(64),
    p_conta_bancaria_id UUID,
    p_empresa_id UUID
)
RETURNS TABLE (
    is_duplicate BOOLEAN,
    existing_import_id UUID,
    existing_import_date TIMESTAMP WITH TIME ZONE,
    message TEXT
) AS $$
DECLARE
    existing_record RECORD;
BEGIN
    -- Verificar se já existe importação com mesmo hash
    SELECT id, data_importacao INTO existing_record
    FROM bank_statements 
    WHERE arquivo_hash = p_arquivo_hash 
    AND conta_bancaria_id = p_conta_bancaria_id
    AND empresa_id = p_empresa_id
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT 
            TRUE,
            existing_record.id,
            existing_record.data_importacao,
            'Arquivo OFX já foi importado anteriormente'::TEXT;
    ELSE
        RETURN QUERY SELECT 
            FALSE,
            NULL::UUID,
            NULL::TIMESTAMP WITH TIME ZONE,
            'Arquivo OFX não encontrado, pode prosseguir com a importação'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Função para verificar transações duplicadas por FIT_ID
-- =========================================================

CREATE OR REPLACE FUNCTION check_duplicate_transactions(
    p_fit_ids TEXT[],
    p_conta_bancaria_id UUID
)
RETURNS TABLE (
    fit_id TEXT,
    is_duplicate BOOLEAN,
    existing_transaction_id UUID,
    status_atual VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest.fit_id,
        CASE WHEN bt.id IS NOT NULL THEN TRUE ELSE FALSE END as is_duplicate,
        bt.id as existing_transaction_id,
        bt.status_conciliacao as status_atual
    FROM unnest(p_fit_ids) AS unnest(fit_id)
    LEFT JOIN bank_transactions bt ON bt.fit_id = unnest.fit_id 
        AND bt.conta_bancaria_id = p_conta_bancaria_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Comentários das tabelas
-- =========================================================

COMMENT ON COLUMN bank_transactions.status_conciliacao IS 'Status da conciliação: pendente, conciliado, ignorado';
COMMENT ON COLUMN bank_transactions.fit_id IS 'ID único da transação no arquivo OFX (Financial Institution Transaction ID)';
COMMENT ON COLUMN bank_statements.arquivo_hash IS 'Hash SHA-256 do arquivo OFX para detectar reimportações';
COMMENT ON COLUMN bank_statements.nome_arquivo_original IS 'Nome original do arquivo OFX importado';

COMMENT ON INDEX idx_bank_transactions_fit_id_conta IS 'Previne importação duplicada da mesma transação OFX na mesma conta';
COMMENT ON VIEW bank_transactions_pendentes IS 'View com transações bancárias que ainda precisam ser conciliadas';

COMMENT ON FUNCTION check_duplicate_ofx_import IS 'Verifica se um arquivo OFX já foi importado anteriormente';
COMMENT ON FUNCTION check_duplicate_transactions IS 'Verifica quais transações (por FIT_ID) já existem no banco';

-- =========================================================
-- Script executado com sucesso!
-- Controle de duplicidade implementado.
-- =========================================================
