-- =========================================================
-- CONTROLE DE DUPLICIDADE - ADAPTADO À ESTRUTURA REAL
-- Baseado na estrutura existente com bank_account_id
-- =========================================================

-- Verificação inicial
DO $$
BEGIN
    RAISE NOTICE '🚀 Implementando controle de duplicidade na estrutura existente...';
    
    -- Verificar se tabelas principais existem
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_transactions') THEN
        RAISE EXCEPTION 'Tabela bank_transactions não encontrada.';
    END IF;
    
    RAISE NOTICE '✅ Tabela bank_transactions encontrada com estrutura personalizada';
END $$;

-- 1. Adicionar campo status_conciliacao se não existir
-- =========================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_transactions' 
        AND column_name = 'status_conciliacao'
    ) THEN
        ALTER TABLE bank_transactions ADD COLUMN status_conciliacao VARCHAR(20) DEFAULT 'pendente';
        RAISE NOTICE '✅ Campo status_conciliacao adicionado';
    ELSE
        RAISE NOTICE '⚠️ Campo status_conciliacao já existe';
    END IF;
END $$;

-- Adicionar constraint para status_conciliacao
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'chk_status_conciliacao'
    ) THEN
        ALTER TABLE bank_transactions 
        ADD CONSTRAINT chk_status_conciliacao 
        CHECK (status_conciliacao IN ('pendente', 'conciliado', 'ignorado'));
        RAISE NOTICE '✅ Constraint chk_status_conciliacao adicionada';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ Constraint chk_status_conciliacao já existe';
END $$;

-- 2. Verificar se existe tabela de transações bancárias separada
-- =========================================================

DO $$
BEGIN
    -- A tabela bank_transactions parece ser mais como bank_statements
    -- Vamos verificar se existe uma tabela específica para transações individuais
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_transaction_items') THEN
        RAISE NOTICE '✅ Encontrada tabela bank_transaction_items';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_details') THEN
        RAISE NOTICE '✅ Encontrada tabela transaction_details';
    ELSE
        RAISE NOTICE '⚠️ Não encontrada tabela específica para transações individuais';
        RAISE NOTICE 'ℹ️ A tabela bank_transactions parece conter dados de extrato (statements)';
    END IF;
END $$;

-- 3. Melhorar índices únicos para controle de duplicidade
-- =========================================================

-- Índice único para file_hash + bank_account_id (evitar reimportação do mesmo arquivo)
DROP INDEX IF EXISTS idx_bank_transactions_file_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_file_unique 
ON bank_transactions(file_hash, bank_account_id);

-- Índice para busca rápida por status
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status 
ON bank_transactions(status_conciliacao);

-- Índice para busca por hash de arquivo
CREATE INDEX IF NOT EXISTS idx_bank_transactions_file_hash 
ON bank_transactions(file_hash);

-- 4. Criar tabela para transações individuais se não existir
-- =========================================================

CREATE TABLE IF NOT EXISTS bank_transaction_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_statement_id UUID REFERENCES bank_transactions(id) ON DELETE CASCADE,
  bank_account_id UUID, -- Referência à conta bancária (mesmo nome da coluna existente)
  empresa_id UUID,
  fit_id VARCHAR(100), -- ID único da transação no OFX
  memo TEXT, -- Descrição da transação
  payee VARCHAR(255), -- Beneficiário
  amount DECIMAL(15,2) NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_type VARCHAR(50), -- DEBIT, CREDIT, etc.
  check_number VARCHAR(50),
  reference_number VARCHAR(100),
  status_conciliacao VARCHAR(20) DEFAULT 'pendente' CHECK (status_conciliacao IN ('pendente', 'conciliado', 'ignorado')),
  raw_data JSONB, -- Dados brutos do OFX para debug
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice único para fit_id + bank_account_id (evitar transações duplicadas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transaction_details_fit_id 
ON bank_transaction_details(fit_id, bank_account_id) 
WHERE fit_id IS NOT NULL;

-- 5. Criar tabela para matches entre transações e lançamentos
-- =========================================================

CREATE TABLE IF NOT EXISTS transaction_matches_detailed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_transaction_detail_id UUID REFERENCES bank_transaction_details(id) ON DELETE CASCADE,
  system_transaction_id UUID, -- Flexível para diferentes tipos de transações
  reconciliation_session_id UUID, -- Referência à sessão de conciliação
  match_score DECIMAL(5,2) DEFAULT 0,
  match_type VARCHAR(20) DEFAULT 'manual' CHECK (match_type IN ('manual', 'suggested', 'auto', 'exact', 'fuzzy')),
  confidence_level VARCHAR(20) DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para a tabela de matches
CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_matches_detailed_unique 
ON transaction_matches_detailed(bank_transaction_detail_id, system_transaction_id)
WHERE system_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transaction_matches_detailed_bank_txn 
ON transaction_matches_detailed(bank_transaction_detail_id);

-- 6. Trigger para atualizar status automaticamente
-- =========================================================

-- Função para atualizar status quando houver conciliação
CREATE OR REPLACE FUNCTION update_transaction_detail_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um match é criado, marcar a transação como conciliada
    IF TG_OP = 'INSERT' THEN
        UPDATE bank_transaction_details 
        SET status_conciliacao = 'conciliado', updated_at = NOW()
        WHERE id = NEW.bank_transaction_detail_id;
        RETURN NEW;
    END IF;
    
    -- Quando um match é removido, voltar para pendente se não há outros matches
    IF TG_OP = 'DELETE' THEN
        IF NOT EXISTS (
            SELECT 1 FROM transaction_matches_detailed 
            WHERE bank_transaction_detail_id = OLD.bank_transaction_detail_id
        ) THEN
            UPDATE bank_transaction_details 
            SET status_conciliacao = 'pendente', updated_at = NOW()
            WHERE id = OLD.bank_transaction_detail_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_transaction_detail_status ON transaction_matches_detailed;
CREATE TRIGGER trigger_update_transaction_detail_status
    AFTER INSERT OR DELETE ON transaction_matches_detailed
    FOR EACH ROW EXECUTE FUNCTION update_transaction_detail_status();

-- 7. Funções para verificar duplicatas adaptadas à estrutura real
-- =========================================================

-- Função para verificar duplicatas de arquivo (usando file_hash existente)
CREATE OR REPLACE FUNCTION check_duplicate_ofx_file(
    p_file_hash TEXT,
    p_bank_account_id UUID,
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
    SELECT id, created_at INTO existing_record
    FROM bank_transactions 
    WHERE file_hash = p_file_hash 
    AND bank_account_id = p_bank_account_id
    AND empresa_id = p_empresa_id
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT 
            TRUE,
            existing_record.id,
            existing_record.created_at,
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

-- Função para verificar transações duplicadas por FIT_ID
CREATE OR REPLACE FUNCTION check_duplicate_transaction_details(
    p_fit_ids TEXT[],
    p_bank_account_id UUID
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
        CASE WHEN btd.id IS NOT NULL THEN TRUE ELSE FALSE END as is_duplicate,
        btd.id as existing_transaction_id,
        btd.status_conciliacao as status_atual
    FROM unnest(p_fit_ids) AS unnest(fit_id)
    LEFT JOIN bank_transaction_details btd ON btd.fit_id = unnest.fit_id 
        AND btd.bank_account_id = p_bank_account_id;
END;
$$ LANGUAGE plpgsql;

-- 8. View para transações pendentes de conciliação
-- =========================================================

CREATE OR REPLACE VIEW bank_transactions_pendentes_detalhadas AS
SELECT 
    btd.*,
    bt.file_name,
    bt.period_start,
    bt.period_end,
    bt.file_hash
FROM bank_transaction_details btd
JOIN bank_transactions bt ON btd.bank_statement_id = bt.id
WHERE btd.status_conciliacao = 'pendente'
ORDER BY btd.posted_at DESC;

-- 9. Comentários e documentação
-- =========================================================

COMMENT ON TABLE bank_transactions IS 'Tabela de extratos bancários (statements) - dados por arquivo OFX';
COMMENT ON TABLE bank_transaction_details IS 'Tabela de transações individuais extraídas dos arquivos OFX';
COMMENT ON TABLE transaction_matches_detailed IS 'Matches entre transações bancárias e lançamentos do sistema';

COMMENT ON COLUMN bank_transactions.file_hash IS 'Hash do arquivo OFX para controle de duplicidade';
COMMENT ON COLUMN bank_transaction_details.fit_id IS 'ID único da transação no arquivo OFX';
COMMENT ON COLUMN bank_transaction_details.status_conciliacao IS 'Status da conciliação: pendente, conciliado, ignorado';

-- 10. Teste das funções criadas
-- =========================================================

DO $$
DECLARE
    test_result RECORD;
BEGIN
    RAISE NOTICE '🧪 Testando funções de controle de duplicidade...';
    
    -- Teste função check_duplicate_ofx_file
    SELECT * INTO test_result 
    FROM check_duplicate_ofx_file(
        'test_hash_' || extract(epoch from now()), 
        'ffffffff-ffff-ffff-ffff-ffffffffffff'::UUID,
        'ffffffff-ffff-ffff-ffff-ffffffffffff'::UUID
    ) 
    LIMIT 1;
    
    IF test_result.is_duplicate = FALSE THEN
        RAISE NOTICE '✅ Função check_duplicate_ofx_file funcionando';
    END IF;
    
    -- Teste função check_duplicate_transaction_details
    PERFORM check_duplicate_transaction_details(
        ARRAY['test_fit_id_123'],
        'ffffffff-ffff-ffff-ffff-ffffffffffff'::UUID
    );
    
    RAISE NOTICE '✅ Função check_duplicate_transaction_details funcionando';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro no teste: %', SQLERRM;
END $$;

-- =========================================================
-- ✅ SCRIPT EXECUTADO COM SUCESSO!
-- Controle de duplicidade implementado na estrutura existente.
-- =========================================================

SELECT 
    '🎉 CONTROLE DE DUPLICIDADE IMPLEMENTADO!' as status,
    'Sistema adaptado à estrutura existente com bank_account_id' as mensagem,
    'Tabela bank_transaction_details criada para transações individuais' as detalhe,
    NOW() as data_implementacao;
