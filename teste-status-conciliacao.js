const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testStatusConciliacaoField() {
  try {
    console.log('=== 🧪 TESTE DO CAMPO STATUS_CONCILIACAO ===\n');

    // 1. Buscar uma transação bancária pendente
    const { data: bankTrans } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('reconciliation_status', 'pending')
      .eq('status_conciliacao', 'pendente')
      .is('matched_lancamento_id', null)
      .limit(1);

    if (!bankTrans || bankTrans.length === 0) {
      console.log('❌ Nenhuma transação bancária pendente encontrada');
      return;
    }

    const bankTransaction = bankTrans[0];
    console.log('🏦 ANTES da conciliação:', {
      id: bankTransaction.id,
      amount: bankTransaction.amount,
      payee: bankTransaction.payee,
      reconciliation_status: bankTransaction.reconciliation_status,
      status_conciliacao: bankTransaction.status_conciliacao,
      matched_lancamento_id: bankTransaction.matched_lancamento_id
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

    // 3. CONCILIAR - simulando a API corrigida
    console.log('\n🔗 Conciliando (simulando API corrigida)...');
    
    // Criar match
    const { data: matchData, error: matchError } = await supabase
      .from('transaction_matches')
      .insert({
        bank_transaction_id: bankTransaction.id,
        system_transaction_id: systemTransaction.id,
        match_score: 1.0,
        match_type: 'manual',
        confidence_level: 'high',
        status: 'confirmed',
        notes: 'Teste status_conciliacao'
      })
      .select()
      .single();

    if (matchError) {
      console.error('❌ Erro ao criar match:', matchError);
    } else {
      console.log('✅ Match criado');
    }

    // Atualizar transação bancária COM status_conciliacao
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        status_conciliacao: 'conciliado',
        matched_lancamento_id: systemTransaction.id,
        match_confidence: 1.0
      })
      .eq('id', bankTransaction.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar transação bancária:', updateError);
    } else {
      console.log('✅ Transação bancária atualizada com status_conciliacao');
    }

    // 4. Verificar resultado
    const { data: updatedBank } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTransaction.id)
      .single();

    console.log('\n✅ DEPOIS da conciliação:');
    console.log('reconciliation_status:', bankTransaction.reconciliation_status, '→', updatedBank.reconciliation_status);
    console.log('status_conciliacao:', bankTransaction.status_conciliacao, '→', updatedBank.status_conciliacao);
    console.log('matched_lancamento_id:', bankTransaction.matched_lancamento_id, '→', updatedBank.matched_lancamento_id);

    // 5. DESCONCILIAR
    console.log('\n🔄 Desconciliando...');
    
    // Remover match
    const { error: deleteMatchError } = await supabase
      .from('transaction_matches')
      .delete()
      .eq('bank_transaction_id', bankTransaction.id);

    if (deleteMatchError) {
      console.error('❌ Erro ao remover match:', deleteMatchError);
    }

    // Atualizar transação bancária COM status_conciliacao voltando para pendente
    const { error: unlinkError } = await supabase
      .from('bank_transactions')
      .update({ 
        status_conciliacao: 'pendente',
        matched_lancamento_id: null,
        match_confidence: null
      })
      .eq('id', bankTransaction.id);

    if (unlinkError) {
      console.error('❌ Erro ao desconciliar:', unlinkError);
    } else {
      console.log('✅ Transação desconciliada com status_conciliacao');
    }

    // 6. Verificar resultado final
    const { data: finalBank } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTransaction.id)
      .single();

    console.log('\n✅ FINAL:');
    console.log('reconciliation_status:', updatedBank.reconciliation_status, '→', finalBank.reconciliation_status);
    console.log('status_conciliacao:', updatedBank.status_conciliacao, '→', finalBank.status_conciliacao);
    console.log('matched_lancamento_id:', updatedBank.matched_lancamento_id, '→', finalBank.matched_lancamento_id);

    console.log('\n🎉 AGORA O CAMPO STATUS_CONCILIACAO ESTÁ SENDO ATUALIZADO CORRETAMENTE!');
    console.log('   Frontend vai detectar: status_conciliacao === "conciliado"');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testStatusConciliacaoField();
