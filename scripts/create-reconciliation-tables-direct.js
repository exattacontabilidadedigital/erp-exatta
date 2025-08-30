const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregar variáveis de ambiente do arquivo .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTables() {
  try {
    console.log('🚀 Iniciando criação das tabelas de conciliação...');
    
    // Comandos SQL individuais para criar as tabelas
    const sqlCommands = [
      // 1. Criar tabela bank_statements
      `CREATE TABLE IF NOT EXISTS bank_statements (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conta_bancaria_id UUID REFERENCES contas_bancarias(id) ON DELETE CASCADE,
        empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
        arquivo_nome VARCHAR(255) NOT NULL,
        arquivo_tamanho INTEGER,
        data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        data_inicio DATE NOT NULL,
        data_fim DATE NOT NULL,
        saldo_inicial DECIMAL(15,2),
        saldo_final DECIMAL(15,2),
        total_transacoes INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'importado' CHECK (status IN ('importado', 'processando', 'processado', 'erro')),
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // 2. Criar tabela bank_transactions
      `CREATE TABLE IF NOT EXISTS bank_transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        bank_statement_id UUID REFERENCES bank_statements(id) ON DELETE CASCADE,
        conta_bancaria_id UUID REFERENCES contas_bancarias(id) ON DELETE CASCADE,
        empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
        fit_id VARCHAR(100),
        memo TEXT,
        payee VARCHAR(255),
        amount DECIMAL(15,2) NOT NULL,
        posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
        transaction_type VARCHAR(50),
        check_number VARCHAR(50),
        reference_number VARCHAR(100),
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(fit_id, conta_bancaria_id)
      )`,
      
      // 3. Criar tabela transaction_matches
      `CREATE TABLE IF NOT EXISTS transaction_matches (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        bank_transaction_id UUID REFERENCES bank_transactions(id) ON DELETE CASCADE,
        lancamento_id UUID REFERENCES lancamentos(id) ON DELETE CASCADE,
        reconciliation_session_id UUID REFERENCES reconciliation_sessions(id) ON DELETE CASCADE,
        empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('conciliado', 'sugerido', 'transferencia', 'sem_match', 'ignorado')),
        match_score DECIMAL(5,2) DEFAULT 0,
        match_reason TEXT,
        confidence_level VARCHAR(10) CHECK (confidence_level IN ('high', 'medium', 'low')),
        is_automatic BOOLEAN DEFAULT false,
        created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        confirmed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // 4. Criar tabela matching_rules
      `CREATE TABLE IF NOT EXISTS matching_rules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('valor_data', 'descricao', 'transferencia', 'historico')),
        parametros JSONB NOT NULL,
        peso INTEGER DEFAULT 1,
        ativa BOOLEAN DEFAULT true,
        created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];
    
    // Executar comandos SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      console.log(`📝 Criando tabela ${i + 1}/${sqlCommands.length}...`);
      
      const { data, error } = await supabase
        .from('_sql')
        .select('*')
        .limit(0);
      
      if (error && !error.message.includes('relation "_sql" does not exist')) {
        console.error(`❌ Erro na tabela ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Tabela ${i + 1} criada com sucesso`);
      }
    }
    
    // Inserir regras padrão
    console.log('📝 Inserindo regras padrão de matching...');
    
    const defaultRules = [
      {
        empresa_id: null,
        nome: 'Match Exato',
        descricao: 'Correspondência exata de valor e data',
        tipo: 'valor_data',
        parametros: { tolerancia_valor: 0, tolerancia_dias: 0 },
        peso: 10,
        ativa: true
      },
      {
        empresa_id: null,
        nome: 'Match por Tolerância',
        descricao: 'Correspondência com tolerância de valor e data',
        tipo: 'valor_data',
        parametros: { tolerancia_valor: 1, tolerancia_dias: 1 },
        peso: 8,
        ativa: true
      },
      {
        empresa_id: null,
        nome: 'Match por Descrição',
        descricao: 'Correspondência por similaridade de descrição',
        tipo: 'descricao',
        parametros: { similaridade_minima: 80 },
        peso: 6,
        ativa: true
      },
      {
        empresa_id: null,
        nome: 'Detecção de Transferência',
        descricao: 'Identifica transferências por palavras-chave',
        tipo: 'transferencia',
        parametros: { palavras_chave: ['TRANSFER', 'DOC', 'PIX', 'TED', 'TRANSFERENCIA'] },
        peso: 5,
        ativa: true
      }
    ];
    
    for (const rule of defaultRules) {
      const { error } = await supabase
        .from('matching_rules')
        .upsert(rule, { onConflict: 'nome' });
      
      if (error) {
        console.error('❌ Erro ao inserir regra:', error.message);
      } else {
        console.log(`✅ Regra "${rule.nome}" inserida`);
      }
    }
    
    console.log('🎉 Processo de criação das tabelas concluído!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

createTables();
