-- ==================================================
-- MIGRATION: Criação das tabelas para Importar Lançamentos (3 TABELAS ESSENCIAIS)
-- Data: 2025-09-20
-- Descrição: Estrutura simplificada conforme blueprint original
-- ==================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de templates/modelos de importação
CREATE TABLE IF NOT EXISTS import_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('OFX', 'CSV')),
    configuration JSONB NOT NULL DEFAULT '{}',
    field_mapping JSONB NOT NULL DEFAULT '{}',
    matching_rules JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uk_import_templates_name UNIQUE (name)
);

-- 2. Tabela de lotes de importação
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('OFX', 'CSV')),
    file_size BIGINT,
    file_hash VARCHAR(256),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error', 'cancelled')),
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    template_id UUID REFERENCES import_templates(id),
    bank_account_id UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    uploaded_by UUID,
    processing_config JSONB DEFAULT '{}',
    processing_log JSONB DEFAULT '[]',
    notes TEXT
);

-- 3. Tabela de pré-lançamentos (dados importados antes da aprovação)
CREATE TABLE IF NOT EXISTS pre_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    line_number INTEGER,
    entry_date DATE NOT NULL,
    movement_date DATE,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('credit', 'debit')),
    suggested_category VARCHAR(255),
    suggested_debit_account UUID,
    suggested_credit_account UUID,
    suggested_cost_center UUID,
    document_number VARCHAR(100),
    notes TEXT,
    
    -- Campos de matching/correspondência
    matching_score DECIMAL(5,2) DEFAULT 0,
    matched_entry_id UUID,
    matching_status VARCHAR(20) DEFAULT 'pending' CHECK (matching_status IN ('pending', 'matched', 'no_match', 'multiple', 'manual')),
    applied_rules JSONB DEFAULT '[]',
    
    -- Campos de aprovação
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'duplicate')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Campos de auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Dados originais do arquivo
    original_data JSONB DEFAULT '{}'
);

-- ==================================================
-- CRIAÇÃO DOS ÍNDICES
-- ==================================================

-- Índices para import_batches
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches (status);
CREATE INDEX IF NOT EXISTS idx_import_batches_uploaded_at ON import_batches (uploaded_at);
CREATE INDEX IF NOT EXISTS idx_import_batches_template ON import_batches (template_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_bank_account ON import_batches (bank_account_id);

-- Índices para pre_entries
CREATE INDEX IF NOT EXISTS idx_pre_entries_batch ON pre_entries (batch_id);
CREATE INDEX IF NOT EXISTS idx_pre_entries_entry_date ON pre_entries (entry_date);
CREATE INDEX IF NOT EXISTS idx_pre_entries_approval_status ON pre_entries (approval_status);
CREATE INDEX IF NOT EXISTS idx_pre_entries_matching_status ON pre_entries (matching_status);
CREATE INDEX IF NOT EXISTS idx_pre_entries_amount ON pre_entries (amount);
CREATE INDEX IF NOT EXISTS idx_pre_entries_matched ON pre_entries (matched_entry_id);

-- ==================================================
-- TRIGGERS PARA AUDITORIA
-- ==================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_import_templates_updated_at ON import_templates;
CREATE TRIGGER update_import_templates_updated_at 
    BEFORE UPDATE ON import_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pre_entries_updated_at ON pre_entries;
CREATE TRIGGER update_pre_entries_updated_at 
    BEFORE UPDATE ON pre_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- POLÍTICAS RLS (Row Level Security)
-- ==================================================

-- Habilitar RLS nas tabelas
ALTER TABLE import_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_entries ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
DROP POLICY IF EXISTS "Users can manage their own templates" ON import_templates;
CREATE POLICY "Users can manage their own templates" ON import_templates
    FOR ALL USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can manage their own batches" ON import_batches;
CREATE POLICY "Users can manage their own batches" ON import_batches
    FOR ALL USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can view pre-entries from their batches" ON pre_entries;
CREATE POLICY "Users can view pre-entries from their batches" ON pre_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM import_batches 
            WHERE id = pre_entries.batch_id 
            AND uploaded_by = auth.uid()
        )
    );

-- ==================================================
-- FUNÇÕES AUXILIARES
-- ==================================================

-- Função para limpar lotes antigos
CREATE OR REPLACE FUNCTION clean_old_batches(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    batches_removed INTEGER;
BEGIN
    DELETE FROM import_batches 
    WHERE status IN ('processed', 'cancelled', 'error')
    AND completed_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS batches_removed = ROW_COUNT;
    RETURN batches_removed;
END;
$$ LANGUAGE plpgsql;

-- Função para estatísticas de importação
CREATE OR REPLACE FUNCTION import_statistics(template_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_batches BIGINT,
    total_pre_entries BIGINT,
    approval_rate NUMERIC,
    total_amount_imported NUMERIC,
    last_import TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT b.id)::BIGINT as total_batches,
        COUNT(p.id)::BIGINT as total_pre_entries,
        ROUND(
            (COUNT(CASE WHEN p.approval_status = 'approved' THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(p.id), 0) * 100), 2
        ) as approval_rate,
        COALESCE(SUM(ABS(p.amount)), 0) as total_amount_imported,
        MAX(b.uploaded_at) as last_import
    FROM import_batches b
    LEFT JOIN pre_entries p ON b.id = p.batch_id
    WHERE (template_uuid IS NULL OR b.template_id = template_uuid);
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- COMENTÁRIOS NAS TABELAS
-- ==================================================

COMMENT ON TABLE import_templates IS 'Templates/models for configuring different file type imports';
COMMENT ON TABLE import_batches IS 'Control of imported file batches';
COMMENT ON TABLE pre_entries IS 'Imported entries awaiting approval or already processed';

-- ==================================================
-- DADOS INICIAIS (SEEDS)
-- ==================================================

-- Template padrão para OFX
INSERT INTO import_templates (name, description, file_type, configuration, field_mapping, matching_rules) 
VALUES (
    'Default OFX Template',
    'Default template for OFX bank file imports',
    'OFX',
    '{"auto_process": false, "validate_duplicates": true, "duplicate_period_days": 7}',
    '{"date": "DTPOSTED", "amount": "TRNAMT", "description": "MEMO", "document": "FITID"}',
    '{"minimum_similarity": 0.8, "consider_amount": true, "consider_date": true, "date_window_days": 3}'
) ON CONFLICT (name) DO NOTHING;

-- Template padrão para CSV
INSERT INTO import_templates (name, description, file_type, configuration, field_mapping, matching_rules) 
VALUES (
    'Default CSV Template',
    'Default template for CSV bank file imports',
    'CSV',
    '{"delimiter": ",", "has_header": true, "encoding": "UTF-8", "auto_process": false}',
    '{"date": "date", "amount": "amount", "description": "description", "document": "document"}',
    '{"minimum_similarity": 0.8, "consider_amount": true, "consider_date": true, "date_window_days": 3}'
) ON CONFLICT (name) DO NOTHING;

-- ==================================================
-- VERIFICAÇÃO FINAL
-- ==================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Migration executed successfully!';
    RAISE NOTICE 'Tables created: import_templates, import_batches, pre_entries';
    RAISE NOTICE 'Triggers, RLS policies and helper functions configured';
    RAISE NOTICE 'Performance indexes created';
END $$;