const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testConciliationChanges() {
  console.log('🧪 Testando se conciliação altera dados no banco...\n');
  
  try {
    // 1. Buscar uma transação bancária pendente
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('reconciliation_status', 'pending')
      .limit(1);
    
    if (bankError || !bankTransactions || bankTransactions.length === 0) {
      console.log('❌ Nenhuma transação pendente encontrada para teste');
      return;
    }
    
    const transaction = bankTransactions[0];
    console.log('📋 Transação selecionada para teste:');
    console.log(`- ID: ${transaction.id}`);
    console.log(`- Valor: R$ ${transaction.amount}`);
    console.log(`- Status atual: ${transaction.reconciliation_status}`);
    console.log(`- Status conciliação: ${transaction.status_conciliacao}`);
    console.log(`- Data: ${transaction.posted_at}`);
    console.log(`- Memo: ${transaction.memo}`);
    
    // 2. Buscar um lançamento para fazer match
    const { data: lancamentos, error: lancError } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('status', 'pago')
      .limit(1);
    
    if (lancError || !lancamentos || lancamentos.length === 0) {
      console.log('❌ Nenhum lançamento pago encontrado para teste');
      return;
    }
    
    const lancamento = lancamentos[0];
    console.log('\n📋 Lançamento selecionado para match:');
    console.log(`- ID: ${lancamento.id}`);
    console.log(`- Valor: R$ ${lancamento.valor}`);
    console.log(`- Descrição: ${lancamento.descricao}`);
    console.log(`- Status: ${lancamento.status}`);
    
    // 3. Testar API de conciliação
    console.log('\n🔗 Testando API de conciliação...');
    
    const conciliatePayload = {
      bank_transaction_id: transaction.id,
      system_transaction_id: lancamento.id,
      confidence_level: 'manual',
      rule_applied: 'teste_manual'
    };
    
    console.log('📤 Payload enviado:', conciliatePayload);
    
    try {
      const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conciliatePayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API de conciliação respondeu:', result);
        
        // 4. Verificar se os dados mudaram no banco
        console.log('\n🔍 Verificando mudanças no banco de dados...');
        
        const { data: updatedTransaction, error: updateError } = await supabase
          .from('bank_transactions')
          .select('*')
          .eq('id', transaction.id)
          .single();
        
        if (updatedTransaction) {
          console.log('📊 Status ANTES da conciliação:');
          console.log(`- reconciliation_status: ${transaction.reconciliation_status}`);
          console.log(`- status_conciliacao: ${transaction.status_conciliacao}`);
          console.log(`- matched_lancamento_id: ${transaction.matched_lancamento_id}`);
          
          console.log('\n📊 Status DEPOIS da conciliação:');
          console.log(`- reconciliation_status: ${updatedTransaction.reconciliation_status}`);
          console.log(`- status_conciliacao: ${updatedTransaction.status_conciliacao}`);
          console.log(`- matched_lancamento_id: ${updatedTransaction.matched_lancamento_id}`);
          console.log(`- match_confidence: ${updatedTransaction.match_confidence}`);
          
          if (updatedTransaction.reconciliation_status !== transaction.reconciliation_status) {
            console.log('✅ STATUS ALTERADO NO BANCO! Conciliação funcionando.');
          } else {
            console.log('⚠️ Status não foi alterado no banco.');
          }
        }
        
        // 5. Testar desconciliação
        console.log('\n🔄 Testando desconciliação...');
        
        const unlinkResponse = await fetch(`http://localhost:3000/api/reconciliation/unlink?bank_transaction_id=${transaction.id}`, {
          method: 'DELETE'
        });
        
        if (unlinkResponse.ok) {
          const unlinkResult = await unlinkResponse.json();
          console.log('✅ API de desconciliação respondeu:', unlinkResult);
          
          // Verificar mudanças após desconciliação
          const { data: revertedTransaction } = await supabase
            .from('bank_transactions')
            .select('*')
            .eq('id', transaction.id)
            .single();
          
          if (revertedTransaction) {
            console.log('\n📊 Status DEPOIS da desconciliação:');
            console.log(`- reconciliation_status: ${revertedTransaction.reconciliation_status}`);
            console.log(`- status_conciliacao: ${revertedTransaction.status_conciliacao}`);
            console.log(`- matched_lancamento_id: ${revertedTransaction.matched_lancamento_id}`);
            
            if (revertedTransaction.reconciliation_status === 'pending') {
              console.log('✅ DESCONCILIAÇÃO FUNCIONANDO! Status voltou para pending.');
            } else {
              console.log('⚠️ Desconciliação pode não ter funcionado corretamente.');
            }
          }
        } else {
          console.log('❌ Erro na API de desconciliação:', unlinkResponse.status);
        }
        
      } else {
        console.log('❌ Erro na API de conciliação:', response.status);
        const errorText = await response.text();
        console.log('Erro:', errorText);
      }
    } catch (fetchError) {
      console.log('⚠️ Não foi possível conectar às APIs (servidor pode não estar rodando)');
      console.log('Erro:', fetchError.message);
    }
    
  } catch (e) {
    console.error('❌ Erro geral:', e.message);
  }
}

testConciliationChanges().then(() => process.exit(0));
