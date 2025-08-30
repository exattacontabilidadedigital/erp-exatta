-- =========================================================
-- SQL PARA VERIFICAR QUAIS TABELAS JÁ EXISTEM
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =========================================================

-- Verificar se as tabelas existem
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'transaction_matches',
    'matching_rules',
    'reconciliation_sessions',
    'bank_transactions',
    'bank_statements'
  )
ORDER BY table_name;

-- Verificar estrutura da tabela transaction_matches se existir
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'transaction_matches'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela matching_rules se existir
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'matching_rules'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela reconciliation_sessions se existir
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'reconciliation_sessions'
ORDER BY ordinal_position;
