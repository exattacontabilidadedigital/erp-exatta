import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pftafsuudpbpyzqqgpex.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdGFmc3V1ZHBicHl6cXFncGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMzE4MTQ1MiwiZXhwIjoyMDI4NzU3NDUyfQ.xZJzYD2Fb2kC4aXSJFBTbSmQs-vfX6xaEOaL2T0E9-I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixAuditTable() {
  console.log('🔍 Verificando tabela de auditoria...\n');
  
  try {
    // Verificar se a tabela reconciliation_audit_logs existe
    console.log('1. Verificando se tabela reconciliation_audit_logs existe...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'reconciliation_audit_logs');
    
    if (tablesError) {
      console.log('❌ Erro ao verificar tabelas:', tablesError);
      return;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ Tabela reconciliation_audit_logs já existe!');
      return;
    }
    
    console.log('❌ Tabela reconciliation_audit_logs não existe');
    console.log('📝 Criando tabela...');
    
    // Criar a tabela usando RPC ou SQL direto
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.reconciliation_audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        user_id UUID,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Criar índices para performance
      CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_logs_user_id ON public.reconciliation_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_logs_action ON public.reconciliation_audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_logs_timestamp ON public.reconciliation_audit_logs(timestamp);
      
      -- Habilitar RLS (Row Level Security)
      ALTER TABLE public.reconciliation_audit_logs ENABLE ROW LEVEL SECURITY;
      
      -- Política para permitir inserção
      CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON public.reconciliation_audit_logs
        FOR INSERT WITH CHECK (true);
      
      -- Política para permitir leitura
      CREATE POLICY IF NOT EXISTS "Enable read for all users" ON public.reconciliation_audit_logs
        FOR SELECT USING (true);
    `;
    
    // Tentar executar via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (rpcError) {
      console.log('❌ Erro ao criar tabela via RPC:', rpcError);
      console.log('🔧 Tentando abordagem alternativa...');
      
      // Abordagem alternativa: tentar criar via supabase-js
      console.log('📝 SQL para executar manualmente:');
      console.log(createTableSQL);
      
    } else {
      console.log('✅ Tabela reconciliation_audit_logs criada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function testAuditTable() {
  console.log('\n🧪 Testando inserção na tabela de auditoria...');
  
  try {
    const testLog = {
      id: `test_${Date.now()}`,
      action: 'test',
      user_id: '7317f5bd-f288-4433-8283-596936caf9b2',
      details: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const { data, error } = await supabase
      .from('reconciliation_audit_logs')
      .insert([testLog])
      .select();
    
    if (error) {
      console.log('❌ Erro no teste:', error);
    } else {
      console.log('✅ Teste de inserção bem-sucedido:', data);
      
      // Limpar o registro de teste
      await supabase
        .from('reconciliation_audit_logs')
        .delete()
        .eq('id', testLog.id);
      
      console.log('🧹 Registro de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar as funções
checkAndFixAuditTable()
  .then(() => testAuditTable())
  .catch(console.error);
