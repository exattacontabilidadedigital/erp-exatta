-- Criação da estrutura completa do banco de dados para o sistema contábil

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  inscricao_estadual VARCHAR(50),
  inscricao_municipal VARCHAR(50),
  cep VARCHAR(10),
  endereco TEXT,
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  telefone VARCHAR(20),
  email VARCHAR(255),
  site VARCHAR(255),
  logo_url TEXT,
  banco VARCHAR(100),
  agencia VARCHAR(20),
  conta VARCHAR(30),
  pix VARCHAR(255),
  regime_tributario VARCHAR(50),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  cargo VARCHAR(100),
  role VARCHAR(50) DEFAULT 'usuario' CHECK (role IN ('admin', 'contador', 'usuario', 'auditor')),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT true,
  permissoes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de bancos
CREATE TABLE IF NOT EXISTS bancos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  site VARCHAR(255),
  telefone VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas bancárias
CREATE TABLE IF NOT EXISTS contas_bancarias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  banco_id UUID REFERENCES bancos(id) ON DELETE RESTRICT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  agencia VARCHAR(20) NOT NULL,
  conta VARCHAR(30) NOT NULL,
  digito VARCHAR(5),
  tipo_conta VARCHAR(20) DEFAULT 'corrente' CHECK (tipo_conta IN ('corrente', 'poupanca', 'investimento')),
  saldo_inicial DECIMAL(15,2) DEFAULT 0,
  saldo_atual DECIMAL(15,2) DEFAULT 0,
  gerente VARCHAR(255),
  telefone_gerente VARCHAR(20),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela do plano de contas
CREATE TABLE IF NOT EXISTS plano_contas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ativo', 'passivo', 'patrimonio', 'receita', 'despesa')),
  natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('debito', 'credito')),
  nivel INTEGER NOT NULL,
  conta_pai_id UUID REFERENCES plano_contas(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(codigo, empresa_id)
);

-- Tabela de centros de custo
CREATE TABLE IF NOT EXISTS centro_custos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('operacional', 'administrativo', 'vendas', 'financeiro')),
  responsavel VARCHAR(255),
  departamento VARCHAR(100),
  orcamento_mensal DECIMAL(15,2),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(codigo, empresa_id)
);

-- Tabela de departamentos
CREATE TABLE IF NOT EXISTS departamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nome, empresa_id)
);

-- Tabela de responsáveis
CREATE TABLE IF NOT EXISTS responsaveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nome, empresa_id)
);

-- Tabela de tipos de centro de custos
CREATE TABLE IF NOT EXISTS tipos_centro_custos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nome, empresa_id)
);

-- Tabela de clientes/fornecedores
CREATE TABLE IF NOT EXISTS clientes_fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'fornecedor', 'ambos')),
  tipo_pessoa VARCHAR(20) NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  nome VARCHAR(255) NOT NULL,
  razao_social VARCHAR(255),
  cpf_cnpj VARCHAR(18),
  rg_ie VARCHAR(50),
  cep VARCHAR(10),
  endereco TEXT,
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(255),
  site VARCHAR(255),
  contato VARCHAR(255),
  observacoes TEXT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de formas de pagamento
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'cheque')),
  prazo_dias INTEGER DEFAULT 0,
  taxa_juros DECIMAL(5,2) DEFAULT 0,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de lançamentos
CREATE TABLE IF NOT EXISTS lancamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa', 'transferencia')),
  numero_documento VARCHAR(100),
  data_lancamento DATE NOT NULL,
  data_vencimento DATE,
  data_pagamento DATE,
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  plano_conta_id UUID REFERENCES plano_contas(id) ON DELETE RESTRICT,
  centro_custo_id UUID REFERENCES centro_custos(id) ON DELETE RESTRICT,
  conta_bancaria_id UUID REFERENCES contas_bancarias(id) ON DELETE RESTRICT,
  cliente_fornecedor_id UUID REFERENCES clientes_fornecedores(id) ON DELETE SET NULL,
  forma_pagamento_id UUID REFERENCES formas_pagamento(id) ON DELETE RESTRICT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_lancamento ON lancamentos(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_empresa_id ON lancamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos(status);
CREATE INDEX IF NOT EXISTS idx_plano_contas_empresa_id ON plano_contas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_centro_custos_empresa_id ON centro_custos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_fornecedores_empresa_id ON clientes_fornecedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_empresa_id ON contas_bancarias(empresa_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bancos_updated_at BEFORE UPDATE ON bancos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_bancarias_updated_at BEFORE UPDATE ON contas_bancarias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plano_contas_updated_at BEFORE UPDATE ON plano_contas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_centro_custos_updated_at BEFORE UPDATE ON centro_custos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_fornecedores_updated_at BEFORE UPDATE ON clientes_fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_formas_pagamento_updated_at BEFORE UPDATE ON formas_pagamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON lancamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
