const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testBankTransactions() {
  console.log('🔍 Testando estrutura da tabela bank_transactions...\n');
  
  try {
    // Buscar uma transação existente para ver a estrutura
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar bank_transactions:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estrutura da tabela bank_transactions:');
      console.log('Colunas disponíveis:', Object.keys(data[0]));
      console.log('\nExemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ Nenhuma transação encontrada na tabela');
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

testBankTransactions().then(() => process.exit(0));
