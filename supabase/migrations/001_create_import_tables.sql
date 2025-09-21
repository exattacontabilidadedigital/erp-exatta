-- ==================================================
-- MIGRATION: Criação das tabelas para Importar Lançamentos (CORRIGIDO)
-- Data: 2025-09-20
-- Descrição: Versão corrigida para PostgreSQL/Supabase
-- ==================================================

-- Habilitar extensão para arrays e GIN
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela para modelos/templates de importação
CREATE TABLE IF NOT EXISTS modelos_importacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_arquivo VARCHAR(10) NOT NULL CHECK (tipo_arquivo IN ('OFX', 'CSV')),
    configuracao JSONB NOT NULL DEFAULT '{}',
    mapeamento_campos JSONB NOT NULL DEFAULT '{}',
    regras_matching JSONB NOT NULL DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    usuario_criacao UUID,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uk_modelos_importacao_nome UNIQUE (nome)
);

-- 2. Tabela para lotes de importação
CREATE TABLE IF NOT EXISTS lotes_importacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_arquivo VARCHAR(500) NOT NULL,
    tipo_arquivo VARCHAR(10) NOT NULL CHECK (tipo_arquivo IN ('OFX', 'CSV')),
    tamanho_arquivo BIGINT,
    hash_arquivo VARCHAR(256),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'processado', 'erro', 'cancelado')),
    total_registros INTEGER DEFAULT 0,
    registros_processados INTEGER DEFAULT 0,
    registros_com_erro INTEGER DEFAULT 0,
    modelo_id UUID REFERENCES modelos_importacao(id),
    conta_bancaria_id UUID,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_processamento TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    usuario_upload UUID,
    configuracao_processamento JSONB DEFAULT '{}',
    log_processamento JSONB DEFAULT '[]',
    observacoes TEXT
);

-- 3. Tabela para pré-lançamentos (dados importados antes da aprovação)
CREATE TABLE IF NOT EXISTS pre_lancamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lote_id UUID NOT NULL REFERENCES lotes_importacao(id) ON DELETE CASCADE,
    linha_arquivo INTEGER,
    data_lancamento DATE NOT NULL,
    data_movimento DATE,
    descricao TEXT NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    tipo_movimento VARCHAR(10) NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
    categoria_sugerida VARCHAR(255),
    conta_debito_sugerida UUID,
    conta_credito_sugerida UUID,
    centro_custo_sugerido UUID,
    documento VARCHAR(100),
    observacoes TEXT,
    
    -- Campos de matching/correspondência
    score_matching DECIMAL(5,2) DEFAULT 0,
    lancamento_correspondente_id UUID,
    status_matching VARCHAR(20) DEFAULT 'pendente' CHECK (status_matching IN ('pendente', 'encontrado', 'nao_encontrado', 'multiplos', 'manual')),
    regras_aplicadas JSONB DEFAULT '[]',
    
    -- Campos de aprovação
    status_aprovacao VARCHAR(20) DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado', 'duplicado')),
    usuario_aprovacao UUID,
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    motivo_rejeicao TEXT,
    
    -- Campos de auditoria
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Dados originais do arquivo
    dados_originais JSONB DEFAULT '{}'
);

-- 4. Tabela para aprendizado dos modelos (machine learning básico)
CREATE TABLE IF NOT EXISTS aprendizado_modelos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    modelo_id UUID NOT NULL REFERENCES modelos_importacao(id) ON DELETE CASCADE,
    descricao_original TEXT NOT NULL,
    categoria_aplicada VARCHAR(255) NOT NULL,
    conta_debito UUID,
    conta_credito UUID,
    centro_custo UUID,
    frequencia_uso INTEGER DEFAULT 1,
    taxa_acerto DECIMAL(5,2) DEFAULT 100.00,
    ultima_utilizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_validacao UUID,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Campos para melhorar o matching
    palavras_chave TEXT[],
    valor_medio DECIMAL(15,2),
    valor_minimo DECIMAL(15,2),
    valor_maximo DECIMAL(15,2)
);

-- 5. Tabela para histórico de importações
CREATE TABLE IF NOT EXISTS historico_importacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lote_id UUID NOT NULL REFERENCES lotes_importacao(id),
    pre_lancamento_id UUID REFERENCES pre_lancamentos(id),
    lancamento_gerado_id UUID,
    acao VARCHAR(50) NOT NULL,
    valores_anteriores JSONB,
    valores_novos JSONB,
    usuario_acao UUID,
    data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT
);

-- ==================================================
-- CRIAÇÃO DOS ÍNDICES
-- ==================================================

-- Índices para lotes_importacao
CREATE INDEX IF NOT EXISTS idx_lotes_importacao_status ON lotes_importacao (status);
CREATE INDEX IF NOT EXISTS idx_lotes_importacao_data_upload ON lotes_importacao (data_upload);
CREATE INDEX IF NOT EXISTS idx_lotes_importacao_modelo ON lotes_importacao (modelo_id);
CREATE INDEX IF NOT EXISTS idx_lotes_importacao_conta ON lotes_importacao (conta_bancaria_id);

-- Índices para pre_lancamentos
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_lote ON pre_lancamentos (lote_id);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_data ON pre_lancamentos (data_lancamento);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_status_aprovacao ON pre_lancamentos (status_aprovacao);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_status_matching ON pre_lancamentos (status_matching);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_valor ON pre_lancamentos (valor);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_correspondente ON pre_lancamentos (lancamento_correspondente_id);

-- Índices para aprendizado_modelos
CREATE INDEX IF NOT EXISTS idx_aprendizado_modelo ON aprendizado_modelos (modelo_id);
CREATE INDEX IF NOT EXISTS idx_aprendizado_categoria ON aprendizado_modelos (categoria_aplicada);
CREATE INDEX IF NOT EXISTS idx_aprendizado_descricao ON aprendizado_modelos (descricao_original);
CREATE INDEX IF NOT EXISTS idx_aprendizado_palavras_chave ON aprendizado_modelos USING GIN (palavras_chave);
CREATE INDEX IF NOT EXISTS idx_aprendizado_frequencia ON aprendizado_modelos (frequencia_uso DESC);
CREATE INDEX IF NOT EXISTS idx_aprendizado_taxa_acerto ON aprendizado_modelos (taxa_acerto DESC);

-- Índices para historico_importacoes
CREATE INDEX IF NOT EXISTS idx_historico_lote ON historico_importacoes (lote_id);
CREATE INDEX IF NOT EXISTS idx_historico_pre_lancamento ON historico_importacoes (pre_lancamento_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_importacoes (data_acao);
CREATE INDEX IF NOT EXISTS idx_historico_acao ON historico_importacoes (acao);

-- ==================================================
-- TRIGGERS PARA AUDITORIA E CONTROLE
-- ==================================================

-- Trigger para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas relevantes
DROP TRIGGER IF EXISTS update_modelos_importacao_updated_at ON modelos_importacao;
CREATE TRIGGER update_modelos_importacao_updated_at 
    BEFORE UPDATE ON modelos_importacao 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pre_lancamentos_updated_at ON pre_lancamentos;
CREATE TRIGGER update_pre_lancamentos_updated_at 
    BEFORE UPDATE ON pre_lancamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- POLÍTICAS RLS (Row Level Security)
-- ==================================================

-- Habilitar RLS nas tabelas
ALTER TABLE modelos_importacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_importacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprendizado_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_importacoes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessário para sua autenticação)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios modelos" ON modelos_importacao;
CREATE POLICY "Usuários podem ver seus próprios modelos" ON modelos_importacao
    FOR ALL USING (auth.uid() = usuario_criacao);

DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios lotes" ON lotes_importacao;
CREATE POLICY "Usuários podem gerenciar seus próprios lotes" ON lotes_importacao
    FOR ALL USING (auth.uid() = usuario_upload);

DROP POLICY IF EXISTS "Usuários podem ver pré-lançamentos de seus lotes" ON pre_lancamentos;
CREATE POLICY "Usuários podem ver pré-lançamentos de seus lotes" ON pre_lancamentos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lotes_importacao 
            WHERE id = pre_lancamentos.lote_id 
            AND usuario_upload = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuários podem gerenciar aprendizado de seus modelos" ON aprendizado_modelos;
CREATE POLICY "Usuários podem gerenciar aprendizado de seus modelos" ON aprendizado_modelos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM modelos_importacao 
            WHERE id = aprendizado_modelos.modelo_id 
            AND usuario_criacao = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuários podem ver histórico de suas importações" ON historico_importacoes;
CREATE POLICY "Usuários podem ver histórico de suas importações" ON historico_importacoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lotes_importacao 
            WHERE id = historico_importacoes.lote_id 
            AND usuario_upload = auth.uid()
        )
    );

-- ==================================================
-- FUNÇÕES AUXILIARES
-- ==================================================

-- Função para limpar lotes antigos
CREATE OR REPLACE FUNCTION limpar_lotes_antigos(dias_manter INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    lotes_removidos INTEGER;
BEGIN
    DELETE FROM lotes_importacao 
    WHERE status IN ('processado', 'cancelado', 'erro')
    AND data_conclusao < NOW() - INTERVAL '1 day' * dias_manter;
    
    GET DIAGNOSTICS lotes_removidos = ROW_COUNT;
    RETURN lotes_removidos;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular estatísticas de importação
CREATE OR REPLACE FUNCTION estatisticas_importacao(modelo_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_lotes BIGINT,
    total_pre_lancamentos BIGINT,
    taxa_aprovacao NUMERIC,
    valor_total_importado NUMERIC,
    ultimo_lote TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT l.id)::BIGINT as total_lotes,
        COUNT(p.id)::BIGINT as total_pre_lancamentos,
        ROUND(
            (COUNT(CASE WHEN p.status_aprovacao = 'aprovado' THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(p.id), 0) * 100), 2
        ) as taxa_aprovacao,
        COALESCE(SUM(ABS(p.valor)), 0) as valor_total_importado,
        MAX(l.data_upload) as ultimo_lote
    FROM lotes_importacao l
    LEFT JOIN pre_lancamentos p ON l.id = p.lote_id
    WHERE (modelo_uuid IS NULL OR l.modelo_id = modelo_uuid);
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- COMENTÁRIOS NAS TABELAS
-- ==================================================

COMMENT ON TABLE modelos_importacao IS 'Templates/modelos para configuração de importação de diferentes tipos de arquivo';
COMMENT ON TABLE lotes_importacao IS 'Controle de lotes de arquivos importados';
COMMENT ON TABLE pre_lancamentos IS 'Lançamentos importados aguardando aprovação ou já processados';
COMMENT ON TABLE aprendizado_modelos IS 'Dados para machine learning e melhoria automática dos modelos';
COMMENT ON TABLE historico_importacoes IS 'Auditoria de todas as ações realizadas nos processos de importação';

-- ==================================================
-- DADOS INICIAIS (SEEDS)
-- ==================================================

-- Modelo padrão para OFX
INSERT INTO modelos_importacao (nome, descricao, tipo_arquivo, configuracao, mapeamento_campos, regras_matching) 
VALUES (
    'Modelo Padrão OFX',
    'Modelo padrão para importação de arquivos OFX bancários',
    'OFX',
    '{"auto_processar": false, "validar_duplicatas": true, "periodo_duplicata_dias": 7}',
    '{"data": "DTPOSTED", "valor": "TRNAMT", "descricao": "MEMO", "documento": "FITID"}',
    '{"similaridade_minima": 0.8, "considerar_valor": true, "considerar_data": true, "janela_dias": 3}'
) ON CONFLICT (nome) DO NOTHING;

-- Modelo padrão para CSV
INSERT INTO modelos_importacao (nome, descricao, tipo_arquivo, configuracao, mapeamento_campos, regras_matching) 
VALUES (
    'Modelo Padrão CSV',
    'Modelo padrão para importação de arquivos CSV bancários',
    'CSV',
    '{"delimitador": ",", "possui_cabecalho": true, "encoding": "UTF-8", "auto_processar": false}',
    '{"data": "data", "valor": "valor", "descricao": "descricao", "documento": "documento"}',
    '{"similaridade_minima": 0.8, "considerar_valor": true, "considerar_data": true, "janela_dias": 3}'
) ON CONFLICT (nome) DO NOTHING;

-- ==================================================
-- VERIFICAÇÃO FINAL
-- ==================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Migration executada com sucesso!';
    RAISE NOTICE 'Tabelas criadas: modelos_importacao, lotes_importacao, pre_lancamentos, aprendizado_modelos, historico_importacoes';
    RAISE NOTICE 'Triggers, políticas RLS e funções auxiliares configuradas';
    RAISE NOTICE 'Índices criados para otimização de performance';
END $$;