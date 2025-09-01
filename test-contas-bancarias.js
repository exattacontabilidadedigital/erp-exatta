const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testContasBancarias() {
  console.log('🔍 Testando estrutura da tabela contas_bancarias...\n');
  
  try {
    // Buscar uma conta bancária para ver a estrutura
    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar contas_bancarias:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estrutura da tabela contas_bancarias:');
      console.log('Colunas disponíveis:', Object.keys(data[0]));
      console.log('\nExemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ Nenhuma conta bancária encontrada na tabela');
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

testContasBancarias().then(() => process.exit(0));
