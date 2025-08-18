-- Tabela de funções de usuário
CREATE TABLE funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  permissoes TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
