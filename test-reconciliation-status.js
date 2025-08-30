const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testReconciliationStatus() {
  console.log('🧪 Testando valores aceitos para reconciliation_status...\n');
  
  const testValues = ['pending', 'matched', 'reconciled', 'no_match', 'rejected', 'suggested'];
  
  // Buscar um registro para testar
  const { data: transactions, error: selectError } = await supabase
    .from('bank_transactions')
    .select('id, reconciliation_status')
    .limit(1);
  
  if (selectError || !transactions || transactions.length === 0) {
    console.error('❌ Erro ao buscar transação para teste:', selectError);
    return;
  }
  
  const testId = transactions[0].id;
  const originalStatus = transactions[0].reconciliation_status;
  console.log(`🎯 Testando com transação ID: ${testId}`);
  console.log(`📊 Status original: ${originalStatus}\n`);
  
  for (const status of testValues) {
    try {
      console.log(`🧪 Testando status: ${status}`);
      
      const { error } = await supabase
        .from('bank_transactions')
        .update({ reconciliation_status: status })
        .eq('id', testId);
      
      if (error) {
        console.log(`❌ ${status}: ${error.message}`);
      } else {
        console.log(`✅ ${status}: ACEITO`);
      }
    } catch (e) {
      console.log(`❌ ${status}: ${e.message}`);
    }
  }
  
  // Restaurar status original
  await supabase
    .from('bank_transactions')
    .update({ reconciliation_status: originalStatus })
    .eq('id', testId);
  
  console.log('\n📋 Teste concluído! Status restaurado.');
}

testReconciliationStatus().then(() => process.exit(0));
