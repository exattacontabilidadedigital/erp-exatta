-- =========================================================
-- SQL APENAS PARA TABELA MATCHING_RULES
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =========================================================

-- TABELA DE REGRAS DE MATCHING
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

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_matching_rules_empresa 
  ON public.matching_rules(empresa_id);

CREATE INDEX IF NOT EXISTS idx_matching_rules_active 
  ON public.matching_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_matching_rules_type 
  ON public.matching_rules(rule_type);

-- TRIGGER PARA UPDATED_AT
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

-- REGRAS PADRÃO DE MATCHING
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

-- COMENTÁRIOS DA TABELA
COMMENT ON TABLE public.matching_rules IS 'Armazena regras personalizadas para matching automático de transações';
COMMENT ON COLUMN public.matching_rules.rule_type IS 'Tipo da regra: amount_tolerance, date_tolerance, description_pattern, transfer_detection';
COMMENT ON COLUMN public.matching_rules.rule_config IS 'Configuração da regra em formato JSON';
COMMENT ON COLUMN public.matching_rules.priority IS 'Prioridade da regra (maior número = maior prioridade)';

-- =========================================================
-- FIM DO SQL
-- =========================================================
