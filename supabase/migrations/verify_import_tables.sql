-- ==================================================
-- VERIFICAÇÃO DAS 3 TABELAS ESSENCIAIS
-- ==================================================

-- Verificar se as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('import_templates', 'import_batches', 'pre_entries')
ORDER BY tablename;

-- Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('import_templates', 'import_batches', 'pre_entries')
ORDER BY tablename, indexname;

-- Verificar triggers
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('import_templates', 'import_batches', 'pre_entries')
ORDER BY event_object_table, trigger_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('import_templates', 'import_batches', 'pre_entries')
ORDER BY tablename, policyname;

-- Verificar funções criadas
SELECT 
    proname as function_name,
    prosrc as function_definition
FROM pg_proc 
WHERE proname IN ('clean_old_batches', 'import_statistics', 'update_updated_at_column')
ORDER BY proname;

-- Testar os templates padrão
SELECT 
    id,
    name,
    file_type,
    active,
    created_at
FROM import_templates
ORDER BY created_at;

-- ==================================================
-- TESTE DE INSERÇÃO BÁSICA
-- ==================================================

-- Inserir um lote de teste
INSERT INTO import_batches (
    filename,
    file_type,
    file_size,
    template_id,
    uploaded_by
) VALUES (
    'test_file.csv',
    'CSV',
    1024,
    (SELECT id FROM import_templates WHERE name = 'Default CSV Template' LIMIT 1),
    auth.uid()
) RETURNING id, filename, status, uploaded_at;

-- Buscar o lote inserido
SELECT 
    b.id,
    b.filename,
    b.status,
    t.name as template_name,
    b.uploaded_at
FROM import_batches b
LEFT JOIN import_templates t ON b.template_id = t.id
WHERE b.filename = 'test_file.csv';

-- Limpar teste
DELETE FROM import_batches WHERE filename = 'test_file.csv';

-- ==================================================
-- ESTATÍSTICAS FINAIS
-- ==================================================

-- Verificar estatísticas usando a função criada
SELECT * FROM import_statistics();

RAISE NOTICE 'Verificação das 3 tabelas essenciais concluída!';
RAISE NOTICE 'Tabelas: import_templates, import_batches, pre_entries';
RAISE NOTICE 'Sistema pronto para implementação da funcionalidade de importação!';