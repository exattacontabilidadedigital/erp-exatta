const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testRejectAPI() {
  console.log('🧪 Testando a API de reject...\n');
  
  try {
    // Buscar uma transação para testar
    const { data: transactions, error: selectError } = await supabase
      .from('bank_transactions')
      .select('id, reconciliation_status')
      .limit(1);
    
    if (selectError || !transactions || transactions.length === 0) {
      console.error('❌ Erro ao buscar transação para teste:', selectError);
      return;
    }
    
    const testId = transactions[0].id;
    console.log(`🎯 Testando com transação ID: ${testId}`);
    
    // Fazer chamada para a API
    const response = await fetch('http://localhost:3001/api/reconciliation/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: testId,
        reason: 'test_rejection'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API funcionou! Resposta:', result);
      
      // Verificar se o status foi atualizado
      const { data: updated } = await supabase
        .from('bank_transactions')
        .select('reconciliation_status, rejection_reason, rejected_at')
        .eq('id', testId)
        .single();
      
      console.log('📊 Status atualizado:', updated);
      
    } else {
      console.error('❌ Erro na API:', result);
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

testRejectAPI().then(() => process.exit(0));
