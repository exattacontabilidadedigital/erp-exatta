-- Popula a tabela clientes_fornecedores com dados de exemplo
INSERT INTO clientes_fornecedores (
  tipo, tipo_pessoa, nome, razao_social, cpf_cnpj, rg_ie, cep, endereco, numero, complemento, bairro, cidade, estado, telefone, celular, email, site, contato, observacoes, empresa_id, ativo
) VALUES
('cliente', 'juridica', 'Empresa ABC Ltda', 'Empresa ABC Ltda', '12.345.678/0001-90', '', '01000-000', 'Rua das Flores', '100', '', 'Centro', 'São Paulo', 'SP', '(11) 99999-1111', '', 'contato@empresaabc.com', '', '', 'Cliente corporativo', NULL, true),
('fornecedor', 'juridica', 'Fornecedor XYZ', 'Fornecedor XYZ', '98.765.432/0001-10', '', '20000-000', 'Av. Brasil', '200', '', 'Comercial', 'Rio de Janeiro', 'RJ', '(21) 88888-2222', '', 'vendas@fornecedorxyz.com', '', '', 'Fornecedor de insumos', NULL, true),
('ambos', 'fisica', 'João Silva', NULL, '123.456.789-00', '', '30100-000', 'Rua A', '10', '', 'Bairro B', 'Belo Horizonte', 'MG', '(31) 77777-3333', '', 'joao@email.com', '', '', 'Cliente e fornecedor autônomo', NULL, true);
