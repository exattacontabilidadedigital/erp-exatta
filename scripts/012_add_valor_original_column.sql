-- Script para adicionar coluna valor_original à tabela lancamentos
ALTER TABLE lancamentos
ADD COLUMN IF NOT EXISTS valor_original DECIMAL(15,2) DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN lancamentos.valor_original IS 'Valor original da operação antes de juros, multa e desconto';
