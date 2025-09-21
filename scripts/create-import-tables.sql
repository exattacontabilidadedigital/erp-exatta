-- Estrutura de tabelas para funcionalidade de Importação de Lançamentos
-- Data: 2025-09-20

-- 1. Tabela para templates/modelos de importação
CREATE TABLE modelos_importacao (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    padrao_descricao VARCHAR(500) NOT NULL,
    padrao_regex VARCHAR(500),
    conta_id INTEGER,
    centro_custo_id INTEGER,
    cliente_id INTEGER,
    fornecedor_id INTEGER,
    conta_bancaria_id INTEGER,
    categoria VARCHAR(100),
    limite_confianca DECIMAL(3,2) DEFAULT 0.80,
    auto_confirmar BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    contador_uso INTEGER DEFAULT 0,
    taxa_sucesso DECIMAL(3,2) DEFAULT 0.00,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_modelo_empresa FOREIGN KEY (empresa_id) REFERENCES companies(id),
    CONSTRAINT fk_modelo_conta FOREIGN KEY (conta_id) REFERENCES accounts(id),
    CONSTRAINT fk_modelo_centro_custo FOREIGN KEY (centro_custo_id) REFERENCES cost_centers(id),
    CONSTRAINT fk_modelo_cliente FOREIGN KEY (cliente_id) REFERENCES clients(id),
    CONSTRAINT fk_modelo_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES suppliers(id),
    CONSTRAINT ck_limite_confianca CHECK (limite_confianca >= 0 AND limite_confianca <= 1),
    CONSTRAINT ck_taxa_sucesso CHECK (taxa_sucesso >= 0 AND taxa_sucesso <= 1)
);

-- 2. Tabela para lotes de importação (histórico de arquivos)
CREATE TABLE lotes_importacao (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(10) NOT NULL, -- 'OFX' ou 'CSV'
    hash_arquivo VARCHAR(64),
    total_registros INTEGER DEFAULT 0,
    registros_processados INTEGER DEFAULT 0,
    registros_confirmados INTEGER DEFAULT 0,
    registros_rejeitados INTEGER DEFAULT 0,
    registros_auto_confirmados INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processando', -- processando, concluido, erro
    tempo_processamento INTEGER, -- em milissegundos
    mensagem_erro TEXT,
    importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_lote_empresa FOREIGN KEY (empresa_id) REFERENCES companies(id),
    CONSTRAINT fk_lote_usuario FOREIGN KEY (usuario_id) REFERENCES users(id),
    CONSTRAINT ck_tipo_arquivo CHECK (tipo_arquivo IN ('OFX', 'CSV')),
    CONSTRAINT ck_status_lote CHECK (status IN ('processando', 'concluido', 'erro'))
);

-- 3. Tabela para pré-lançamentos (fila de validação)
CREATE TABLE pre_lancamentos (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    
    -- Dados originais do arquivo
    descricao_original VARCHAR(500),
    descricao_normalizada VARCHAR(500),
    valor DECIMAL(15,2) NOT NULL,
    data_lancamento DATE NOT NULL,
    numero_documento VARCHAR(100),
    referencia_bancaria VARCHAR(100),
    saldo DECIMAL(15,2),
    
    -- Matching aplicado
    modelo_id INTEGER,
    pontuacao_confianca DECIMAL(3,2) DEFAULT 0,
    tipo_correspondencia VARCHAR(20) DEFAULT 'manual', -- exato, regex, fuzzy, manual
    
    -- Sugestões do sistema
    conta_sugerida_id INTEGER,
    centro_custo_sugerido_id INTEGER,
    cliente_sugerido_id INTEGER,
    fornecedor_sugerido_id INTEGER,
    conta_bancaria_sugerida_id INTEGER,
    categoria_sugerida VARCHAR(100),
    
    -- Valores finais (após revisão do usuário)
    conta_final_id INTEGER,
    centro_custo_final_id INTEGER,
    cliente_final_id INTEGER,
    fornecedor_final_id INTEGER,
    conta_bancaria_final_id INTEGER,
    categoria_final VARCHAR(100),
    observacoes TEXT,
    
    -- Controle de status
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, sugerido, confirmado, editado, rejeitado
    lancamento_final_id INTEGER,
    revisado_por INTEGER,
    revisado_em TIMESTAMP,
    auto_confirmado BOOLEAN DEFAULT false,
    feedback_usuario VARCHAR(50), -- positivo, negativo, modificado
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_pre_lote FOREIGN KEY (lote_id) REFERENCES lotes_importacao(id),
    CONSTRAINT fk_pre_empresa FOREIGN KEY (empresa_id) REFERENCES companies(id),
    CONSTRAINT fk_pre_modelo FOREIGN KEY (modelo_id) REFERENCES modelos_importacao(id),
    CONSTRAINT fk_pre_conta_sugerida FOREIGN KEY (conta_sugerida_id) REFERENCES accounts(id),
    CONSTRAINT fk_pre_centro_custo_sugerido FOREIGN KEY (centro_custo_sugerido_id) REFERENCES cost_centers(id),
    CONSTRAINT fk_pre_cliente_sugerido FOREIGN KEY (cliente_sugerido_id) REFERENCES clients(id),
    CONSTRAINT fk_pre_fornecedor_sugerido FOREIGN KEY (fornecedor_sugerido_id) REFERENCES suppliers(id),
    CONSTRAINT fk_pre_conta_final FOREIGN KEY (conta_final_id) REFERENCES accounts(id),
    CONSTRAINT fk_pre_centro_custo_final FOREIGN KEY (centro_custo_final_id) REFERENCES cost_centers(id),
    CONSTRAINT fk_pre_cliente_final FOREIGN KEY (cliente_final_id) REFERENCES clients(id),
    CONSTRAINT fk_pre_fornecedor_final FOREIGN KEY (fornecedor_final_id) REFERENCES suppliers(id),
    CONSTRAINT fk_pre_lancamento_final FOREIGN KEY (lancamento_final_id) REFERENCES entries(id),
    CONSTRAINT fk_pre_revisado_por FOREIGN KEY (revisado_por) REFERENCES users(id),
    CONSTRAINT ck_pontuacao_confianca CHECK (pontuacao_confianca >= 0 AND pontuacao_confianca <= 1),
    CONSTRAINT ck_tipo_correspondencia CHECK (tipo_correspondencia IN ('exato', 'regex', 'fuzzy', 'manual')),
    CONSTRAINT ck_status_pre CHECK (status IN ('pendente', 'sugerido', 'confirmado', 'editado', 'rejeitado')),
    CONSTRAINT ck_feedback_usuario CHECK (feedback_usuario IN ('positivo', 'negativo', 'modificado'))
);

-- 4. Tabela para aprendizagem do sistema
CREATE TABLE aprendizado_modelos (
    id SERIAL PRIMARY KEY,
    modelo_id INTEGER,
    descricao VARCHAR(500),
    tipo_feedback VARCHAR(20), -- positivo, negativo, criacao, atualizacao
    confianca_antes DECIMAL(3,2),
    confianca_depois DECIMAL(3,2),
    acao_usuario VARCHAR(50), -- confirmou, rejeitou, editou, criou_novo
    detalhes_mudanca JSONB,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_aprendizado_modelo FOREIGN KEY (modelo_id) REFERENCES modelos_importacao(id),
    CONSTRAINT ck_tipo_feedback CHECK (tipo_feedback IN ('positivo', 'negativo', 'criacao', 'atualizacao')),
    CONSTRAINT ck_acao_usuario CHECK (acao_usuario IN ('confirmou', 'rejeitou', 'editou', 'criou_novo')),
    CONSTRAINT ck_confianca_antes CHECK (confianca_antes >= 0 AND confianca_antes <= 1),
    CONSTRAINT ck_confianca_depois CHECK (confianca_depois >= 0 AND confianca_depois <= 1)
);

-- Índices para performance
CREATE INDEX idx_modelos_importacao_empresa ON modelos_importacao(empresa_id);
CREATE INDEX idx_modelos_importacao_padrao ON modelos_importacao(padrao_descricao);
CREATE INDEX idx_modelos_importacao_ativo ON modelos_importacao(ativo);

CREATE INDEX idx_lotes_importacao_empresa ON lotes_importacao(empresa_id);
CREATE INDEX idx_lotes_importacao_status ON lotes_importacao(status);
CREATE INDEX idx_lotes_importacao_data ON lotes_importacao(importado_em);

CREATE INDEX idx_pre_lancamentos_lote ON pre_lancamentos(lote_id);
CREATE INDEX idx_pre_lancamentos_empresa ON pre_lancamentos(empresa_id);
CREATE INDEX idx_pre_lancamentos_status ON pre_lancamentos(status);
CREATE INDEX idx_pre_lancamentos_data ON pre_lancamentos(data_lancamento);
CREATE INDEX idx_pre_lancamentos_descricao_norm ON pre_lancamentos(descricao_normalizada);

CREATE INDEX idx_aprendizado_modelo ON aprendizado_modelos(modelo_id);
CREATE INDEX idx_aprendizado_data ON aprendizado_modelos(criado_em);

-- Triggers para atualização automática de timestamps
CREATE OR REPLACE FUNCTION atualizar_timestamp_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_modelos_importacao_atualizado
    BEFORE UPDATE ON modelos_importacao
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp_modificacao();

-- Função para atualizar estatísticas dos modelos
CREATE OR REPLACE FUNCTION atualizar_estatisticas_modelo(modelo_id_param INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE modelos_importacao 
    SET 
        contador_uso = (
            SELECT COUNT(*) 
            FROM pre_lancamentos 
            WHERE modelo_id = modelo_id_param
        ),
        taxa_sucesso = (
            SELECT COALESCE(
                COUNT(CASE WHEN status IN ('confirmado', 'editado') THEN 1 END)::DECIMAL / 
                NULLIF(COUNT(*), 0), 
                0
            )
            FROM pre_lancamentos 
            WHERE modelo_id = modelo_id_param
        )
    WHERE id = modelo_id_param;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE modelos_importacao IS 'Templates/modelos para classificação automática de transações importadas';
COMMENT ON TABLE lotes_importacao IS 'Histórico de arquivos importados e seu status de processamento';
COMMENT ON TABLE pre_lancamentos IS 'Fila de validação para lançamentos importados antes de serem confirmados';
COMMENT ON TABLE aprendizado_modelos IS 'Log de aprendizagem do sistema baseado no feedback dos usuários';

-- Exemplos de dados iniciais (opcional)
INSERT INTO modelos_importacao (empresa_id, nome, padrao_descricao, conta_id, limite_confianca, auto_confirmar, ativo) 
VALUES 
(1, 'Pagamento Fornecedor Genérico', 'pag fornecedor', 1, 0.85, false, true),
(1, 'Recebimento Cliente Genérico', 'rec cliente', 2, 0.85, false, true),
(1, 'Transferência Bancária', 'transferencia', 3, 0.90, true, true);