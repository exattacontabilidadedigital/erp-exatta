-- Script para adicionar campos de pagamento à tabela lancamentos
-- Executar após a estrutura base estar criada

-- Adicionar colunas para informações de pagamento
ALTER TABLE lancamentos 
ADD COLUMN IF NOT EXISTS juros DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS multa DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS recebimento_realizado BOOLEAN DEFAULT false;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN lancamentos.juros IS 'Valor de juros aplicado no pagamento';
COMMENT ON COLUMN lancamentos.multa IS 'Valor de multa aplicada no pagamento';
COMMENT ON COLUMN lancamentos.desconto IS 'Valor de desconto aplicado no pagamento';
COMMENT ON COLUMN lancamentos.valor_pago IS 'Valor efetivamente pago (pode diferir do valor original)';
COMMENT ON COLUMN lancamentos.recebimento_realizado IS 'Indica se o recebimento/pagamento foi realizado';

-- Adicionar índices para melhor performance nas consultas de pagamento
CREATE INDEX IF NOT EXISTS idx_lancamentos_recebimento_realizado ON lancamentos(recebimento_realizado);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_pagamento ON lancamentos(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_vencimento ON lancamentos(data_vencimento);

-- Atualizar trigger para incluir as novas colunas
-- (O trigger update_updated_at_column já existe e funcionará automaticamente)
