-- ==================================================
-- VIEWS E ÍNDICES ADICIONAIS PARA IMPORTAR LANÇAMENTOS (CORRIGIDO)
-- Data: 2025-09-20  
-- Migration: 002
-- Descrição: Views otimizadas e índices adicionais para PostgreSQL/Supabase
-- ==================================================

-- Habilitar extensão para similaridade de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==================================================
-- ÍNDICES COMPOSTOS PARA PERFORMANCE
-- ==================================================

-- Índices para consultas de dashboard
CREATE INDEX IF NOT EXISTS idx_lotes_status_data ON lotes_importacao (status, data_upload DESC);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_lote_status ON pre_lancamentos (lote_id, status_aprovacao);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_data_valor ON pre_lancamentos (data_lancamento, valor);

-- Índices para matching
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_matching_score ON pre_lancamentos (score_matching DESC) WHERE status_matching = 'encontrado';
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_descricao_gin ON pre_lancamentos USING gin(to_tsvector('portuguese', descricao));

-- Índices para aprendizado
CREATE INDEX IF NOT EXISTS idx_aprendizado_descricao_gin ON aprendizado_modelos USING gin(to_tsvector('portuguese', descricao_original));

-- ==================================================
-- VIEWS PARA DASHBOARD E RELATÓRIOS
-- ==================================================

-- View para dashboard principal
CREATE OR REPLACE VIEW v_dashboard_importacao AS
SELECT 
    l.id as lote_id,
    l.nome_arquivo,
    l.status as status_lote,
    l.data_upload,
    l.total_registros,
    l.registros_processados,
    m.nome as modelo_nome,
    COUNT(p.id) as total_pre_lancamentos,
    COUNT(CASE WHEN p.status_aprovacao = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN p.status_aprovacao = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN p.status_aprovacao = 'rejeitado' THEN 1 END) as rejeitados,
    COALESCE(SUM(CASE WHEN p.status_aprovacao = 'aprovado' AND p.tipo_movimento = 'entrada' THEN p.valor ELSE 0 END), 0) as valor_entradas,
    COALESCE(SUM(CASE WHEN p.status_aprovacao = 'aprovado' AND p.tipo_movimento = 'saida' THEN p.valor ELSE 0 END), 0) as valor_saidas,
    ROUND(
        CASE 
            WHEN COUNT(p.id) > 0 THEN 
                (COUNT(CASE WHEN p.status_aprovacao = 'aprovado' THEN 1 END)::NUMERIC / COUNT(p.id) * 100)
            ELSE 0 
        END, 2
    ) as taxa_aprovacao
FROM lotes_importacao l
LEFT JOIN modelos_importacao m ON l.modelo_id = m.id
LEFT JOIN pre_lancamentos p ON l.id = p.lote_id
GROUP BY l.id, l.nome_arquivo, l.status, l.data_upload, l.total_registros, l.registros_processados, m.nome
ORDER BY l.data_upload DESC;

-- View para relatório de matching
CREATE OR REPLACE VIEW v_relatorio_matching AS
SELECT 
    l.nome_arquivo,
    m.nome as modelo_nome,
    p.id as pre_lancamento_id,
    p.descricao,
    p.valor,
    p.data_lancamento,
    p.status_matching,
    p.score_matching,
    p.categoria_sugerida,
    CASE 
        WHEN p.score_matching >= 0.9 THEN 'Alto'
        WHEN p.score_matching >= 0.7 THEN 'Médio'
        WHEN p.score_matching >= 0.5 THEN 'Baixo'
        ELSE 'Muito Baixo'
    END as nivel_confianca,
    p.regras_aplicadas
FROM pre_lancamentos p
JOIN lotes_importacao l ON p.lote_id = l.id
LEFT JOIN modelos_importacao m ON l.modelo_id = m.id
WHERE p.status_aprovacao = 'pendente'
ORDER BY p.score_matching DESC, p.data_lancamento DESC;

-- View para estatísticas por modelo
CREATE OR REPLACE VIEW v_estatisticas_modelo AS
SELECT 
    m.id as modelo_id,
    m.nome as modelo_nome,
    m.tipo_arquivo,
    COUNT(DISTINCT l.id) as total_lotes,
    COUNT(p.id) as total_pre_lancamentos,
    COUNT(CASE WHEN p.status_aprovacao = 'aprovado' THEN 1 END) as total_aprovados,
    ROUND(
        CASE 
            WHEN COUNT(p.id) > 0 THEN 
                (COUNT(CASE WHEN p.status_aprovacao = 'aprovado' THEN 1 END)::NUMERIC / COUNT(p.id) * 100)
            ELSE 0 
        END, 2
    ) as taxa_aprovacao,
    ROUND(AVG(p.score_matching), 2) as score_medio_matching,
    COALESCE(SUM(ABS(p.valor)), 0) as valor_total_processado,
    MAX(l.data_upload) as ultimo_uso,
    COUNT(a.id) as total_aprendizados
FROM modelos_importacao m
LEFT JOIN lotes_importacao l ON m.id = l.modelo_id
LEFT JOIN pre_lancamentos p ON l.id = p.lote_id
LEFT JOIN aprendizado_modelos a ON m.id = a.modelo_id
GROUP BY m.id, m.nome, m.tipo_arquivo
ORDER BY total_lotes DESC;

-- View para auditoria completa
CREATE OR REPLACE VIEW v_auditoria_importacao AS
SELECT 
    h.id as historico_id,
    l.nome_arquivo,
    m.nome as modelo_nome,
    h.acao,
    h.data_acao,
    h.usuario_acao,
    p.descricao as pre_lancamento_descricao,
    p.valor as pre_lancamento_valor,
    h.valores_anteriores,
    h.valores_novos,
    h.observacoes
FROM historico_importacoes h
JOIN lotes_importacao l ON h.lote_id = l.id
LEFT JOIN modelos_importacao m ON l.modelo_id = m.id
LEFT JOIN pre_lancamentos p ON h.pre_lancamento_id = p.id
ORDER BY h.data_acao DESC;

-- View para lançamentos pendentes de aprovação
CREATE OR REPLACE VIEW v_pendentes_aprovacao AS
SELECT 
    p.id,
    p.lote_id,
    l.nome_arquivo,
    m.nome as modelo_nome,
    p.linha_arquivo,
    p.data_lancamento,
    p.descricao,
    p.valor,
    p.tipo_movimento,
    p.categoria_sugerida,
    p.score_matching,
    p.status_matching,
    CASE 
        WHEN p.score_matching >= 0.9 THEN 'success'
        WHEN p.score_matching >= 0.7 THEN 'warning'
        ELSE 'danger'
    END as cor_score,
    p.data_criacao,
    -- Calcular dias pendentes
    EXTRACT(DAY FROM NOW() - p.data_criacao) as dias_pendente
FROM pre_lancamentos p
JOIN lotes_importacao l ON p.lote_id = l.id
LEFT JOIN modelos_importacao m ON l.modelo_id = m.id
WHERE p.status_aprovacao = 'pendente'
ORDER BY p.score_matching DESC, p.data_criacao ASC;

-- ==================================================
-- FUNÇÕES AUXILIARES AVANÇADAS
-- ==================================================

-- Função para buscar lançamentos similares (para evitar duplicatas)
CREATE OR REPLACE FUNCTION buscar_lancamentos_similares(
    p_data_lancamento DATE,
    p_valor DECIMAL,
    p_descricao TEXT,
    p_janela_dias INTEGER DEFAULT 3,
    p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    data_lancamento DATE,
    descricao TEXT,
    valor DECIMAL,
    similaridade NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.id,
        pl.data_lancamento,
        pl.descricao,
        pl.valor,
        -- Cálculo simples de similaridade baseado em valor e descrição
        ROUND(
            (CASE 
                WHEN pl.valor = p_valor THEN 0.5 
                WHEN ABS(pl.valor - p_valor) <= (ABS(p_valor) * 0.01) THEN 0.4
                WHEN ABS(pl.valor - p_valor) <= (ABS(p_valor) * 0.05) THEN 0.3
                ELSE 0.1
            END +
            CASE 
                WHEN similarity(pl.descricao, p_descricao) > 0.8 THEN 0.5
                WHEN similarity(pl.descricao, p_descricao) > 0.6 THEN 0.3
                WHEN similarity(pl.descricao, p_descricao) > 0.4 THEN 0.2
                ELSE 0.1
            END), 2
        ) as similaridade
    FROM pre_lancamentos pl
    WHERE pl.data_lancamento BETWEEN (p_data_lancamento - p_janela_dias) AND (p_data_lancamento + p_janela_dias)
    AND pl.status_aprovacao IN ('aprovado', 'pendente')
    ORDER BY similaridade DESC, ABS(pl.valor - p_valor) ASC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- Função para processar lote automaticamente
CREATE OR REPLACE FUNCTION processar_lote_automatico(p_lote_id UUID)
RETURNS TABLE (
    processados INTEGER,
    aprovados_automaticos INTEGER,
    pendentes_revisao INTEGER,
    com_erro INTEGER
) AS $$
DECLARE
    v_processados INTEGER := 0;
    v_aprovados INTEGER := 0;
    v_pendentes INTEGER := 0;
    v_erros INTEGER := 0;
    v_modelo_config JSONB;
    v_auto_aprovar BOOLEAN := false;
    v_score_minimo DECIMAL := 0.8;
BEGIN
    -- Buscar configuração do modelo
    SELECT m.configuracao INTO v_modelo_config
    FROM lotes_importacao l
    JOIN modelos_importacao m ON l.modelo_id = m.id
    WHERE l.id = p_lote_id;
    
    -- Verificar se deve auto-aprovar
    v_auto_aprovar := COALESCE((v_modelo_config->>'auto_processar')::BOOLEAN, false);
    v_score_minimo := COALESCE((v_modelo_config->'regras_matching'->>'similaridade_minima')::DECIMAL, 0.8);
    
    -- Processar cada pré-lançamento
    UPDATE pre_lancamentos 
    SET 
        status_aprovacao = CASE 
            WHEN v_auto_aprovar AND score_matching >= v_score_minimo THEN 'aprovado'
            ELSE 'pendente'
        END,
        data_atualizacao = NOW()
    WHERE lote_id = p_lote_id 
    AND status_aprovacao = 'pendente';
    
    -- Contar resultados
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status_aprovacao = 'aprovado' THEN 1 END),
        COUNT(CASE WHEN status_aprovacao = 'pendente' THEN 1 END),
        COUNT(CASE WHEN status_aprovacao = 'rejeitado' THEN 1 END)
    INTO v_processados, v_aprovados, v_pendentes, v_erros
    FROM pre_lancamentos
    WHERE lote_id = p_lote_id;
    
    -- Atualizar status do lote
    UPDATE lotes_importacao 
    SET 
        status = 'processado',
        registros_processados = v_processados,
        data_processamento = NOW(),
        data_conclusao = CASE WHEN v_pendentes = 0 THEN NOW() ELSE NULL END
    WHERE id = p_lote_id;
    
    RETURN QUERY SELECT v_processados, v_aprovados, v_pendentes, v_erros;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dados antigos com mais controle
CREATE OR REPLACE FUNCTION limpar_dados_importacao(
    p_dias_lotes INTEGER DEFAULT 90,
    p_dias_historico INTEGER DEFAULT 365,
    p_manter_aprendizado BOOLEAN DEFAULT true
)
RETURNS TABLE (
    lotes_removidos INTEGER,
    pre_lancamentos_removidos INTEGER,
    historico_removido INTEGER,
    aprendizado_removido INTEGER
) AS $$
DECLARE
    v_lotes INTEGER := 0;
    v_pre_lancamentos INTEGER := 0;
    v_historico INTEGER := 0;
    v_aprendizado INTEGER := 0;
BEGIN
    -- Remover pré-lançamentos de lotes antigos
    DELETE FROM pre_lancamentos 
    WHERE lote_id IN (
        SELECT id FROM lotes_importacao 
        WHERE data_conclusao < NOW() - INTERVAL '1 day' * p_dias_lotes
    );
    GET DIAGNOSTICS v_pre_lancamentos = ROW_COUNT;
    
    -- Remover lotes antigos
    DELETE FROM lotes_importacao 
    WHERE data_conclusao < NOW() - INTERVAL '1 day' * p_dias_lotes;
    GET DIAGNOSTICS v_lotes = ROW_COUNT;
    
    -- Remover histórico antigo
    DELETE FROM historico_importacoes 
    WHERE data_acao < NOW() - INTERVAL '1 day' * p_dias_historico;
    GET DIAGNOSTICS v_historico = ROW_COUNT;
    
    -- Limpar aprendizado pouco usado (opcional)
    IF NOT p_manter_aprendizado THEN
        DELETE FROM aprendizado_modelos 
        WHERE ultima_utilizacao < NOW() - INTERVAL '1 day' * p_dias_historico
        AND frequencia_uso < 5;
        GET DIAGNOSTICS v_aprendizado = ROW_COUNT;
    END IF;
    
    RETURN QUERY SELECT v_lotes, v_pre_lancamentos, v_historico, v_aprendizado;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- EXTENSÕES NECESSÁRIAS
-- ==================================================

-- Habilitar extensão para similaridade de texto (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==================================================
-- COMENTÁRIOS NAS VIEWS
-- ==================================================

COMMENT ON VIEW v_dashboard_importacao IS 'View principal para dashboard de importações com estatísticas consolidadas';
COMMENT ON VIEW v_relatorio_matching IS 'View para relatórios de precisão do matching automático';
COMMENT ON VIEW v_estatisticas_modelo IS 'View com estatísticas de uso e eficiência por modelo de importação';
COMMENT ON VIEW v_auditoria_importacao IS 'View completa para auditoria de todas as ações de importação';
COMMENT ON VIEW v_pendentes_aprovacao IS 'View otimizada para listagem de lançamentos pendentes de aprovação';

-- Script finalizado
DO $$ 
BEGIN
    RAISE NOTICE 'Views e índices adicionais criados com sucesso!';
    RAISE NOTICE 'Views: v_dashboard_importacao, v_relatorio_matching, v_estatisticas_modelo, v_auditoria_importacao, v_pendentes_aprovacao';
    RAISE NOTICE 'Funções: buscar_lancamentos_similares, processar_lote_automatico, limpar_dados_importacao';
END $$;