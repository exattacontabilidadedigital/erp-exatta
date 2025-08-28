-- Script para inserir bancos de teste se não existirem
INSERT INTO bancos (codigo, nome, ativo)
SELECT * FROM (
  VALUES 
    ('001', 'Banco do Brasil', true),
    ('033', 'Banco Santander', true),
    ('104', 'Caixa Econômica Federal', true),
    ('237', 'Banco Bradesco', true),
    ('341', 'Banco Itaú Unibanco', true),
    ('077', 'Banco Inter', true),
    ('260', 'Nu Pagamentos S.A. (Nubank)', true),
    ('290', 'PagSeguro Internet S.A.', true),
    ('323', 'Mercado Pago', true),
    ('336', 'C6 Bank', true)
) AS temp(codigo, nome, ativo)
WHERE NOT EXISTS (
  SELECT 1 FROM bancos WHERE bancos.codigo = temp.codigo
);
