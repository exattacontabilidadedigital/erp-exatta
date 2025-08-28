-- Script para inserir plano de contas básico se não existir nenhum
-- Verifica se existe empresa ativa e insere plano de contas para ela

-- Plano de contas básico brasileiro conforme NBC
INSERT INTO plano_contas (codigo, nome, tipo, natureza, nivel, descricao, ativo, empresa_id)
SELECT * FROM (
  VALUES 
    -- ATIVO
    ('1', 'ATIVO', 'ativo', 'debito', 1, 'Grupo do Ativo', true),
    ('1.1', 'ATIVO CIRCULANTE', 'ativo', 'debito', 2, 'Ativo realizável até 12 meses', true),
    ('1.1.1', 'DISPONÍVEL', 'ativo', 'debito', 3, 'Valores disponíveis imediatamente', true),
    ('1.1.1.01', 'CAIXA', 'ativo', 'debito', 4, 'Dinheiro em espécie', true),
    ('1.1.1.02', 'BANCOS CONTA MOVIMENTO', 'ativo', 'debito', 4, 'Depósitos bancários à vista', true),
    ('1.1.1.03', 'APLICAÇÕES FINANCEIRAS', 'ativo', 'debito', 4, 'Aplicações de liquidez imediata', true),
    
    ('1.1.2', 'DIREITOS REALIZÁVEIS', 'ativo', 'debito', 3, 'Direitos a receber até 12 meses', true),
    ('1.1.2.01', 'DUPLICATAS A RECEBER', 'ativo', 'debito', 4, 'Valores a receber de clientes', true),
    ('1.1.2.02', 'CONTAS A RECEBER', 'ativo', 'debito', 4, 'Outras contas a receber', true),
    ('1.1.2.03', 'ESTOQUES', 'ativo', 'debito', 4, 'Mercadorias e materiais', true),
    
    -- PASSIVO
    ('2', 'PASSIVO', 'passivo', 'credito', 1, 'Grupo do Passivo', true),
    ('2.1', 'PASSIVO CIRCULANTE', 'passivo', 'credito', 2, 'Obrigações até 12 meses', true),
    ('2.1.1', 'FORNECEDORES', 'passivo', 'credito', 3, 'Obrigações com fornecedores', true),
    ('2.1.1.01', 'DUPLICATAS A PAGAR', 'passivo', 'credito', 4, 'Duplicatas a pagar fornecedores', true),
    ('2.1.1.02', 'CONTAS A PAGAR', 'passivo', 'credito', 4, 'Outras contas a pagar', true),
    
    ('2.1.2', 'OBRIGAÇÕES TRABALHISTAS', 'passivo', 'credito', 3, 'Salários e encargos', true),
    ('2.1.2.01', 'SALÁRIOS A PAGAR', 'passivo', 'credito', 4, 'Salários devidos aos empregados', true),
    ('2.1.2.02', 'ENCARGOS SOCIAIS A PAGAR', 'passivo', 'credito', 4, 'INSS, FGTS e outros encargos', true),
    
    ('2.1.3', 'OBRIGAÇÕES FISCAIS', 'passivo', 'credito', 3, 'Tributos a recolher', true),
    ('2.1.3.01', 'ICMS A RECOLHER', 'passivo', 'credito', 4, 'ICMS a recolher ao Estado', true),
    ('2.1.3.02', 'PIS A RECOLHER', 'passivo', 'credito', 4, 'PIS a recolher', true),
    ('2.1.3.03', 'COFINS A RECOLHER', 'passivo', 'credito', 4, 'COFINS a recolher', true),
    
    -- PATRIMÔNIO LÍQUIDO
    ('2.2', 'PATRIMÔNIO LÍQUIDO', 'patrimonio', 'credito', 2, 'Capital e reservas', true),
    ('2.2.1', 'CAPITAL SOCIAL', 'patrimonio', 'credito', 3, 'Capital subscrito e integralizado', true),
    ('2.2.1.01', 'CAPITAL SUBSCRITO', 'patrimonio', 'credito', 4, 'Capital subscrito pelos sócios', true),
    ('2.2.2', 'RESERVAS', 'patrimonio', 'credito', 3, 'Reservas constituídas', true),
    ('2.2.2.01', 'RESERVAS DE LUCROS', 'patrimonio', 'credito', 4, 'Reservas formadas com lucros', true),
    
    -- RECEITAS
    ('3', 'RECEITAS', 'receita', 'credito', 1, 'Grupo das Receitas', true),
    ('3.1', 'RECEITA BRUTA', 'receita', 'credito', 2, 'Receitas brutas de vendas', true),
    ('3.1.1', 'VENDAS DE MERCADORIAS', 'receita', 'credito', 3, 'Vendas de produtos e serviços', true),
    ('3.1.1.01', 'VENDAS À VISTA', 'receita', 'credito', 4, 'Vendas à vista', true),
    ('3.1.1.02', 'VENDAS A PRAZO', 'receita', 'credito', 4, 'Vendas a prazo', true),
    
    ('3.2', 'OUTRAS RECEITAS', 'receita', 'credito', 2, 'Receitas não operacionais', true),
    ('3.2.1', 'RECEITAS FINANCEIRAS', 'receita', 'credito', 3, 'Juros e rendimentos', true),
    ('3.2.1.01', 'JUROS ATIVOS', 'receita', 'credito', 4, 'Juros recebidos', true),
    ('3.2.1.02', 'RENDIMENTOS DE APLICAÇÕES', 'receita', 'credito', 4, 'Rendimentos de aplicações financeiras', true),
    
    -- DESPESAS
    ('4', 'DESPESAS', 'despesa', 'debito', 1, 'Grupo das Despesas', true),
    ('4.1', 'CUSTOS DAS VENDAS', 'despesa', 'debito', 2, 'Custos diretos das vendas', true),
    ('4.1.1', 'CUSTO DAS MERCADORIAS VENDIDAS', 'despesa', 'debito', 3, 'CMV', true),
    ('4.1.1.01', 'CUSTO DAS MERCADORIAS VENDIDAS', 'despesa', 'debito', 4, 'Custo das mercadorias vendidas', true),
    
    ('4.2', 'DESPESAS OPERACIONAIS', 'despesa', 'debito', 2, 'Despesas do período', true),
    ('4.2.1', 'DESPESAS ADMINISTRATIVAS', 'despesa', 'debito', 3, 'Despesas administrativas', true),
    ('4.2.1.01', 'SALÁRIOS E ORDENADOS', 'despesa', 'debito', 4, 'Folha de pagamento', true),
    ('4.2.1.02', 'ENCARGOS SOCIAIS', 'despesa', 'debito', 4, 'INSS, FGTS e outros', true),
    ('4.2.1.03', 'ALUGUEL', 'despesa', 'debito', 4, 'Aluguel do imóvel', true),
    ('4.2.1.04', 'ENERGIA ELÉTRICA', 'despesa', 'debito', 4, 'Energia elétrica', true),
    ('4.2.1.05', 'TELEFONE', 'despesa', 'debito', 4, 'Telefone e internet', true),
    ('4.2.1.06', 'MATERIAL DE ESCRITÓRIO', 'despesa', 'debito', 4, 'Material de expediente', true),
    
    ('4.2.2', 'DESPESAS FINANCEIRAS', 'despesa', 'debito', 3, 'Juros e taxas', true),
    ('4.2.2.01', 'JUROS PASSIVOS', 'despesa', 'debito', 4, 'Juros pagos', true),
    ('4.2.2.02', 'TAXAS BANCÁRIAS', 'despesa', 'debito', 4, 'Tarifas bancárias', true)
) AS temp(codigo, nome, tipo, natureza, nivel, descricao, ativo)
CROSS JOIN (
  SELECT id as empresa_id FROM empresas WHERE ativo = true LIMIT 1
) empresa
WHERE NOT EXISTS (
  SELECT 1 FROM plano_contas WHERE plano_contas.codigo = temp.codigo AND plano_contas.empresa_id = empresa.empresa_id
);
