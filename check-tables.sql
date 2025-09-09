-- Script para verificar estrutura das tabelas existentes
-- Execute este script no SQL Editor do Supabase

-- Verificar todas as tabelas disponíveis
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar estrutura específica das tabelas relacionadas à conciliação
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('banco_transacoes', 'bank_transactions', 'lancamentos', 'transaction_matches', 'matches', 'conciliacoes')
ORDER BY table_name, ordinal_position;

-- Verificar constraints e índices existentes
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('banco_transacoes', 'bank_transactions', 'lancamentos', 'transaction_matches', 'matches', 'conciliacoes')
ORDER BY tc.table_name, tc.constraint_name;
