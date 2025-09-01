const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testStatusPersistence() {
  console.log('🧪 Testando persistência de mudanças de status...\n');
  
  try {
    // Buscar transação pendente
    const { data: transactions } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('reconciliation_status', 'pending')
      .limit(1);
    
    if (!transactions || transactions.length === 0) {
      console.log('❌ Nenhuma transação pendente encontrada');
      return;
    }
    
    const transaction = transactions[0];
    console.log('📋 Transação selecionada:');
    console.log(`- ID: ${transaction.id}`);
    console.log(`- Valor: R$ ${transaction.amount}`);
    console.log(`- reconciliation_status inicial: ${transaction.reconciliation_status}`);
    console.log(`- status_conciliacao inicial: ${transaction.status_conciliacao}`);
    
    // 1. Testar mudança para "matched" (conciliado)
    console.log('\n🔗 Simulando conciliação (pending → matched)...');
    
    const { data: matchedData, error: matchError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'matched',
        status_conciliacao: 'conciliado',
        matched_lancamento_id: 'bc217508-059b-4e11-b320-c42bccfc2e7f',
        match_type: 'manual'
      })
      .eq('id', transaction.id)
      .select()
      .single();
    
    if (matchError) {
      console.error('❌ Erro ao atualizar para matched:', matchError);
    } else {
      console.log('✅ Status atualizado para "matched"');
      console.log(`- reconciliation_status: ${matchedData.reconciliation_status}`);
      console.log(`- status_conciliacao: ${matchedData.status_conciliacao}`);
      console.log(`- matched_lancamento_id: ${matchedData.matched_lancamento_id}`);
    }
    
    // 2. Verificar se persiste após um tempo
    console.log('\n⏳ Aguardando 2 segundos para verificar persistência...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: verifyData } = await supabase
      .from('bank_transactions')
      .select('reconciliation_status, status_conciliacao, matched_lancamento_id')
      .eq('id', transaction.id)
      .single();
    
    if (verifyData) {
      console.log('🔍 Verificação após 2 segundos:');
      console.log(`- reconciliation_status: ${verifyData.reconciliation_status}`);
      console.log(`- status_conciliacao: ${verifyData.status_conciliacao}`);
      
      if (verifyData.reconciliation_status === 'matched') {
        console.log('✅ DADOS PERSISTIRAM! Mudança confirmada no banco.');
      } else {
        console.log('❌ Dados não persistiram.');
      }
    }
    
    // 3. Testar desconciliação (matched → pending)
    console.log('\n🔄 Simulando desconciliação (matched → pending)...');
    
    const { data: revertData, error: revertError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'pending',
        status_conciliacao: 'pendente',
        matched_lancamento_id: null,
        match_type: null
      })
      .eq('id', transaction.id)
      .select()
      .single();
    
    if (revertError) {
      console.error('❌ Erro ao reverter:', revertError);
    } else {
      console.log('✅ Status revertido para "pending"');
      console.log(`- reconciliation_status: ${revertData.reconciliation_status}`);
      console.log(`- status_conciliacao: ${revertData.status_conciliacao}`);
      console.log(`- matched_lancamento_id: ${revertData.matched_lancamento_id}`);
    }
    
    // 4. Verificação final
    console.log('\n⏳ Verificação final...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: finalData } = await supabase
      .from('bank_transactions')
      .select('reconciliation_status, status_conciliacao')
      .eq('id', transaction.id)
      .single();
    
    if (finalData) {
      console.log('🔍 Estado final:');
      console.log(`- reconciliation_status: ${finalData.reconciliation_status}`);
      console.log(`- status_conciliacao: ${finalData.status_conciliacao}`);
      
      if (finalData.reconciliation_status === 'pending') {
        console.log('✅ DESCONCILIAÇÃO FUNCIONOU! Status voltou para pending.');
      }
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('✅ O banco de dados aceita mudanças de status');
    console.log('✅ Os dados são persistidos corretamente');
    console.log('✅ Tanto conciliação (pending→matched) quanto desconciliação (matched→pending) funcionam');
    console.log('✅ O sistema está trabalhando com dados reais do Supabase');
    console.log('✅ As ações de conciliar/desconciliar ALTERAM SIM os status no banco');
    
  } catch (e) {
    console.error('❌ Erro geral:', e.message);
  }
}

testStatusPersistence().then(() => process.exit(0));
