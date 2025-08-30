const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testDirectUpdate() {
  console.log('🧪 Testando update direto...\n');
  
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
    const originalStatus = transactions[0].reconciliation_status;
    console.log(`🎯 Testando com transação ID: ${testId}`);
    console.log(`📊 Status original: ${originalStatus}`);
    
    // Simular o que a API faz
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'pending',
        rejection_reason: 'user_rejected',
        rejected_at: new Date().toISOString()
      })
      .eq('id', testId);
    
    if (updateError) {
      console.error('❌ Erro no update:', updateError);
    } else {
      console.log('✅ Update funcionou!');
      
      // Verificar o resultado
      const { data: updated } = await supabase
        .from('bank_transactions')
        .select('reconciliation_status, rejection_reason, rejected_at')
        .eq('id', testId)
        .single();
      
      console.log('📊 Dados atualizados:', updated);
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

testDirectUpdate().then(() => process.exit(0));
