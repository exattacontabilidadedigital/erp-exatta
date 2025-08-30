-- Estrutura simples da tabela bank_transactions
\d bank_transactions

-- Listar todas as colunas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bank_transactions' 
ORDER BY ordinal_position;
