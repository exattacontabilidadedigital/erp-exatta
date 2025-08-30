const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testFinalUpdate() {
  console.log('🧪 Testando update final...\n');
  
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
    
    // Simular exatamente o que a API faz agora
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'pending',
        matched_lancamento_id: null,
        match_confidence: null,
        match_type: null,
        match_criteria: null,
        reconciliation_notes: 'user_rejected'
      })
      .eq('id', testId);
    
    if (updateError) {
      console.error('❌ Erro no update:', updateError);
    } else {
      console.log('✅ Update funcionou perfeitamente!');
      
      // Verificar o resultado
      const { data: updated } = await supabase
        .from('bank_transactions')
        .select('reconciliation_status, reconciliation_notes, matched_lancamento_id')
        .eq('id', testId)
        .single();
      
      console.log('📊 Dados atualizados:', updated);
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

testFinalUpdate().then(() => process.exit(0));
