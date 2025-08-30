-- =========================================================
-- TABELAS RESTANTES PARA CONCILIAÇÃO BANCÁRIA
-- Usando estruturas existentes: bank_statements, bank_transactions, reconciliation_sessions
-- =========================================================

-- Tabela para matches entre transações bancárias e lançamentos
-- Ajustada para usar reconciliation_sessions existente
CREATE TABLE IF NOT EXISTS transaction_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_transaction_id UUID REFERENCES bank_transactions(id) ON DELETE CASCADE,
  lancamento_id UUID REFERENCES lancamentos(id) ON DELETE CASCADE,
  reconciliation_session_id UUID REFERENCES reconciliation_sessions(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('conciliado', 'sugerido', 'transferencia', 'sem_match', 'ignorado')),
  match_score DECIMAL(5,2) DEFAULT 0, -- Score de confiança (0-100)
  match_reason TEXT, -- Razão do match (valor+data, descrição similar, etc.)
  confidence_level VARCHAR(10) CHECK (confidence_level IN ('high', 'medium', 'low')),
  is_automatic BOOLEAN DEFAULT false, -- Se foi criado automaticamente ou manualmente
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para regras de matching automático
CREATE TABLE IF NOT EXISTS matching_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('valor_data', 'descricao', 'transferencia', 'historico')),
  parametros JSONB NOT NULL, -- Configurações específicas da regra
  peso INTEGER DEFAULT 1, -- Peso da regra no matching
  ativa BOOLEAN DEFAULT true,
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transaction_matches_bank_transaction_id ON transaction_matches(bank_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_matches_lancamento_id ON transaction_matches(lancamento_id);
CREATE INDEX IF NOT EXISTS idx_transaction_matches_reconciliation_session_id ON transaction_matches(reconciliation_session_id);
CREATE INDEX IF NOT EXISTS idx_transaction_matches_empresa_id ON transaction_matches(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transaction_matches_status ON transaction_matches(status);

CREATE INDEX IF NOT EXISTS idx_matching_rules_empresa_id ON matching_rules(empresa_id);
CREATE INDEX IF NOT EXISTS idx_matching_rules_tipo ON matching_rules(tipo);
CREATE INDEX IF NOT EXISTS idx_matching_rules_ativa ON matching_rules(ativa);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_transaction_matches_updated_at BEFORE UPDATE ON transaction_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matching_rules_updated_at BEFORE UPDATE ON matching_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir regras padrão de matching
INSERT INTO matching_rules (empresa_id, nome, descricao, tipo, parametros, peso, ativa) VALUES
-- Regra 1: Match exato (valor + data)
(NULL, 'Match Exato', 'Correspondência exata de valor e data', 'valor_data', '{"tolerancia_valor": 0, "tolerancia_dias": 0}', 10, true),
-- Regra 2: Match por tolerância (valor ±1%, data ±1 dia)
(NULL, 'Match por Tolerância', 'Correspondência com tolerância de valor e data', 'valor_data', '{"tolerancia_valor": 1, "tolerancia_dias": 1}', 8, true),
-- Regra 3: Match por descrição similar
(NULL, 'Match por Descrição', 'Correspondência por similaridade de descrição', 'descricao', '{"similaridade_minima": 80}', 6, true),
-- Regra 4: Detecção de transferências
(NULL, 'Detecção de Transferência', 'Identifica transferências por palavras-chave', 'transferencia', '{"palavras_chave": ["TRANSFER", "DOC", "PIX", "TED", "TRANSFERENCIA"]}', 5, true)
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE transaction_matches IS 'Relacionamentos entre transações bancárias e lançamentos do sistema';
COMMENT ON TABLE matching_rules IS 'Regras configuráveis para matching automático';
