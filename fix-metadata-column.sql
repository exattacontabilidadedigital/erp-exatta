-- Adicionar coluna metadata à tabela transaction_matches
-- Esta coluna armazenará informações sobre o lançamento primário e outras informações em formato JSON

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    -- Verificar se a coluna metadata existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transaction_matches' 
        AND column_name = 'metadata'
    ) THEN
        -- Adicionar coluna metadata
        ALTER TABLE transaction_matches 
        ADD COLUMN metadata JSONB DEFAULT '{}';
        
        RAISE NOTICE '✅ Coluna metadata adicionada à tabela transaction_matches';
    ELSE
        RAISE NOTICE '⚠️ Coluna metadata já existe na tabela transaction_matches';
    END IF;
END $$;

-- Criar índice para busca eficiente no campo metadata
CREATE INDEX IF NOT EXISTS idx_transaction_matches_metadata 
ON transaction_matches USING GIN (metadata);

-- Comentário explicativo
COMMENT ON COLUMN transaction_matches.metadata IS 'Dados adicionais em formato JSON, incluindo informações sobre lançamento primário';

-- Exemplo de estrutura de metadata:
-- {
--   "is_primary": true,
--   "primary_transaction_id": "uuid-do-lancamento-primario",
--   "match_type": "auto" | "manual" | "suggestion",
--   "confidence_details": {...}
-- }

RAISE NOTICE '🎯 Script de adição da coluna metadata executado com sucesso!';
