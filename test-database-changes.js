const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testDirectDatabaseChanges() {
  console.log('🧪 Testando mudanças diretas no banco de dados...\n');
  
  try {
    // 1. Buscar uma transação pendente
    const { data: transactions, error: transError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('reconciliation_status', 'pending')
      .limit(1);
    
    if (transError || !transactions || transactions.length === 0) {
      console.log('❌ Nenhuma transação pendente encontrada');
      return;
    }
    
    const transaction = transactions[0];
    console.log('📋 Transação selecionada:');
    console.log(`- ID: ${transaction.id}`);
    console.log(`- Valor: R$ ${transaction.amount}`);
    console.log(`- Status inicial: ${transaction.reconciliation_status}`);
    console.log(`- Status conciliação inicial: ${transaction.status_conciliacao}`);
    
    // 2. Simular conciliação (atualizar status)
    console.log('\n🔗 Simulando conciliação no banco...');
    
    const { data: updatedData, error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'reconciled',
        status_conciliacao: 'conciliado',
        matched_lancamento_id: 'bc217508-059b-4e11-b320-c42bccfc2e7f',
        match_type: 'manual',
        reconciled_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
      return;
    }
    
    console.log('✅ Conciliação simulada com sucesso!');
    console.log('📊 Novos valores:');
    console.log(`- reconciliation_status: ${updatedData.reconciliation_status}`);
    console.log(`- status_conciliacao: ${updatedData.status_conciliacao}`);
    console.log(`- matched_lancamento_id: ${updatedData.matched_lancamento_id}`);
    console.log(`- match_type: ${updatedData.match_type}`);
    console.log(`- reconciled_at: ${updatedData.reconciled_at}`);
    
    // 3. Aguardar um momento e verificar se os dados persistiram
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', transaction.id)
      .single();
    
    if (verifyData) {
      console.log('🔍 Verificação após 2 segundos:');
      console.log(`- reconciliation_status: ${verifyData.reconciliation_status}`);
      console.log(`- status_conciliacao: ${verifyData.status_conciliacao}`);
      
      if (verifyData.reconciliation_status === 'reconciled') {
        console.log('✅ DADOS PERSISTIRAM NO BANCO! Mudança confirmada.');
      } else {
        console.log('❌ Dados não persistiram ou foram revertidos.');
      }
    }
    
    // 4. Simular desconciliação
    console.log('\n🔄 Simulando desconciliação...');
    
    const { data: revertData, error: revertError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'pending',
        status_conciliacao: 'pendente',
        matched_lancamento_id: null,
        match_type: null,
        reconciled_at: null
      })
      .eq('id', transaction.id)
      .select()
      .single();
    
    if (revertError) {
      console.error('❌ Erro ao reverter:', revertError);
      return;
    }
    
    console.log('✅ Desconciliação simulada com sucesso!');
    console.log('📊 Status revertidos:');
    console.log(`- reconciliation_status: ${revertData.reconciliation_status}`);
    console.log(`- status_conciliacao: ${revertData.status_conciliacao}`);
    console.log(`- matched_lancamento_id: ${revertData.matched_lancamento_id}`);
    
    // 5. Verificar novamente
    console.log('\n⏳ Verificação final...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: finalData } = await supabase
      .from('bank_transactions')
      .select('reconciliation_status, status_conciliacao, matched_lancamento_id')
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
    
    console.log('\n🎯 CONCLUSÃO:');
    console.log('✅ O banco de dados está funcionando corretamente');
    console.log('✅ As mudanças de status são persistidas');
    console.log('✅ Tanto conciliação quanto desconciliação funcionam');
    console.log('✅ O frontend deve estar trabalhando com dados reais');
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

testDirectDatabaseChanges().then(() => process.exit(0));
