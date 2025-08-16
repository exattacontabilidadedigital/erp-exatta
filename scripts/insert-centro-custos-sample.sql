-- Dados de exemplo para popular a tabela centro_custos

INSERT INTO centro_custos (codigo, nome, tipo, responsavel, departamento, orcamento_mensal, descricao, ativo)
VALUES
('001', 'Administrativo', 'administrativo', 'João Silva', 'Diretoria', 20000, 'Centro administrativo da empresa', true),
('002', 'Vendas', 'comercial', 'Maria Santos', 'Comercial', 18000, 'Centro de vendas e comercialização', true),
('003', 'Produção', 'operacional', 'Pedro Oliveira', 'Operações', 30000, 'Centro de produção e operações', true),
('004', 'Marketing', 'comercial', 'Ana Costa', 'Comercial', 15000, 'Centro de marketing e divulgação', true),
('005', 'Financeiro', 'financeiro', 'Carlos Ferreira', 'Financeiro', 12000, 'Centro financeiro e contábil', true),
('006', 'TI', 'apoio', 'Lucas Lima', 'Tecnologia da Informação', 10000, 'Centro de tecnologia e suporte', true),
('007', 'RH', 'apoio', 'Fernanda Souza', 'Recursos Humanos', 9000, 'Centro de recursos humanos', true),
('008', 'Logística', 'operacional', 'Rafael Alves', 'Operações', 16000, 'Centro de logística e distribuição', true);
