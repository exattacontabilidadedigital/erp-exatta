-- =========================================================
-- SQL COMPLETO PARA CONCILIAÇÃO BANCÁRIA
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =========================================================

-- 1. TABELA DE MATCHES DE TRANSAÇÕES
-- Registra os matches entre transações bancárias e lançamentos do sistema
CREATE TABLE IF NOT EXISTS public.transaction_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_transaction_id UUID NOT NULL,
  system_transaction_id UUID,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'fuzzy', 'manual', 'rule', 'transfer')),
  match_status TEXT NOT NULL DEFAULT 'suggested' CHECK (match_status IN ('suggested', 'confirmed', 'rejected', 'ignored')),
  confidence_score NUMERIC(3,2) DEFAULT 0.00 CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
  match_criteria JSONB,
  match_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- 2. TABELA DE REGRAS DE MATCHING
-- Armazena regras personalizadas para matching automático
CREATE TABLE IF NOT EXISTS public.matching_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('amount_tolerance', 'date_tolerance', 'description_pattern', 'transfer_detection')),
  rule_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- 3. ÍNDICES PARA PERFORMANCE
-- Índices para transaction_matches
CREATE INDEX IF NOT EXISTS idx_transaction_matches_bank_transaction 
  ON public.transaction_matches(bank_transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_matches_system_transaction 
  ON public.transaction_matches(system_transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_matches_status 
  ON public.transaction_matches(match_status);

CREATE INDEX IF NOT EXISTS idx_transaction_matches_type 
  ON public.transaction_matches(match_type);

-- Índices para matching_rules
CREATE INDEX IF NOT EXISTS idx_matching_rules_empresa 
  ON public.matching_rules(empresa_id);

CREATE INDEX IF NOT EXISTS idx_matching_rules_active 
  ON public.matching_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_matching_rules_type 
  ON public.matching_rules(rule_type);

-- 4. TRIGGERS PARA UPDATED_AT
-- Trigger para transaction_matches
CREATE OR REPLACE FUNCTION update_transaction_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transaction_matches_updated_at
  BEFORE UPDATE ON public.transaction_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_matches_updated_at();

-- Trigger para matching_rules
CREATE OR REPLACE FUNCTION update_matching_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_matching_rules_updated_at
  BEFORE UPDATE ON public.matching_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_matching_rules_updated_at();

-- 5. REGRAS PADRÃO DE MATCHING
-- Inserir regras básicas para cada empresa existente
INSERT INTO public.matching_rules (empresa_id, rule_name, rule_type, rule_config, priority, created_by)
SELECT 
  e.id as empresa_id,
  'Tolerância de Valor - R$ 0,01' as rule_name,
  'amount_tolerance' as rule_type,
  '{"tolerance": 0.01, "currency": "BRL"}'::jsonb as rule_config,
  100 as priority,
  e.id as created_by
FROM public.empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM public.matching_rules mr 
  WHERE mr.empresa_id = e.id 
  AND mr.rule_type = 'amount_tolerance'
);

INSERT INTO public.matching_rules (empresa_id, rule_name, rule_type, rule_config, priority, created_by)
SELECT 
  e.id as empresa_id,
  'Tolerância de Data - 1 dia' as rule_name,
  'date_tolerance' as rule_type,
  '{"tolerance_days": 1}'::jsonb as rule_config,
  90 as priority,
  e.id as created_by
FROM public.empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM public.matching_rules mr 
  WHERE mr.empresa_id = e.id 
  AND mr.rule_type = 'date_tolerance'
);

INSERT INTO public.matching_rules (empresa_id, rule_name, rule_type, rule_config, priority, created_by)
SELECT 
  e.id as empresa_id,
  'Detecção de Transferências' as rule_name,
  'transfer_detection' as rule_type,
  '{"keywords": ["TRANSFER", "DOC", "PIX", "TED", "TRANSFERENCIA"], "case_sensitive": false}'::jsonb as rule_config,
  80 as priority,
  e.id as created_by
FROM public.empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM public.matching_rules mr 
  WHERE mr.empresa_id = e.id 
  AND mr.rule_type = 'transfer_detection'
);

-- 6. COMENTÁRIOS DAS TABELAS
COMMENT ON TABLE public.transaction_matches IS 'Registra os matches entre transações bancárias e lançamentos do sistema';
COMMENT ON TABLE public.matching_rules IS 'Armazena regras personalizadas para matching automático de transações';

COMMENT ON COLUMN public.transaction_matches.match_type IS 'Tipo do match: exact, fuzzy, manual, rule, transfer';
COMMENT ON COLUMN public.transaction_matches.match_status IS 'Status do match: suggested, confirmed, rejected, ignored';
COMMENT ON COLUMN public.transaction_matches.confidence_score IS 'Score de confiança do match (0.00 a 1.00)';
COMMENT ON COLUMN public.transaction_matches.match_criteria IS 'Critérios utilizados para o match (JSON)';

COMMENT ON COLUMN public.matching_rules.rule_type IS 'Tipo da regra: amount_tolerance, date_tolerance, description_pattern, transfer_detection';
COMMENT ON COLUMN public.matching_rules.rule_config IS 'Configuração da regra em formato JSON';
COMMENT ON COLUMN public.matching_rules.priority IS 'Prioridade da regra (maior número = maior prioridade)';

-- =========================================================
-- FIM DO SQL
-- =========================================================
