const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testValidStatusValues() {
  console.log('🔍 Testando valores válidos para status...\n');
  
  const testValues = [
    'pending', 'matched', 'reconciled', 'no_match', 'rejected', 'suggested'
  ];
  
  try {
    // Buscar uma transação para teste
    const { data: transactions } = await supabase
      .from('bank_transactions')
      .select('id, reconciliation_status, status_conciliacao')
      .limit(1);
    
    if (!transactions || transactions.length === 0) {
      console.log('❌ Nenhuma transação encontrada');
      return;
    }
    
    const transactionId = transactions[0].id;
    const originalStatus = transactions[0].reconciliation_status;
    
    console.log(`📋 Testando com transação: ${transactionId}`);
    console.log(`📋 Status original: ${originalStatus}`);
    
    for (const status of testValues) {
      try {
        console.log(`\n🧪 Testando status: "${status}"`);
        
        const { error } = await supabase
          .from('bank_transactions')
          .update({ reconciliation_status: status })
          .eq('id', transactionId);
        
        if (error) {
          console.log(`❌ Erro com "${status}": ${error.message}`);
        } else {
          console.log(`✅ "${status}" é aceito`);
        }
      } catch (e) {
        console.log(`❌ Exceção com "${status}": ${e.message}`);
      }
    }
    
    // Restaurar status original
    await supabase
      .from('bank_transactions')
      .update({ reconciliation_status: originalStatus })
      .eq('id', transactionId);
    
    console.log(`\n🔄 Status restaurado para: ${originalStatus}`);
    
  } catch (e) {
    console.error('❌ Erro geral:', e.message);
  }
}

testValidStatusValues().then(() => process.exit(0));
