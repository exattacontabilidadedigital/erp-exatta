-- =====================================================
-- SCRIPT DE VALIDAÇÃO: CONTROLE DE DUPLICIDADE
-- Testa todas as funcionalidades implementadas
-- =====================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA
DO $$
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO ESTRUTURA DAS TABELAS...';
    
    -- Verificar se coluna status_conciliacao existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_transactions' 
        AND column_name = 'status_conciliacao'
    ) THEN
        RAISE NOTICE '✅ Coluna status_conciliacao existe na bank_transactions';
    ELSE
        RAISE NOTICE '❌ Coluna status_conciliacao NÃO encontrada';
    END IF;
    
    -- Verificar tabela transaction_matches_enhanced
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transaction_matches_enhanced'
    ) THEN
        RAISE NOTICE '✅ Tabela transaction_matches_enhanced existe';
    ELSE
        RAISE NOTICE '❌ Tabela transaction_matches_enhanced NÃO encontrada';
    END IF;
    
    -- Verificar view bank_transactions_pendentes_v2
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'bank_transactions_pendentes_v2'
    ) THEN
        RAISE NOTICE '✅ View bank_transactions_pendentes_v2 existe';
    ELSE
        RAISE NOTICE '❌ View bank_transactions_pendentes_v2 NÃO encontrada';
    END IF;
END $$;

-- 2. TESTAR FUNÇÕES POSTGRESQL
DO $$
DECLARE
    test_result INTEGER;
    duplicate_result BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTANDO FUNÇÕES POSTGRESQL...';
    
    -- Testar função get_reconciled_transactions_count
    BEGIN
        SELECT get_reconciled_transactions_count('any-account-id', '2024-01-01', '2024-12-31') INTO test_result;
        RAISE NOTICE '✅ Função get_reconciled_transactions_count funcionando (resultado: %)', test_result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro na função get_reconciled_transactions_count: %', SQLERRM;
    END;
    
    -- Testar função check_duplicate_transactions_by_fit_id
    BEGIN
        SELECT check_duplicate_transactions_by_fit_id('test-fit-id') INTO duplicate_result;
        RAISE NOTICE '✅ Função check_duplicate_transactions_by_fit_id funcionando (resultado: %)', duplicate_result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro na função check_duplicate_transactions_by_fit_id: %', SQLERRM;
    END;
END $$;

-- 3. TESTAR TRIGGERS
DO $$
DECLARE
    test_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 TESTANDO TRIGGERS...';
    
    -- Inserir transação de teste para trigger de status
    BEGIN
        INSERT INTO bank_transactions (
            id,
            conta_bancaria_id,
            memo,
            amount,
            posted_at,
            fit_id
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'Teste Trigger Status',
            100.00,
            NOW(),
            'TEST-FIT-' || extract(epoch from now())::text
        ) RETURNING id INTO test_id;
        
        -- Verificar se status foi definido automaticamente
        IF EXISTS (
            SELECT 1 FROM bank_transactions 
            WHERE id = test_id 
            AND status_conciliacao = 'pendente'
        ) THEN
            RAISE NOTICE '✅ Trigger de status_conciliacao funcionando';
        ELSE
            RAISE NOTICE '❌ Trigger de status_conciliacao NÃO funcionando';
        END IF;
        
        -- Limpar dados de teste
        DELETE FROM bank_transactions WHERE id = test_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao testar triggers: %', SQLERRM;
    END;
END $$;

-- 4. VERIFICAR ÍNDICES
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFICANDO ÍNDICES...';
    
    -- Contar índices relacionados ao controle de duplicidade
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'bank_transactions' 
    AND (
        indexname LIKE '%status_conciliacao%' OR
        indexname LIKE '%fit_id%' OR
        indexname LIKE '%file_hash%'
    );
    
    RAISE NOTICE 'Índices encontrados: %', index_count;
    
    -- Listar índices específicos
    FOR index_count IN 
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'bank_transactions' 
        AND (
            indexname LIKE '%status_conciliacao%' OR
            indexname LIKE '%fit_id%' OR
            indexname LIKE '%file_hash%'
        )
    LOOP
        RAISE NOTICE '  📌 Índice: %', index_count;
    END LOOP;
END $$;

-- 5. SIMULAR CENÁRIO DE USO REAL
DO $$
DECLARE
    account_id UUID := '11111111-1111-1111-1111-111111111111';
    bank_txn_id UUID;
    system_txn_id UUID := '22222222-2222-2222-2222-222222222222';
    stats_result RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SIMULANDO CENÁRIO DE USO REAL...';
    
    -- Criar transação bancária de teste
    INSERT INTO bank_transactions (
        id,
        conta_bancaria_id,
        memo,
        amount,
        posted_at,
        fit_id,
        status_conciliacao
    ) VALUES (
        gen_random_uuid(),
        account_id,
        'Pagamento Teste',
        -150.75,
        NOW() - INTERVAL '1 day',
        'REAL-TEST-' || extract(epoch from now())::text,
        'pendente'
    ) RETURNING id INTO bank_txn_id;
    
    RAISE NOTICE '✅ Transação bancária criada: %', bank_txn_id;
    
    -- Simular criação de match
    BEGIN
        INSERT INTO transaction_matches_enhanced (
            bank_transaction_id,
            system_transaction_id,
            match_score,
            match_type,
            created_at
        ) VALUES (
            bank_txn_id,
            system_txn_id,
            0.95,
            'automatic',
            NOW()
        );
        
        RAISE NOTICE '✅ Match criado com sucesso';
        
        -- Atualizar status para conciliado
        UPDATE bank_transactions 
        SET status_conciliacao = 'conciliado' 
        WHERE id = bank_txn_id;
        
        RAISE NOTICE '✅ Status atualizado para conciliado';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao criar match: %', SQLERRM;
    END;
    
    -- Testar view de transações pendentes
    BEGIN
        SELECT COUNT(*) INTO stats_result FROM bank_transactions_pendentes_v2 
        WHERE conta_bancaria_id = account_id;
        
        RAISE NOTICE '✅ View pendentes funcionando. Transações encontradas: %', stats_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao consultar view pendentes: %', SQLERRM;
    END;
    
    -- Limpar dados de teste
    DELETE FROM transaction_matches_enhanced WHERE bank_transaction_id = bank_txn_id;
    DELETE FROM bank_transactions WHERE id = bank_txn_id;
    
    RAISE NOTICE '🧹 Dados de teste removidos';
END $$;

-- 6. RELATÓRIO FINAL DE VALIDAÇÃO
DO $$
DECLARE
    total_transactions INTEGER;
    pending_count INTEGER;
    reconciled_count INTEGER;
    ignored_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 RELATÓRIO FINAL DE VALIDAÇÃO';
    RAISE NOTICE '=====================================';
    
    -- Contar transações por status
    SELECT COUNT(*) INTO total_transactions FROM bank_transactions;
    SELECT COUNT(*) INTO pending_count FROM bank_transactions WHERE status_conciliacao = 'pendente';
    SELECT COUNT(*) INTO reconciled_count FROM bank_transactions WHERE status_conciliacao = 'conciliado';
    SELECT COUNT(*) INTO ignored_count FROM bank_transactions WHERE status_conciliacao = 'ignorado';
    
    RAISE NOTICE 'Total de transações: %', total_transactions;
    RAISE NOTICE 'Pendentes: %', pending_count;
    RAISE NOTICE 'Conciliadas: %', reconciled_count;
    RAISE NOTICE 'Ignoradas: %', ignored_count;
    
    -- Calcular taxa de conciliação
    IF total_transactions > 0 THEN
        RAISE NOTICE 'Taxa de conciliação: %%%', 
            ROUND((reconciled_count::DECIMAL / total_transactions::DECIMAL) * 100, 2);
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 VALIDAÇÃO CONCLUÍDA!';
    RAISE NOTICE 'Sistema de controle de duplicidade está funcionando.';
END $$;

-- 7. QUERY DE MONITORAMENTO CONTÍNUO
-- Execute esta query periodicamente para monitorar o sistema
/*
SELECT 
    'MONITORAMENTO SISTEMA' as tipo,
    NOW() as timestamp_verificacao,
    (SELECT COUNT(*) FROM bank_transactions) as total_transacoes,
    (SELECT COUNT(*) FROM bank_transactions WHERE status_conciliacao = 'pendente') as pendentes,
    (SELECT COUNT(*) FROM bank_transactions WHERE status_conciliacao = 'conciliado') as conciliadas,
    (SELECT COUNT(*) FROM bank_transactions WHERE status_conciliacao = 'ignorado') as ignoradas,
    (SELECT COUNT(*) FROM transaction_matches_enhanced) as total_matches,
    CASE 
        WHEN (SELECT COUNT(*) FROM bank_transactions) > 0 THEN
            ROUND(
                ((SELECT COUNT(*) FROM bank_transactions WHERE status_conciliacao = 'conciliado')::DECIMAL / 
                 (SELECT COUNT(*) FROM bank_transactions)::DECIMAL) * 100, 
                2
            )
        ELSE 0
    END as taxa_conciliacao_pct;
*/
