-- Script para popular o banco com dados fictícios de empresas brasileiras
-- Execute após os scripts 001 e 002

-- Inserir empresas fictícias
INSERT INTO empresas (
  razao_social, nome_fantasia, cnpj, inscricao_estadual, inscricao_municipal,
  cep, endereco, numero, complemento, bairro, cidade, estado,
  telefone, email, site, regime_tributario, atividade_principal,
  logo_url, observacoes, ativo
) VALUES
-- Empresa 1: Consultoria em TI
(
  'TechSolutions Consultoria Ltda', 'TechSolutions', '12.345.678/0001-90', '123456789', '987654321',
  '01310-100', 'Av. Paulista', '1000', 'Sala 1501', 'Bela Vista', 'São Paulo', 'SP',
  '(11) 3456-7890', 'contato@techsolutions.com.br', 'www.techsolutions.com.br', 'Lucro Presumido', 'Consultoria em TI',
  '/placeholder.svg?height=100&width=200', 'Empresa especializada em soluções tecnológicas', true
),
-- Empresa 2: Restaurante
(
  'Sabores do Brasil Restaurante Ltda', 'Sabores do Brasil', '23.456.789/0001-01', '234567890', '876543210',
  '22071-900', 'Rua das Laranjeiras', '500', '', 'Laranjeiras', 'Rio de Janeiro', 'RJ',
  '(21) 2345-6789', 'contato@saboresdobrasil.com.br', 'www.saboresdobrasil.com.br', 'Simples Nacional', 'Restaurante',
  '/placeholder.svg?height=100&width=200', 'Restaurante de culinária brasileira tradicional', true
),
-- Empresa 3: Loja de Roupas
(
  'Moda & Estilo Confecções Ltda', 'Moda & Estilo', '34.567.890/0001-12', '345678901', '765432109',
  '30112-000', 'Rua da Bahia', '1200', 'Loja 15', 'Centro', 'Belo Horizonte', 'MG',
  '(31) 3456-7890', 'vendas@modaestilo.com.br', 'www.modaestilo.com.br', 'Simples Nacional', 'Comércio de Vestuário',
  '/placeholder.svg?height=100&width=200', 'Loja especializada em moda feminina e masculina', true
),
-- Empresa 4: Escritório de Contabilidade
(
  'Contabilidade Precisa Ltda', 'Contabilidade Precisa', '45.678.901/0001-23', '456789012', '654321098',
  '90010-150', 'Rua dos Andradas', '800', 'Conj. 502', 'Centro Histórico', 'Porto Alegre', 'RS',
  '(51) 3234-5678', 'atendimento@contabilidadeprecisa.com.br', 'www.contabilidadeprecisa.com.br', 'Lucro Presumido', 'Serviços Contábeis',
  '/placeholder.svg?height=100&width=200', 'Escritório de contabilidade com 20 anos de experiência', true
),
-- Empresa 5: Oficina Mecânica
(
  'AutoService Mecânica Ltda', 'AutoService', '56.789.012/0001-34', '567890123', '543210987',
  '40070-110', 'Av. Sete de Setembro', '2500', '', 'Corredor da Vitória', 'Salvador', 'BA',
  '(71) 3345-6789', 'oficina@autoservice.com.br', 'www.autoservice.com.br', 'Simples Nacional', 'Serviços Automotivos',
  '/placeholder.svg?height=100&width=200', 'Oficina mecânica especializada em carros nacionais e importados', true
);

-- Inserir usuários para cada empresa
INSERT INTO usuarios (
  empresa_id, nome, email, senha_hash, role, telefone, departamento, ativo
) VALUES
-- Usuários da TechSolutions
(1, 'João Silva', 'joao@techsolutions.com.br', '$2b$10$example_hash_1', 'administrador', '(11) 99999-1111', 'Diretoria', true),
(1, 'Maria Santos', 'maria@techsolutions.com.br', '$2b$10$example_hash_2', 'contador', '(11) 99999-2222', 'Financeiro', true),
(1, 'Pedro Costa', 'pedro@techsolutions.com.br', '$2b$10$example_hash_3', 'usuario', '(11) 99999-3333', 'Vendas', true),

-- Usuários do Sabores do Brasil
(2, 'Ana Oliveira', 'ana@saboresdobrasil.com.br', '$2b$10$example_hash_4', 'administrador', '(21) 99999-4444', 'Administração', true),
(2, 'Carlos Pereira', 'carlos@saboresdobrasil.com.br', '$2b$10$example_hash_5', 'contador', '(21) 99999-5555', 'Financeiro', true),

-- Usuários da Moda & Estilo
(3, 'Lucia Ferreira', 'lucia@modaestilo.com.br', '$2b$10$example_hash_6', 'administrador', '(31) 99999-6666', 'Gerência', true),
(3, 'Roberto Lima', 'roberto@modaestilo.com.br', '$2b$10$example_hash_7', 'usuario', '(31) 99999-7777', 'Vendas', true),

-- Usuários da Contabilidade Precisa
(4, 'Sandra Almeida', 'sandra@contabilidadeprecisa.com.br', '$2b$10$example_hash_8', 'administrador', '(51) 99999-8888', 'Sócios', true),
(4, 'Marcos Rodrigues', 'marcos@contabilidadeprecisa.com.br', '$2b$10$example_hash_9', 'contador', '(51) 99999-9999', 'Contabilidade', true),

-- Usuários da AutoService
(5, 'Fernanda Souza', 'fernanda@autoservice.com.br', '$2b$10$example_hash_10', 'administrador', '(71) 99999-0000', 'Administração', true);

-- Inserir bancos (bancos brasileiros reais)
INSERT INTO bancos (codigo, nome, ativo) VALUES
('001', 'Banco do Brasil S.A.', true),
('104', 'Caixa Econômica Federal', true),
('237', 'Banco Bradesco S.A.', true),
('341', 'Banco Itaú S.A.', true),
('033', 'Banco Santander (Brasil) S.A.', true),
('745', 'Banco Citibank S.A.', true),
('399', 'HSBC Bank Brasil S.A.', true),
('422', 'Banco Safra S.A.', true),
('070', 'BRB - Banco de Brasília S.A.', true),
('756', 'Banco Cooperativo do Brasil S.A.', true);

-- Inserir contas bancárias para cada empresa
INSERT INTO contas_bancarias (
  empresa_id, banco_id, agencia, conta, digito, tipo_conta, 
  saldo_inicial, saldo_atual, descricao, ativo
) VALUES
-- Contas da TechSolutions
(1, 1, '1234', '12345', '6', 'corrente', 50000.00, 75000.00, 'Conta Corrente Principal', true),
(1, 3, '5678', '67890', '1', 'poupanca', 100000.00, 120000.00, 'Conta Poupança Reserva', true),

-- Contas do Sabores do Brasil
(2, 2, '2345', '23456', '7', 'corrente', 25000.00, 30000.00, 'Conta Movimento', true),
(2, 4, '6789', '78901', '2', 'corrente', 15000.00, 18000.00, 'Conta Fornecedores', true),

-- Contas da Moda & Estilo
(3, 5, '3456', '34567', '8', 'corrente', 35000.00, 42000.00, 'Conta Principal', true),

-- Contas da Contabilidade Precisa
(4, 1, '4567', '45678', '9', 'corrente', 80000.00, 95000.00, 'Conta Operacional', true),
(4, 6, '7890', '89012', '3', 'poupanca', 200000.00, 220000.00, 'Reserva de Emergência', true),

-- Contas da AutoService
(5, 2, '5678', '56789', '0', 'corrente', 40000.00, 45000.00, 'Conta Corrente', true);

-- Inserir plano de contas detalhado para cada empresa
INSERT INTO plano_contas (
  empresa_id, codigo, nome, tipo, natureza, nivel, conta_pai_id, ativo
) VALUES
-- Plano de contas básico para todas as empresas (exemplo com empresa 1)
(1, '1', 'ATIVO', 'ativo', 'devedora', 1, NULL, true),
(1, '1.1', 'ATIVO CIRCULANTE', 'ativo', 'devedora', 2, 1, true),
(1, '1.1.1', 'Disponível', 'ativo', 'devedora', 3, 2, true),
(1, '1.1.1.001', 'Caixa', 'ativo', 'devedora', 4, 3, true),
(1, '1.1.1.002', 'Bancos Conta Movimento', 'ativo', 'devedora', 4, 3, true),
(1, '1.1.2', 'Realizável a Curto Prazo', 'ativo', 'devedora', 3, 2, true),
(1, '1.1.2.001', 'Duplicatas a Receber', 'ativo', 'devedora', 4, 6, true),
(1, '1.1.2.002', 'Estoque', 'ativo', 'devedora', 4, 6, true),

(1, '2', 'PASSIVO', 'passivo', 'credora', 1, NULL, true),
(1, '2.1', 'PASSIVO CIRCULANTE', 'passivo', 'credora', 2, 9, true),
(1, '2.1.1', 'Fornecedores', 'passivo', 'credora', 3, 10, true),
(1, '2.1.2', 'Obrigações Trabalhistas', 'passivo', 'credora', 3, 10, true),
(1, '2.1.3', 'Obrigações Tributárias', 'passivo', 'credora', 3, 10, true),

(1, '3', 'PATRIMÔNIO LÍQUIDO', 'patrimonio', 'credora', 1, NULL, true),
(1, '3.1', 'Capital Social', 'patrimonio', 'credora', 2, 14, true),
(1, '3.2', 'Reservas', 'patrimonio', 'credora', 2, 14, true),
(1, '3.3', 'Lucros Acumulados', 'patrimonio', 'credora', 2, 14, true),

(1, '4', 'RECEITAS', 'receita', 'credora', 1, NULL, true),
(1, '4.1', 'Receita Bruta', 'receita', 'credora', 2, 18, true),
(1, '4.1.1', 'Receita de Vendas', 'receita', 'credora', 3, 19, true),
(1, '4.1.2', 'Receita de Serviços', 'receita', 'credora', 3, 19, true),

(1, '5', 'DESPESAS', 'despesa', 'devedora', 1, NULL, true),
(1, '5.1', 'Despesas Operacionais', 'despesa', 'devedora', 2, 22, true),
(1, '5.1.1', 'Salários e Encargos', 'despesa', 'devedora', 3, 23, true),
(1, '5.1.2', 'Aluguel', 'despesa', 'devedora', 3, 23, true),
(1, '5.1.3', 'Energia Elétrica', 'despesa', 'devedora', 3, 23, true),
(1, '5.1.4', 'Telefone', 'despesa', 'devedora', 3, 23, true),
(1, '5.1.5', 'Material de Escritório', 'despesa', 'devedora', 3, 23, true);

-- Inserir centros de custo para cada empresa
INSERT INTO centro_custos (
  empresa_id, codigo, nome, tipo, responsavel, departamento, 
  orcamento_mensal, descricao, ativo
) VALUES
-- Centros de custo da TechSolutions
(1, 'CC001', 'Diretoria', 'administrativo', 'João Silva', 'Diretoria', 15000.00, 'Centro de custo da diretoria executiva', true),
(1, 'CC002', 'Desenvolvimento', 'operacional', 'Maria Santos', 'TI', 25000.00, 'Equipe de desenvolvimento de software', true),
(1, 'CC003', 'Vendas', 'comercial', 'Pedro Costa', 'Comercial', 20000.00, 'Equipe comercial e marketing', true),
(1, 'CC004', 'Financeiro', 'administrativo', 'Maria Santos', 'Financeiro', 8000.00, 'Departamento financeiro e contábil', true),

-- Centros de custo do Sabores do Brasil
(2, 'CC001', 'Cozinha', 'operacional', 'Ana Oliveira', 'Produção', 18000.00, 'Área de produção e preparo de alimentos', true),
(2, 'CC002', 'Salão', 'operacional', 'Carlos Pereira', 'Atendimento', 12000.00, 'Área de atendimento ao cliente', true),
(2, 'CC003', 'Administração', 'administrativo', 'Ana Oliveira', 'Administração', 8000.00, 'Área administrativa do restaurante', true),

-- Centros de custo da Moda & Estilo
(3, 'CC001', 'Loja', 'comercial', 'Lucia Ferreira', 'Vendas', 15000.00, 'Área de vendas da loja física', true),
(3, 'CC002', 'Estoque', 'operacional', 'Roberto Lima', 'Logística', 10000.00, 'Controle e gestão de estoque', true),
(3, 'CC003', 'Marketing', 'comercial', 'Lucia Ferreira', 'Marketing', 5000.00, 'Ações de marketing e publicidade', true);

-- Inserir clientes e fornecedores
INSERT INTO clientes_fornecedores (
  empresa_id, tipo, pessoa_tipo, nome, documento, inscricao_estadual,
  cep, endereco, numero, bairro, cidade, estado,
  telefone, email, contato, observacoes, ativo
) VALUES
-- Clientes da TechSolutions
(1, 'cliente', 'juridica', 'Empresa ABC Ltda', '11.222.333/0001-44', '111222333', '01234-567', 'Rua das Flores', '100', 'Centro', 'São Paulo', 'SP', '(11) 1111-2222', 'contato@empresaabc.com.br', 'José Silva', 'Cliente desde 2020', true),
(1, 'cliente', 'fisica', 'Maria da Silva', '123.456.789-01', '', '12345-678', 'Av. Brasil', '200', 'Jardins', 'São Paulo', 'SP', '(11) 2222-3333', 'maria.silva@email.com', 'Maria da Silva', 'Cliente pessoa física', true),

-- Fornecedores da TechSolutions
(1, 'fornecedor', 'juridica', 'TechSupplies Ltda', '22.333.444/0001-55', '222333444', '23456-789', 'Rua da Tecnologia', '300', 'Vila Olímpia', 'São Paulo', 'SP', '(11) 3333-4444', 'vendas@techsupplies.com.br', 'Carlos Santos', 'Fornecedor de equipamentos', true),
(1, 'fornecedor', 'juridica', 'Office Solutions', '33.444.555/0001-66', '333444555', '34567-890', 'Av. Comercial', '400', 'Brooklin', 'São Paulo', 'SP', '(11) 4444-5555', 'atendimento@officesolutions.com.br', 'Ana Costa', 'Material de escritório', true),

-- Clientes do Sabores do Brasil
(2, 'cliente', 'fisica', 'João Pereira', '234.567.890-12', '', '45678-901', 'Rua das Palmeiras', '500', 'Copacabana', 'Rio de Janeiro', 'RJ', '(21) 5555-6666', 'joao.pereira@email.com', 'João Pereira', 'Cliente frequente', true),
(2, 'cliente', 'juridica', 'Eventos & Cia', '44.555.666/0001-77', '444555666', '56789-012', 'Av. Atlântica', '600', 'Ipanema', 'Rio de Janeiro', 'RJ', '(21) 6666-7777', 'eventos@eventosecia.com.br', 'Paula Lima', 'Empresa de eventos', true),

-- Fornecedores do Sabores do Brasil
(2, 'fornecedor', 'juridica', 'Distribuidora de Alimentos', '55.666.777/0001-88', '555666777', '67890-123', 'Rua do Mercado', '700', 'Centro', 'Rio de Janeiro', 'RJ', '(21) 7777-8888', 'vendas@distalimentos.com.br', 'Roberto Alves', 'Fornecedor de ingredientes', true);

-- Inserir formas de pagamento
INSERT INTO formas_pagamento (
  empresa_id, nome, tipo, prazo_recebimento, taxa, 
  conta_bancaria_id, descricao, ativo
) VALUES
-- Formas de pagamento da TechSolutions
(1, 'Dinheiro', 'dinheiro', 0, 0.00, NULL, 'Pagamento em espécie', true),
(1, 'PIX', 'pix', 0, 0.00, 1, 'Pagamento via PIX', true),
(1, 'Cartão de Débito', 'cartao_debito', 1, 2.50, 1, 'Débito com taxa de 2,5%', true),
(1, 'Cartão de Crédito', 'cartao_credito', 30, 4.50, 1, 'Crédito com taxa de 4,5%', true),
(1, 'Boleto Bancário', 'boleto', 3, 3.50, 1, 'Boleto com vencimento em 3 dias', true),
(1, 'Transferência Bancária', 'transferencia', 1, 0.00, 1, 'TED/DOC sem taxa', true),

-- Formas de pagamento do Sabores do Brasil
(2, 'Dinheiro', 'dinheiro', 0, 0.00, NULL, 'Pagamento à vista', true),
(2, 'PIX', 'pix', 0, 0.00, 3, 'PIX instantâneo', true),
(2, 'Cartão de Débito', 'cartao_debito', 1, 2.00, 3, 'Débito Visa/Master', true),
(2, 'Cartão de Crédito', 'cartao_credito', 30, 3.50, 3, 'Crédito parcelado', true);

-- Inserir lançamentos (movimentações financeiras)
INSERT INTO lancamentos (
  empresa_id, data_lancamento, tipo, numero_documento, descricao,
  valor, plano_conta_id, centro_custo_id, cliente_fornecedor_id,
  conta_bancaria_id, forma_pagamento_id, observacoes, status
) VALUES
-- Lançamentos da TechSolutions (Janeiro 2024)
(1, '2024-01-02', 'receita', 'NF001', 'Prestação de serviços de consultoria', 15000.00, 21, 2, 1, 1, 2, 'Projeto de implementação de sistema', 'confirmado'),
(1, '2024-01-03', 'despesa', 'REC001', 'Pagamento de salários', 18000.00, 24, 1, NULL, 1, 6, 'Folha de pagamento janeiro', 'confirmado'),
(1, '2024-01-05', 'receita', 'NF002', 'Desenvolvimento de software', 25000.00, 21, 2, 2, 1, 4, 'Sistema personalizado', 'confirmado'),
(1, '2024-01-08', 'despesa', 'REC002', 'Aluguel do escritório', 5000.00, 25, 1, NULL, 1, 5, 'Aluguel janeiro 2024', 'confirmado'),
(1, '2024-01-10', 'despesa', 'NF003', 'Compra de equipamentos', 8000.00, 27, 2, 3, 1, 6, 'Notebooks para equipe', 'confirmado'),
(1, '2024-01-15', 'receita', 'NF004', 'Manutenção de sistemas', 5000.00, 21, 2, 1, 1, 2, 'Manutenção mensal', 'confirmado'),
(1, '2024-01-20', 'despesa', 'REC003', 'Energia elétrica', 800.00, 26, 1, NULL, 1, 5, 'Conta de luz janeiro', 'confirmado'),
(1, '2024-01-25', 'despesa', 'REC004', 'Material de escritório', 1200.00, 28, 4, 4, 1, 6, 'Papelaria e suprimentos', 'confirmado'),

-- Lançamentos do Sabores do Brasil (Janeiro 2024)
(2, '2024-01-02', 'receita', 'VND001', 'Vendas do dia', 2500.00, NULL, 1, NULL, 3, 1, 'Vendas em dinheiro', 'confirmado'),
(2, '2024-01-02', 'receita', 'VND002', 'Vendas cartão', 1800.00, NULL, 1, NULL, 3, 3, 'Vendas no débito', 'confirmado'),
(2, '2024-01-03', 'despesa', 'NF005', 'Compra de ingredientes', 3000.00, NULL, 1, 7, 3, 6, 'Compras para estoque', 'confirmado'),
(2, '2024-01-05', 'receita', 'EVT001', 'Evento corporativo', 8000.00, NULL, 1, 6, 3, 4, 'Buffet para empresa', 'confirmado'),
(2, '2024-01-08', 'despesa', 'REC005', 'Salários funcionários', 12000.00, NULL, 3, NULL, 3, 6, 'Folha janeiro', 'confirmado'),
(2, '2024-01-10', 'despesa', 'REC006', 'Aluguel do ponto', 4000.00, NULL, 3, NULL, 3, 5, 'Aluguel janeiro', 'confirmado'),

-- Lançamentos da Moda & Estilo (Janeiro 2024)
(3, '2024-01-03', 'receita', 'VND003', 'Vendas de roupas', 3500.00, NULL, 1, NULL, 5, 1, 'Vendas à vista', 'confirmado'),
(3, '2024-01-05', 'receita', 'VND004', 'Vendas cartão crédito', 2800.00, NULL, 1, NULL, 5, 4, 'Vendas parceladas', 'confirmado'),
(3, '2024-01-08', 'despesa', 'NF006', 'Compra de mercadorias', 15000.00, NULL, 2, NULL, 5, 6, 'Coleção verão', 'confirmado'),
(3, '2024-01-12', 'despesa', 'REC007', 'Marketing digital', 1500.00, NULL, 3, NULL, 5, 6, 'Anúncios redes sociais', 'confirmado'),

-- Lançamentos futuros (pendentes)
(1, '2024-02-01', 'receita', 'NF005', 'Projeto em andamento', 20000.00, 21, 2, 1, 1, 5, 'Pagamento previsto', 'pendente'),
(2, '2024-02-01', 'despesa', 'REC008', 'Fornecedor ingredientes', 2500.00, NULL, 1, 7, 3, 5, 'Compra programada', 'pendente'),
(3, '2024-02-01', 'receita', 'VND005', 'Vendas estimadas', 4000.00, NULL, 1, NULL, 5, 1, 'Projeção de vendas', 'pendente');

-- Atualizar saldos das contas bancárias baseado nos lançamentos
UPDATE contas_bancarias SET saldo_atual = saldo_inicial + 
  (SELECT COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE -l.valor END), 0)
   FROM lancamentos l 
   WHERE l.conta_bancaria_id = contas_bancarias.id AND l.status = 'confirmado')
WHERE id IN (1, 3, 5);

-- Inserir dados de auditoria
INSERT INTO auditoria (
  tabela, operacao, registro_id, usuario_id, dados_anteriores, dados_novos
) VALUES
('empresas', 'INSERT', 1, 1, NULL, '{"razao_social": "TechSolutions Consultoria Ltda"}'),
('usuarios', 'INSERT', 1, 1, NULL, '{"nome": "João Silva", "email": "joao@techsolutions.com.br"}'),
('lancamentos', 'INSERT', 1, 1, NULL, '{"descricao": "Prestação de serviços de consultoria", "valor": 15000.00}');

COMMIT;
