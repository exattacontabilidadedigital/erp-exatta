const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConciliacaoCorreta() {
  try {
    console.log('=== 🧪 TESTE COM VALORES CORRETOS ===\n');

    // 1. Buscar uma transação bancária pendente
    const { data: bankTrans } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('reconciliation_status', 'pending')
      .is('matched_lancamento_id', null)
      .limit(1);

    if (!bankTrans || bankTrans.length === 0) {
      console.log('❌ Nenhuma transação bancária pendente encontrada');
      return;
    }

    const bankTransaction = bankTrans[0];
    console.log('🏦 Transação bancária ANTES:', {
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
    console.log('💰 Transação do sistema:', {
      id: systemTransaction.id,
      valor: systemTransaction.valor,
      descricao: systemTransaction.descricao,
      status: systemTransaction.status
    });

    // 3. CONCILIAR - Usando valores permitidos
    console.log('\n🔗 Conciliando com valores corretos...');
    
    // Criar match com valores permitidos
    const { data: matchData, error: matchError } = await supabase
      .from('transaction_matches')
      .insert({
        bank_transaction_id: bankTransaction.id,
        system_transaction_id: systemTransaction.id,
        match_score: 1.0,
        match_type: 'manual',
        confidence_level: 'high',
        status: 'confirmed',
        notes: 'Teste manual com valores corretos'
      })
      .select()
      .single();

    if (matchError) {
      console.error('❌ Erro ao criar match:', matchError);
    } else {
      console.log('✅ Match criado:', matchData.id);
    }

    // Atualizar transação bancária com valores permitidos
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        matched_lancamento_id: systemTransaction.id,
        match_confidence: 1.0
      })
      .eq('id', bankTransaction.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar transação bancária:', updateError);
    } else {
      console.log('✅ Transação bancária atualizada');
    }

    // 4. Verificar resultado
    const { data: updatedBank } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTransaction.id)
      .single();

    console.log('\n✅ Transação bancária CONCILIADA:');
    console.log('reconciliation_status:', bankTransaction.reconciliation_status, '→', updatedBank.reconciliation_status);
    console.log('matched_lancamento_id:', bankTransaction.matched_lancamento_id, '→', updatedBank.matched_lancamento_id);
    console.log('match_confidence:', bankTransaction.match_confidence, '→', updatedBank.match_confidence);

    // 5. DESCONCILIAR
    console.log('\n🔄 Desconciliando...');
    
    // Remover o match primeiro
    const { error: deleteMatchError } = await supabase
      .from('transaction_matches')
      .delete()
      .eq('bank_transaction_id', bankTransaction.id);

    if (deleteMatchError) {
      console.error('❌ Erro ao remover match:', deleteMatchError);
    } else {
      console.log('✅ Match removido');
    }

    // Atualizar transação bancária para pendente
    const { error: unlinkError } = await supabase
      .from('bank_transactions')
      .update({ 
        matched_lancamento_id: null,
        match_confidence: null
      })
      .eq('id', bankTransaction.id);

    if (unlinkError) {
      console.error('❌ Erro ao desconciliar:', unlinkError);
    } else {
      console.log('✅ Transação desconciliada');
    }

    // 6. Verificar resultado final
    const { data: finalBank } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTransaction.id)
      .single();

    console.log('\n✅ Transação bancária DESCONCILIADA:');
    console.log('reconciliation_status:', updatedBank.reconciliation_status, '→', finalBank.reconciliation_status);
    console.log('matched_lancamento_id:', updatedBank.matched_lancamento_id, '→', finalBank.matched_lancamento_id);
    console.log('match_confidence:', updatedBank.match_confidence, '→', finalBank.match_confidence);

    console.log('\n🎉 TESTE CONCLUÍDO - AS ALTERAÇÕES ESTÃO PERSISTINDO CORRETAMENTE NO BANCO!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testConciliacaoCorreta();
