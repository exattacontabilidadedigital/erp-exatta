-- ==================================================
-- EXEMPLO DE EXECUÇÃO NO SUPABASE SQL EDITOR
-- ==================================================

-- 1. Execute este script primeiro no Supabase SQL Editor:

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Execute em seguida o conteúdo do arquivo: 001_create_import_tables.sql
-- 3. Por último, execute o conteúdo do arquivo: create_import_views.sql (002)

-- ==================================================
-- VERIFICAÇÃO APÓS EXECUÇÃO
-- ==================================================

-- Verificar se as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN (
    'modelos_importacao',
    'lotes_importacao', 
    'pre_lancamentos',
    'aprendizado_modelos',
    'historico_importacoes'
)
ORDER BY tablename;

-- Verificar se os índices foram criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN (
    'modelos_importacao',
    'lotes_importacao', 
    'pre_lancamentos',
    'aprendizado_modelos',
    'historico_importacoes'
)
ORDER BY tablename, indexname;

-- Verificar se as views foram criadas
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE viewname LIKE 'v_%importa%'
ORDER BY viewname;

-- Verificar se as funções foram criadas
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname IN (
    'limpar_lotes_antigos',
    'estatisticas_importacao',
    'buscar_lancamentos_similares',
    'processar_lote_automatico',
    'limpar_dados_importacao'
)
ORDER BY proname;

-- Testar os modelos padrão
SELECT * FROM modelos_importacao;

-- ==================================================
-- COMANDOS DE LIMPEZA (SE NECESSÁRIO)
-- ==================================================

-- ATENÇÃO: Execute apenas se precisar limpar/recriar as tabelas

/*
-- Remover policies
DROP POLICY IF EXISTS "Usuários podem ver seus próprios modelos" ON modelos_importacao;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios lotes" ON lotes_importacao;
DROP POLICY IF EXISTS "Usuários podem ver pré-lançamentos de seus lotes" ON pre_lancamentos;
DROP POLICY IF EXISTS "Usuários podem gerenciar aprendizado de seus modelos" ON aprendizado_modelos;
DROP POLICY IF EXISTS "Usuários podem ver histórico de suas importações" ON historico_importacoes;

-- Remover views
DROP VIEW IF EXISTS v_dashboard_importacao;
DROP VIEW IF EXISTS v_relatorio_matching;
DROP VIEW IF EXISTS v_estatisticas_modelo;
DROP VIEW IF EXISTS v_auditoria_importacao;
DROP VIEW IF EXISTS v_pendentes_aprovacao;

-- Remover funções
DROP FUNCTION IF EXISTS limpar_lotes_antigos(INTEGER);
DROP FUNCTION IF EXISTS estatisticas_importacao(UUID);
DROP FUNCTION IF EXISTS buscar_lancamentos_similares(DATE, DECIMAL, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS processar_lote_automatico(UUID);
DROP FUNCTION IF EXISTS limpar_dados_importacao(INTEGER, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remover tabelas (ordem importante devido às FK)
DROP TABLE IF EXISTS historico_importacoes CASCADE;
DROP TABLE IF EXISTS aprendizado_modelos CASCADE;
DROP TABLE IF EXISTS pre_lancamentos CASCADE;
DROP TABLE IF EXISTS lotes_importacao CASCADE;
DROP TABLE IF EXISTS modelos_importacao CASCADE;
*/