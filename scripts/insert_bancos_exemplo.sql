-- Script para inserir bancos de exemplo
-- Execute no SQL Editor do Supabase

INSERT INTO bancos (codigo, nome, nomeCompleto, ativo, site, telefone) VALUES
('001', 'Banco do Brasil', 'Banco do Brasil S.A.', true, 'www.bb.com.br', '(11) 4004-0001'),
('033', 'Santander', 'Banco Santander (Brasil) S.A.', true, 'www.santander.com.br', '(11) 4004-0033'),
('104', 'Caixa Econômica', 'Caixa Econômica Federal', true, 'www.caixa.gov.br', '(11) 4004-0104'),
('237', 'Bradesco', 'Banco Bradesco S.A.', true, 'www.bradesco.com.br', '(11) 4004-0237'),
('341', 'Itaú', 'Itaú Unibanco S.A.', true, 'www.itau.com.br', '(11) 4004-0341'),
('745', 'Citibank', 'Citibank N.A.', true, 'www.citibank.com.br', '(11) 4004-0745'),
('260', 'Nu Pagamentos', 'Nu Pagamentos S.A.', true, 'www.nubank.com.br', '(11) 4004-0260'),
('077', 'Banco Inter', 'Banco Inter S.A.', true, 'www.bancointer.com.br', '(11) 4004-0077'),
('212', 'Banco Original', 'Banco Original S.A.', true, 'www.original.com.br', '(11) 4004-0212'),
('290', 'PagSeguro', 'PagSeguro Digital S.A.', true, 'www.pagseguro.com.br', '(11) 4004-0290'),
('380', 'PicPay', 'PicPay Serviços S.A.', true, 'www.picpay.com', '(11) 4004-0380'),
('336', 'C6 Bank', 'Banco C6 S.A.', true, 'www.c6bank.com.br', '(11) 4004-0336'),
('208', 'BTG Pactual', 'Banco BTG Pactual S.A.', true, 'www.btgpactual.com', '(11) 4004-0208'),
('655', 'Banco Votorantim', 'Banco Votorantim S.A.', false, 'www.bv.com.br', '(11) 4004-0655'),
('422', 'Banco Safra', 'Banco Safra S.A.', true, 'www.safra.com.br', '(11) 4004-0422')
ON CONFLICT (codigo) DO NOTHING;
