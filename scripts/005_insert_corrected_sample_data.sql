-- Script corrigido para inserir dados de exemplo no sistema contábil

-- Inserir bancos brasileiros
INSERT INTO bancos (codigo, nome, site, telefone) VALUES
('001', 'Banco do Brasil', 'https://www.bb.com.br', '4004-0001'),
('104', 'Caixa Econômica Federal', 'https://www.caixa.gov.br', '4004-0104'),
('237', 'Bradesco', 'https://www.bradesco.com.br', '4002-6022'),
('341', 'Itaú Unibanco', 'https://www.itau.com.br', '4004-4828'),
('033', 'Santander', 'https://www.santander.com.br', '4004-3535');

-- Inserir empresas de exemplo
INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, inscricao_estadual, cep, endereco, numero, bairro, cidade, estado, telefone, email, regime_tributario) VALUES
('e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'TechSolutions Ltda', 'TechSolutions', '12.345.678/0001-90', '123456789', '01310-100', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', '(11) 3333-4444', 'contato@techsolutions.com.br', 'Lucro Presumido'),
('f23e29e9-bc1f-5b5d-b86f-ce2c53bb3dde', 'Restaurante Sabor & Arte Ltda', 'Sabor & Arte', '23.456.789/0001-01', '234567890', '22071-900', 'Rua das Laranjeiras', '500', 'Laranjeiras', 'Rio de Janeiro', 'RJ', '(21) 2222-3333', 'contato@saborarte.com.br', 'Simples Nacional'),
('a34f3afa-cd2g-6c6e-c97g-df3d64cc4eef', 'Moda Elegante Comércio Ltda', 'Moda Elegante', '34.567.890/0001-12', '345678901', '30112-000', 'Rua da Bahia', '800', 'Centro', 'Belo Horizonte', 'MG', '(31) 3333-4444', 'vendas@modaelegante.com.br', 'Lucro Real');

-- Inserir usuários
INSERT INTO usuarios (id, email, nome, telefone, cargo, role, empresa_id) VALUES
('u1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6', 'admin@techsolutions.com.br', 'João Silva', '(11) 99999-1111', 'Diretor Financeiro', 'admin', 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd'),
('u2b3c4d5-e6f7-8g9h-0i1j-k2l3m4n5o6p7', 'contador@saborarte.com.br', 'Maria Santos', '(21) 88888-2222', 'Contadora', 'contador', 'f23e29e9-bc1f-5b5d-b86f-ce2c53bb3dde'),
('u3c4d5e6-f7g8-9h0i-1j2k-l3m4n5o6p7q8', 'financeiro@modaelegante.com.br', 'Carlos Oliveira', '(31) 77777-3333', 'Analista Financeiro', 'usuario', 'a34f3afa-cd2g-6c6e-c97g-df3d64cc4eef');

-- Inserir contas bancárias (usando valores corretos do constraint)
INSERT INTO contas_bancarias (id, banco_id, empresa_id, agencia, conta, digito, tipo_conta, saldo_inicial, saldo_atual) VALUES
('c2bdaf7e-cb28-4a03-ac18-6a03d693b8fe', (SELECT id FROM bancos WHERE codigo = '001'), 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', '1234', '12345', '6', 'corrente', 50000.00, 75000.00),
('c3ceag8f-dc39-5b14-b929-7b14e4aa3cgf', (SELECT id FROM bancos WHERE codigo = '237'), 'f23e29e9-bc1f-5b5d-b86f-ce2c53bb3dde', '2345', '23456', '7', 'corrente', 25000.00, 30000.00),
('c4dfbh9g-ed4a-6c25-ca3a-8c25f5bb4dhg', (SELECT id FROM bancos WHERE codigo = '341'), 'a34f3afa-cd2g-6c6e-c97g-df3d64cc4eef', '3456', '34567', '8', 'corrente', 40000.00, 45000.00);

-- Inserir plano de contas básico
INSERT INTO plano_contas (id, codigo, nome, tipo, natureza, nivel, empresa_id, descricao) VALUES
-- Ativo
('p1000000-0000-0000-0000-000000000001', '1', 'ATIVO', 'ativo', 'debito', 1, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Ativo Total'),
('p1100000-0000-0000-0000-000000000002', '1.1', 'ATIVO CIRCULANTE', 'ativo', 'debito', 2, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Ativo Circulante'),
('p1110000-0000-0000-0000-000000000003', '1.1.1', 'Caixa e Equivalentes', 'ativo', 'debito', 3, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Disponibilidades'),
('p1111000-0000-0000-0000-000000000004', '1.1.1.1', 'Caixa', 'ativo', 'debito', 4, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Dinheiro em espécie'),
('p1112000-0000-0000-0000-000000000005', '1.1.1.2', 'Bancos', 'ativo', 'debito', 4, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Contas bancárias'),

-- Passivo
('p2000000-0000-0000-0000-000000000006', '2', 'PASSIVO', 'passivo', 'credito', 1, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Passivo Total'),
('p2100000-0000-0000-0000-000000000007', '2.1', 'PASSIVO CIRCULANTE', 'passivo', 'credito', 2, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Passivo Circulante'),
('p2110000-0000-0000-0000-000000000008', '2.1.1', 'Fornecedores', 'passivo', 'credito', 3, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Contas a pagar'),

-- Receitas
('p3000000-0000-0000-0000-000000000009', '3', 'RECEITAS', 'receita', 'credito', 1, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Receitas'),
('p3100000-0000-0000-0000-000000000010', '3.1', 'Receita de Vendas', 'receita', 'credito', 2, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Receitas operacionais'),

-- Despesas
('p4000000-0000-0000-0000-000000000011', '4', 'DESPESAS', 'despesa', 'debito', 1, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Despesas'),
('p4100000-0000-0000-0000-000000000012', '4.1', 'Despesas Operacionais', 'despesa', 'debito', 2, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Despesas operacionais'),
('p4110000-0000-0000-0000-000000000013', '4.1.1', 'Salários e Encargos', 'despesa', 'debito', 3, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Folha de pagamento');

-- Inserir centros de custo
INSERT INTO centro_custos (id, codigo, nome, tipo, responsavel, departamento, orcamento_mensal, empresa_id, descricao) VALUES
('cc100000-0000-0000-0000-000000000001', 'CC001', 'Administrativo', 'administrativo', 'João Silva', 'Administração', 15000.00, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Centro de custo administrativo'),
('cc200000-0000-0000-0000-000000000002', 'CC002', 'Vendas', 'vendas', 'Maria Santos', 'Comercial', 20000.00, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Centro de custo de vendas'),
('cc300000-0000-0000-0000-000000000003', 'CC003', 'Operacional', 'operacional', 'Carlos Oliveira', 'Produção', 25000.00, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd', 'Centro de custo operacional');

-- Inserir clientes e fornecedores
INSERT INTO clientes_fornecedores (id, tipo, tipo_pessoa, nome, razao_social, cpf_cnpj, telefone, email, empresa_id) VALUES
('cf100000-0000-0000-0000-000000000001', 'cliente', 'juridica', 'Empresa ABC Ltda', 'ABC Comércio Ltda', '11.222.333/0001-44', '(11) 4444-5555', 'contato@abc.com.br', 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd'),
('cf200000-0000-0000-0000-000000000002', 'fornecedor', 'juridica', 'Fornecedor XYZ', 'XYZ Suprimentos Ltda', '22.333.444/0001-55', '(11) 5555-6666', 'vendas@xyz.com.br', 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd'),
('cf300000-0000-0000-0000-000000000003', 'cliente', 'fisica', 'José da Silva', null, '123.456.789-00', '(11) 6666-7777', 'jose@email.com', 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd');

-- Inserir formas de pagamento
INSERT INTO formas_pagamento (id, nome, tipo, prazo_dias, taxa_juros, empresa_id) VALUES
('fp100000-0000-0000-0000-000000000001', 'Dinheiro', 'dinheiro', 0, 0.00, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd'),
('fp200000-0000-0000-0000-000000000002', 'PIX', 'pix', 0, 0.00, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd'),
('fp300000-0000-0000-0000-000000000003', 'Cartão de Crédito', 'cartao_credito', 30, 2.50, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd'),
('fp400000-0000-0000-0000-000000000004', 'Boleto', 'boleto', 30, 0.00, 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd');

-- Inserir alguns lançamentos de exemplo
INSERT INTO lancamentos (
  tipo, numero_documento, data_lancamento, data_vencimento, descricao, valor,
  plano_conta_id, centro_custo_id, conta_bancaria_id, cliente_fornecedor_id,
  forma_pagamento_id, empresa_id, usuario_id, status
) VALUES
('receita', 'NF-001', '2024-01-15', '2024-01-15', 'Venda de serviços de desenvolvimento', 5000.00,
 'p3100000-0000-0000-0000-000000000010', 'cc200000-0000-0000-0000-000000000002', 'c2bdaf7e-cb28-4a03-ac18-6a03d693b8fe',
 'cf100000-0000-0000-0000-000000000001', 'fp200000-0000-0000-0000-000000000002', 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd',
 'u1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6', 'pago'),

('despesa', 'BOL-001', '2024-01-10', '2024-01-25', 'Pagamento de salários', 8000.00,
 'p4110000-0000-0000-0000-000000000013', 'cc100000-0000-0000-0000-000000000001', 'c2bdaf7e-cb28-4a03-ac18-6a03d693b8fe',
 null, 'fp400000-0000-0000-0000-000000000004', 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd',
 'u1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6', 'pago'),

('receita', 'NF-002', '2024-01-20', '2024-02-20', 'Venda de consultoria', 3000.00,
 'p3100000-0000-0000-0000-000000000010', 'cc200000-0000-0000-0000-000000000002', 'c2bdaf7e-cb28-4a03-ac18-6a03d693b8fe',
 'cf300000-0000-0000-0000-000000000003', 'fp300000-0000-0000-0000-000000000003', 'e12f18d8-ab0e-4a4c-a75f-bd1b42aa2ccd',
 'u1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6', 'pendente');
