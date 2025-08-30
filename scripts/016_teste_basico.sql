-- =========================================================
-- TESTE SIMPLES - CONTROLE DE DUPLICIDADE
-- Versão mínima para identificar problemas específicos
-- =========================================================

-- 1. Verificar estrutura atual
DO $$
DECLARE
    col_exists BOOLEAN;
    tab_exists BOOLEAN;
    col_record RECORD;
BEGIN
    -- Verificar se tabela bank_transactions existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bank_transactions'
    ) INTO tab_exists;
    
    IF NOT tab_exists THEN
        RAISE EXCEPTION 'Tabela bank_transactions não existe!';
    END IF;
    
    -- Verificar se coluna conta_bancaria_id existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_transactions' 
        AND column_name = 'conta_bancaria_id'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ Coluna conta_bancaria_id encontrada';
    ELSE
        RAISE NOTICE '❌ Coluna conta_bancaria_id NÃO encontrada';
        
        -- Listar todas as colunas da tabela
        RAISE NOTICE '📋 Colunas disponíveis em bank_transactions:';
        FOR col_record IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'bank_transactions'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: %', col_record.column_name, col_record.data_type;
        END LOOP;
    END IF;
END $$;

-- 2. Teste simples - adicionar campo status_conciliacao
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_transactions' 
        AND column_name = 'status_conciliacao'
    ) THEN
        ALTER TABLE bank_transactions ADD COLUMN status_conciliacao VARCHAR(20) DEFAULT 'pendente';
        RAISE NOTICE '✅ Campo status_conciliacao adicionado com sucesso';
    ELSE
        RAISE NOTICE '⚠️ Campo status_conciliacao já existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao adicionar status_conciliacao: %', SQLERRM;
END $$;

-- 3. Finalizar teste
SELECT 'Teste básico concluído' as resultado;
