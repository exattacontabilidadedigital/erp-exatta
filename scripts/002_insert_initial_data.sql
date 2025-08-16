-- Inserção de dados iniciais para o sistema contábil

-- Inserir bancos principais do Brasil
INSERT INTO bancos (codigo, nome, site, telefone) VALUES
('001', 'Banco do Brasil', 'https://www.bb.com.br', '4004-0001'),
('033', 'Santander', 'https://www.santander.com.br', '4004-3535'),
('104', 'Caixa Econômica Federal', 'https://www.caixa.gov.br', '4004-0104'),
('237', 'Bradesco', 'https://www.bradesco.com.br', '4002-6022'),
('341', 'Itaú', 'https://www.itau.com.br', '4004-4828'),
('260', 'Nu Pagamentos (Nubank)', 'https://nubank.com.br', '0800-608-6060'),
('077', 'Banco Inter', 'https://www.bancointer.com.br', '3003-4070'),
('290', 'PagSeguro', 'https://pagseguro.uol.com.br', '4003-4031'),
('323', 'Mercado Pago', 'https://www.mercadopago.com.br', '4003-4031'),
('336', 'C6 Bank', 'https://www.c6bank.com.br', '4004-0016')
ON CONFLICT (codigo) DO NOTHING;

-- Inserir empresa exemplo (será substituída pelos dados reais do usuário)
INSERT INTO empresas (
  razao_social, nome_fantasia, cnpj, inscricao_estadual,
  endereco, numero, bairro, cidade, estado, cep,
  telefone, email, regime_tributario
) VALUES (
  'Empresa Exemplo Ltda', 'Empresa Exemplo', '12.345.678/0001-90', '123456789',
  'Rua das Empresas', '123', 'Centro', 'São Paulo', 'SP', '01234-567',
  '(11) 1234-5678', 'contato@empresaexemplo.com.br', 'Simples Nacional'
) ON CONFLICT DO NOTHING;

-- Inserir plano de contas básico
WITH empresa_exemplo AS (
  SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-90' LIMIT 1
)
INSERT INTO plano_contas (codigo, nome, tipo, natureza, nivel, empresa_id) 
SELECT * FROM (VALUES
  ('1', 'ATIVO', 'ativo', 'debito', 1),
  ('1.1', 'ATIVO CIRCULANTE', 'ativo', 'debito', 2),
  ('1.1.1', 'Disponível', 'ativo', 'debito', 3),
  ('1.1.1.01', 'Caixa', 'ativo', 'debito', 4),
  ('1.1.1.02', 'Bancos', 'ativo', 'debito', 4),
  ('1.1.2', 'Contas a Receber', 'ativo', 'debito', 3),
  ('1.1.2.01', 'Clientes', 'ativo', 'debito', 4),
  ('2', 'PASSIVO', 'passivo', 'credito', 1),
  ('2.1', 'PASSIVO CIRCULANTE', 'passivo', 'credito', 2),
  ('2.1.1', 'Contas a Pagar', 'passivo', 'credito', 3),
  ('2.1.1.01', 'Fornecedores', 'passivo', 'credito', 4),
  ('3', 'PATRIMÔNIO LÍQUIDO', 'patrimonio', 'credito', 1),
  ('3.1', 'Capital Social', 'patrimonio', 'credito', 2),
  ('4', 'RECEITAS', 'receita', 'credito', 1),
  ('4.1', 'Receita Operacional', 'receita', 'credito', 2),
  ('4.1.1', 'Vendas de Produtos', 'receita', 'credito', 3),
  ('4.1.2', 'Prestação de Serviços', 'receita', 'credito', 3),
  ('5', 'DESPESAS', 'despesa', 'debito', 1),
  ('5.1', 'Despesas Operacionais', 'despesa', 'debito', 2),
  ('5.1.1', 'Despesas Administrativas', 'despesa', 'debito', 3),
  ('5.1.2', 'Despesas Comerciais', 'despesa', 'debito', 3)
) AS plano(codigo, nome, tipo, natureza, nivel)
CROSS JOIN empresa_exemplo
ON CONFLICT (codigo, empresa_id) DO NOTHING;

-- Inserir centros de custo básicos
WITH empresa_exemplo AS (
  SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-90' LIMIT 1
)
INSERT INTO centro_custos (codigo, nome, tipo, empresa_id)
SELECT * FROM (VALUES
  ('001', 'Administração', 'administrativo'),
  ('002', 'Vendas', 'vendas'),
  ('003', 'Produção', 'operacional'),
  ('004', 'Financeiro', 'financeiro')
) AS cc(codigo, nome, tipo)
CROSS JOIN empresa_exemplo
ON CONFLICT (codigo, empresa_id) DO NOTHING;

-- Inserir formas de pagamento básicas
WITH empresa_exemplo AS (
  SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-90' LIMIT 1
)
INSERT INTO formas_pagamento (nome, tipo, prazo_dias, empresa_id)
SELECT * FROM (VALUES
  ('Dinheiro', 'dinheiro', 0),
  ('PIX', 'pix', 0),
  ('Cartão de Débito', 'cartao_debito', 0),
  ('Cartão de Crédito', 'cartao_credito', 30),
  ('Boleto Bancário', 'boleto', 30),
  ('Transferência Bancária', 'transferencia', 1),
  ('Cheque', 'cheque', 30)
) AS fp(nome, tipo, prazo_dias)
CROSS JOIN empresa_exemplo
ON CONFLICT DO NOTHING;
