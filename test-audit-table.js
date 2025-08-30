const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ptkuxtvzqpyuczasdlfh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0a3V4dHZ6cXB5dWN6YXNkbGZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDUzNjkxOCwiZXhwIjoyMDUwMTEyOTE4fQ.8qp1YdJfPu-w6CdXA1nJg3b9dmL2_r_JhUILVKLv5nM'
);

async function checkAuditTable() {
  try {
    console.log('🔍 Testando tabela reconciliation_audit_logs...');
    
    const { data, error } = await supabase
      .from('reconciliation_audit_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar tabela:', error.message);
      console.log('💡 Código do erro:', error.code);
      console.log('💡 Detalhes:', error.details);
      
      // A tabela pode não existir, vamos tentar criar um registro simples
      console.log('\n🔧 Tentando inserir um registro de teste...');
      
      const testLog = {
        id: 'test-' + Date.now(),
        action: 'test',
        user_id: 'test-user',
        timestamp: new Date().toISOString(),
        details: { test: true }
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('reconciliation_audit_logs')
        .insert(testLog);
      
      if (insertError) {
        console.log('❌ Erro ao inserir:', insertError.message);
        console.log('💡 Código do erro de inserção:', insertError.code);
      } else {
        console.log('✅ Registro de teste inserido!');
      }
      
    } else {
      console.log('✅ Tabela acessível');
      console.log('📋 Dados encontrados:', data.length, 'registros');
    }
  } catch (error) {
    console.log('❌ Erro de conexão geral:', error.message);
  }
}

checkAuditTable();
