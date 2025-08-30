-- =========================================================
-- ESTRUTURA DE DADOS PARA CONCILIAÇÃO BANCÁRIA
-- Baseado no blueprint fornecido
-- =========================================================

-- Tabela para extratos bancários (OFX)
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_bancaria_id UUID REFERENCES contas_bancarias(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  arquivo_nome VARCHAR(255) NOT NULL,
  arquivo_tamanho INTEGER,
  data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  saldo_inicial DECIMAL(15,2),
  saldo_final DECIMAL(15,2),
  total_transacoes INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'importado' CHECK (status IN ('importado', 'processando', 'processado', 'erro')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para transações bancárias (dados do OFX)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_statement_id UUID REFERENCES bank_statements(id) ON DELETE CASCADE,
  conta_bancaria_id UUID REFERENCES contas_bancarias(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  fit_id VARCHAR(100), -- ID único da transação no OFX
  memo TEXT, -- Descrição da transação
  payee VARCHAR(255), -- Beneficiário
  amount DECIMAL(15,2) NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_type VARCHAR(50), -- DEBIT, CREDIT, etc.
  check_number VARCHAR(50),
  reference_number VARCHAR(100),
  raw_data JSONB, -- Dados brutos do OFX para debug
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fit_id, conta_bancaria_id) -- Evita duplicatas
);

-- Tabela para matches entre transações bancárias e lançamentos
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

-- Tabela para sessões de conciliação
CREATE TABLE IF NOT EXISTS reconciliation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_bancaria_id UUID REFERENCES contas_bancarias(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'finalizada', 'cancelada')),
  total_transacoes INTEGER DEFAULT 0,
  total_conciliadas INTEGER DEFAULT 0,
  total_sugeridas INTEGER DEFAULT 0,
  total_sem_match INTEGER DEFAULT 0,
  total_transferencias INTEGER DEFAULT 0,
  total_ignoradas INTEGER DEFAULT 0,
  saldo_inicial DECIMAL(15,2),
  saldo_final DECIMAL(15,2),
  observacoes TEXT,
  finalizada_at TIMESTAMP WITH TIME ZONE,
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
CREATE INDEX IF NOT EXISTS idx_bank_statements_conta_bancaria_id ON bank_statements(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_empresa_id ON bank_statements(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_data_importacao ON bank_statements(data_importacao);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_statement_id ON bank_transactions(bank_statement_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_conta_bancaria_id ON bank_transactions(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_empresa_id ON bank_transactions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_posted_at ON bank_transactions(posted_at);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_amount ON bank_transactions(amount);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_fit_id ON bank_transactions(fit_id);

CREATE INDEX IF NOT EXISTS idx_transaction_matches_bank_transaction_id ON transaction_matches(bank_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_matches_lancamento_id ON transaction_matches(lancamento_id);
CREATE INDEX IF NOT EXISTS idx_transaction_matches_reconciliation_session_id ON transaction_matches(reconciliation_session_id);
CREATE INDEX IF NOT EXISTS idx_transaction_matches_empresa_id ON transaction_matches(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transaction_matches_status ON transaction_matches(status);

CREATE INDEX IF NOT EXISTS idx_reconciliation_sessions_conta_bancaria_id ON reconciliation_sessions(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_sessions_empresa_id ON reconciliation_sessions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_sessions_status ON reconciliation_sessions(status);

CREATE INDEX IF NOT EXISTS idx_matching_rules_empresa_id ON matching_rules(empresa_id);
CREATE INDEX IF NOT EXISTS idx_matching_rules_tipo ON matching_rules(tipo);
CREATE INDEX IF NOT EXISTS idx_matching_rules_ativa ON matching_rules(ativa);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bank_statements_updated_at BEFORE UPDATE ON bank_statements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transaction_matches_updated_at BEFORE UPDATE ON transaction_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reconciliation_sessions_updated_at BEFORE UPDATE ON reconciliation_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
(NULL, 'Detecção de Transferência', 'Identifica transferências por palavras-chave', 'transferencia', '{"palavras_chave": ["TRANSFER", "DOC", "PIX", "TED", "TRANSFERENCIA"]}', 5, true);

-- Comentários para documentação
COMMENT ON TABLE bank_statements IS 'Extratos bancários importados via OFX';
COMMENT ON TABLE bank_transactions IS 'Transações individuais extraídas dos extratos OFX';
COMMENT ON TABLE transaction_matches IS 'Relacionamentos entre transações bancárias e lançamentos do sistema';
COMMENT ON TABLE reconciliation_sessions IS 'Sessões de conciliação bancária por período';
COMMENT ON TABLE matching_rules IS 'Regras configuráveis para matching automático';
