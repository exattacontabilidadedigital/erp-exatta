-- Inserir dados fictícios para o sistema contábil

-- Inserir empresas fictícias
INSERT INTO empresas (
  id, razao_social, nome_fantasia, cnpj, inscricao_estadual, inscricao_municipal,
  cep, endereco, numero, complemento, bairro, cidade, estado,
  telefone, email, site, regime_tributario, ativo
) VALUES 
(
  gen_random_uuid(),
  'TechSolutions Ltda',
  'TechSolutions',
  '12.345.678/0001-90',
  '123456789',
  '987654321',
  '01310-100',
  'Av. Paulista',
  '1000',
  'Sala 1001',
  'Bela Vista',
  'São Paulo',
  'SP',
  '(11) 3333-4444',
  'contato@techsolutions.com.br',
  'www.techsolutions.com.br',
  'Lucro Presumido',
  true
),
(
  gen_random_uuid(),
  'Restaurante Sabor & Arte Ltda',
  'Sabor & Arte',
  '98.765.432/0001-10',
  '987654321',
  '123456789',
  '22071-900',
  'Rua das Flores',
  '250',
  'Loja A',
  'Copacabana',
  'Rio de Janeiro',
  'RJ',
  '(21) 2222-3333',
  'contato@saborarte.com.br',
  'www.saborarte.com.br',
  'Simples Nacional',
  true
),
(
  gen_random_uuid(),
  'Moda Elegante Comércio de Roupas Ltda',
  'Moda Elegante',
  '11.222.333/0001-44',
  '111222333',
  '444555666',
  '30112-000',
  'Rua da Moda',
  '150',
  '',
  'Centro',
  'Belo Horizonte',
  'MG',
  '(31) 3333-4444',
  'vendas@modaelegante.com.br',
  'www.modaelegante.com.br',
  'Lucro Real',
  true
);

-- Inserir usuários para as empresas
INSERT INTO usuarios (
  id, nome, email, telefone, cargo, role, empresa_id, ativo
) VALUES 
(
  gen_random_uuid(),
  'João Silva',
  'joao@techsolutions.com.br',
  '(11) 99999-1111',
  'Diretor Financeiro',
  'admin',
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  true
),
(
  gen_random_uuid(),
  'Maria Santos',
  'maria@saborarte.com.br',
  '(21) 98888-2222',
  'Proprietária',
  'admin',
  (SELECT id FROM empresas WHERE nome_fantasia = 'Sabor & Arte'),
  true
),
(
  gen_random_uuid(),
  'Carlos Oliveira',
  'carlos@modaelegante.com.br',
  '(31) 97777-3333',
  'Gerente Geral',
  'contador',
  (SELECT id FROM empresas WHERE nome_fantasia = 'Moda Elegante'),
  true
);

-- Inserir bancos
INSERT INTO bancos (id, codigo, nome, site, telefone, ativo) VALUES 
(gen_random_uuid(), '001', 'Banco do Brasil', 'www.bb.com.br', '4004-0001', true),
(gen_random_uuid(), '104', 'Caixa Econômica Federal', 'www.caixa.gov.br', '4004-0104', true),
(gen_random_uuid(), '341', 'Itaú Unibanco', 'www.itau.com.br', '4004-4828', true),
(gen_random_uuid(), '033', 'Santander', 'www.santander.com.br', '4004-3535', true),
(gen_random_uuid(), '237', 'Bradesco', 'www.bradesco.com.br', '4002-6022', true);

-- Inserir contas bancárias
INSERT INTO contas_bancarias (
  id, banco_id, empresa_id, agencia, conta, digito, tipo_conta, 
  saldo_inicial, saldo_atual, ativo
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM bancos WHERE codigo = '341'),
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  '1234',
  '12345',
  '6',
  'Conta Corrente',
  50000.00,
  75000.00,
  true
),
(
  gen_random_uuid(),
  (SELECT id FROM bancos WHERE codigo = '001'),
  (SELECT id FROM empresas WHERE nome_fantasia = 'Sabor & Arte'),
  '5678',
  '67890',
  '1',
  'Conta Corrente',
  25000.00,
  30000.00,
  true
);

-- Inserir plano de contas básico
INSERT INTO plano_contas (
  id, codigo, nome, tipo, natureza, nivel, empresa_id, ativo
) VALUES 
-- Ativo
(gen_random_uuid(), '1', 'ATIVO', 'ativo', 'devedora', 1, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),
(gen_random_uuid(), '1.1', 'ATIVO CIRCULANTE', 'ativo', 'devedora', 2, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),
(gen_random_uuid(), '1.1.1', 'Caixa e Equivalentes', 'ativo', 'devedora', 3, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),
(gen_random_uuid(), '1.1.2', 'Contas a Receber', 'ativo', 'devedora', 3, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),

-- Passivo
(gen_random_uuid(), '2', 'PASSIVO', 'passivo', 'credora', 1, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),
(gen_random_uuid(), '2.1', 'PASSIVO CIRCULANTE', 'passivo', 'credora', 2, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),
(gen_random_uuid(), '2.1.1', 'Contas a Pagar', 'passivo', 'credora', 3, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),

-- Receitas
(gen_random_uuid(), '3', 'RECEITAS', 'receita', 'credora', 1, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),
(gen_random_uuid(), '3.1', 'Receita de Vendas', 'receita', 'credora', 2, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),

-- Despesas
(gen_random_uuid(), '4', 'DESPESAS', 'despesa', 'devedora', 1, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true),
(gen_random_uuid(), '4.1', 'Despesas Operacionais', 'despesa', 'devedora', 2, (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'), true);

-- Inserir centro de custos
INSERT INTO centro_custos (
  id, codigo, nome, tipo, responsavel, departamento, 
  orcamento_mensal, empresa_id, ativo
) VALUES 
(
  gen_random_uuid(),
  'CC001',
  'Administrativo',
  'Administrativo',
  'João Silva',
  'Administração',
  15000.00,
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  true
),
(
  gen_random_uuid(),
  'CC002',
  'Vendas',
  'Comercial',
  'Ana Costa',
  'Comercial',
  25000.00,
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  true
);

-- Inserir clientes/fornecedores
INSERT INTO clientes_fornecedores (
  id, tipo, tipo_pessoa, nome, razao_social, cpf_cnpj,
  telefone, email, endereco, cidade, estado, empresa_id, ativo
) VALUES 
(
  gen_random_uuid(),
  'cliente',
  'juridica',
  'Empresa ABC',
  'ABC Comércio Ltda',
  '12.345.678/0001-99',
  '(11) 1111-2222',
  'contato@abc.com.br',
  'Rua A, 100',
  'São Paulo',
  'SP',
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  true
),
(
  gen_random_uuid(),
  'fornecedor',
  'juridica',
  'Fornecedor XYZ',
  'XYZ Serviços Ltda',
  '98.765.432/0001-11',
  '(11) 3333-4444',
  'vendas@xyz.com.br',
  'Av. B, 200',
  'São Paulo',
  'SP',
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  true
);

-- Inserir formas de pagamento
INSERT INTO formas_pagamento (
  id, nome, tipo, prazo_dias, taxa_juros, empresa_id, ativo
) VALUES 
(
  gen_random_uuid(),
  'Dinheiro',
  'a_vista',
  0,
  0.00,
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  true
),
(
  gen_random_uuid(),
  'Cartão de Crédito',
  'parcelado',
  30,
  2.50,
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  true
),
(
  gen_random_uuid(),
  'Boleto 30 dias',
  'a_prazo',
  30,
  0.00,
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  true
);

-- Inserir alguns lançamentos de exemplo
INSERT INTO lancamentos (
  id, tipo, numero_documento, descricao, valor, data_lancamento, 
  data_vencimento, status, plano_conta_id, centro_custo_id, 
  conta_bancaria_id, cliente_fornecedor_id, forma_pagamento_id,
  empresa_id, usuario_id
) VALUES 
(
  gen_random_uuid(),
  'receita',
  'NF-001',
  'Venda de software',
  5000.00,
  '2024-01-15',
  '2024-01-15',
  'pago',
  (SELECT id FROM plano_contas WHERE codigo = '3.1' AND empresa_id = (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions')),
  (SELECT id FROM centro_custos WHERE codigo = 'CC002'),
  (SELECT id FROM contas_bancarias WHERE empresa_id = (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions')),
  (SELECT id FROM clientes_fornecedores WHERE nome = 'Empresa ABC'),
  (SELECT id FROM formas_pagamento WHERE nome = 'Boleto 30 dias'),
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  (SELECT id FROM usuarios WHERE email = 'joao@techsolutions.com.br')
),
(
  gen_random_uuid(),
  'despesa',
  'FORN-001',
  'Compra de equipamentos',
  2500.00,
  '2024-01-10',
  '2024-02-10',
  'pendente',
  (SELECT id FROM plano_contas WHERE codigo = '4.1' AND empresa_id = (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions')),
  (SELECT id FROM centro_custos WHERE codigo = 'CC001'),
  (SELECT id FROM contas_bancarias WHERE empresa_id = (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions')),
  (SELECT id FROM clientes_fornecedores WHERE nome = 'Fornecedor XYZ'),
  (SELECT id FROM formas_pagamento WHERE nome = 'Boleto 30 dias'),
  (SELECT id FROM empresas WHERE nome_fantasia = 'TechSolutions'),
  (SELECT id FROM usuarios WHERE email = 'joao@techsolutions.com.br')
);
