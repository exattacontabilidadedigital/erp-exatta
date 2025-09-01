const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConciliacaoSimples() {
  try {
    console.log('=== 🧪 TESTE SIMPLES DE CONCILIAÇÃO ===\n');

    // 1. Buscar uma transação bancária pendente
    const { data: bankTrans } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('reconciliation_status', 'pending')
      .limit(1);

    if (!bankTrans || bankTrans.length === 0) {
      console.log('❌ Nenhuma transação bancária pendente encontrada');
      return;
    }

    const bankTransaction = bankTrans[0];
    console.log('🏦 Transação bancária:', {
      id: bankTransaction.id,
      amount: bankTransaction.amount,
      payee: bankTransaction.payee,
      reconciliation_status: bankTransaction.reconciliation_status,
      status_conciliacao: bankTransaction.status_conciliacao
    });

    // 2. Buscar uma transação do sistema
    const { data: systemTrans } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('status', 'pago')
      .limit(1);

    if (!systemTrans || systemTrans.length === 0) {
      console.log('❌ Nenhuma transação do sistema encontrada');
      return;
    }

    const systemTransaction = systemTrans[0];
    console.log('💰 Transação do sistema:', {
      id: systemTransaction.id,
      valor: systemTransaction.valor,
      descricao: systemTransaction.descricao,
      status: systemTransaction.status
    });

    // 3. Testar conciliação
    console.log('\n🔗 Testando conciliação...');
    const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: bankTransaction.id,
        system_transaction_id: systemTransaction.id,
        confidence_level: 'manual',
        rule_applied: 'test_manual'
      })
    });

    const result = await response.json();
    console.log('API Response:', response.status, result);

    // 4. Verificar resultado
    const { data: updatedBank } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTransaction.id)
      .single();

    console.log('\n✅ Resultado da conciliação:');
    console.log('Status anterior:', bankTransaction.reconciliation_status, '→', updatedBank.reconciliation_status);
    console.log('Status_conciliacao anterior:', bankTransaction.status_conciliacao, '→', updatedBank.status_conciliacao);
    console.log('Matched ID:', updatedBank.matched_lancamento_id);

    // 5. Testar desconciliação
    console.log('\n🔄 Testando desconciliação...');
    const unlinkResponse = await fetch('http://localhost:3000/api/reconciliation/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: bankTransaction.id
      })
    });

    const unlinkResult = await unlinkResponse.json();
    console.log('Unlink Response:', unlinkResponse.status, unlinkResult);

    // 6. Verificar resultado final
    const { data: finalBank } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTransaction.id)
      .single();

    console.log('\n✅ Resultado da desconciliação:');
    console.log('Status:', updatedBank.reconciliation_status, '→', finalBank.reconciliation_status);
    console.log('Status_conciliacao:', updatedBank.status_conciliacao, '→', finalBank.status_conciliacao);
    console.log('Matched ID:', updatedBank.matched_lancamento_id, '→', finalBank.matched_lancamento_id);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testConciliacaoSimples();
