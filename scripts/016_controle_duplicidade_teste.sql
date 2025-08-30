-- =========================================================
-- SCRIPT DE TESTE - CONTROLE DE DUPLICIDADE (SIMPLIFICADO)
-- Versão que verifica e adiciona apenas campos essenciais
-- =========================================================

-- 1. Verificar e adicionar campo status_conciliacao na tabela bank_transactions
-- =========================================================

DO $$ 
BEGIN
    -- Verificar se a tabela bank_transactions existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_transactions') THEN
        
        -- Adicionar campo de status se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bank_transactions' 
            AND column_name = 'status_conciliacao'
        ) THEN
            ALTER TABLE bank_transactions ADD COLUMN status_conciliacao VARCHAR(20) DEFAULT 'pendente';
            RAISE NOTICE '✅ Campo status_conciliacao adicionado à tabela bank_transactions';
        ELSE
            RAISE NOTICE '⚠️ Campo status_conciliacao já existe na tabela bank_transactions';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Tabela bank_transactions não encontrada';
    END IF;
END $$;

-- 2. Adicionar constraint se não existir
-- =========================================================

DO $$
BEGIN
    -- Verificar se constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'chk_status_conciliacao'
    ) THEN
        ALTER TABLE bank_transactions 
        ADD CONSTRAINT chk_status_conciliacao 
        CHECK (status_conciliacao IN ('pendente', 'conciliado', 'ignorado'));
        RAISE NOTICE '✅ Constraint chk_status_conciliacao adicionada';
    ELSE
        RAISE NOTICE '⚠️ Constraint chk_status_conciliacao já existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao adicionar constraint: %', SQLERRM;
END $$;

-- 3. Adicionar índices essenciais
-- =========================================================

-- Índice para status de conciliação
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status 
ON bank_transactions(status_conciliacao);

-- Índice único para FIT_ID + conta (se não existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_transactions') THEN
        -- Remover índice antigo se existir
        DROP INDEX IF EXISTS idx_bank_transactions_fit_id;
        
        -- Criar novo índice único
        CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_fit_id_conta 
        ON bank_transactions(fit_id, conta_bancaria_id) 
        WHERE fit_id IS NOT NULL;
        
        RAISE NOTICE '✅ Índice único criado para fit_id + conta_bancaria_id';
    END IF;
END $$;

-- 4. Verificar e adicionar campos na tabela bank_statements
-- =========================================================

DO $$ 
BEGIN
    -- Verificar se a tabela bank_statements existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_statements') THEN
        
        -- Adicionar campo arquivo_hash se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bank_statements' 
            AND column_name = 'arquivo_hash'
        ) THEN
            ALTER TABLE bank_statements ADD COLUMN arquivo_hash VARCHAR(64);
            RAISE NOTICE '✅ Campo arquivo_hash adicionado à tabela bank_statements';
        ELSE
            RAISE NOTICE '⚠️ Campo arquivo_hash já existe na tabela bank_statements';
        END IF;
        
        -- Adicionar campo nome_arquivo_original se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bank_statements' 
            AND column_name = 'nome_arquivo_original'
        ) THEN
            ALTER TABLE bank_statements ADD COLUMN nome_arquivo_original VARCHAR(255);
            RAISE NOTICE '✅ Campo nome_arquivo_original adicionado à tabela bank_statements';
        ELSE
            RAISE NOTICE '⚠️ Campo nome_arquivo_original já existe na tabela bank_statements';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Tabela bank_statements não encontrada';
    END IF;
END $$;

-- 5. Criar função simples para verificar duplicidade
-- =========================================================

CREATE OR REPLACE FUNCTION check_duplicate_ofx_import_simple(
    p_arquivo_hash VARCHAR(64),
    p_conta_bancaria_id UUID
)
RETURNS TABLE (
    is_duplicate BOOLEAN,
    existing_import_id UUID,
    message TEXT
) AS $$
DECLARE
    existing_record RECORD;
BEGIN
    -- Verificar se já existe importação com mesmo hash
    SELECT id INTO existing_record
    FROM bank_statements 
    WHERE arquivo_hash = p_arquivo_hash 
    AND conta_bancaria_id = p_conta_bancaria_id
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT 
            TRUE,
            existing_record.id,
            'Arquivo OFX já foi importado anteriormente'::TEXT;
    ELSE
        RETURN QUERY SELECT 
            FALSE,
            NULL::UUID,
            'Arquivo OFX não encontrado, pode prosseguir com a importação'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar função para verificar transações duplicadas
-- =========================================================

CREATE OR REPLACE FUNCTION check_duplicate_transactions_simple(
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

-- 7. Teste básico das funções
-- =========================================================

DO $$
DECLARE
    test_result RECORD;
BEGIN
    RAISE NOTICE '🧪 Testando função check_duplicate_ofx_import_simple...';
    
    -- Teste com hash inexistente
    SELECT * INTO test_result 
    FROM check_duplicate_ofx_import_simple(
        'test_hash_123', 
        'ffffffff-ffff-ffff-ffff-ffffffffffff'::UUID
    ) 
    LIMIT 1;
    
    IF test_result.is_duplicate = FALSE THEN
        RAISE NOTICE '✅ Função check_duplicate_ofx_import_simple funcionando corretamente';
    ELSE
        RAISE NOTICE '❌ Erro na função check_duplicate_ofx_import_simple';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro no teste: %', SQLERRM;
END $$;

-- =========================================================
-- ✅ SCRIPT DE TESTE CONCLUÍDO
-- =========================================================

SELECT 
    'CONTROLE DE DUPLICIDADE - TESTE BÁSICO CONCLUÍDO' as status,
    'Verificar mensagens acima para status de cada operação' as instrucoes;
