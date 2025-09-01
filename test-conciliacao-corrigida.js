const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConciliacaoCorrigida() {
  try {
    console.log('=== 🧪 TESTE DE CONCILIAÇÃO CORRIGIDA ===\n');

    // 1. Buscar uma transação bancária pendente
    const { data: bankTrans, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .or('reconciliation_status.eq.pending,status_conciliacao.eq.pendente')
      .limit(1);

    if (bankError) {
      console.error('❌ Erro ao buscar transação bancária:', bankError);
      return;
    }

    if (!bankTrans || bankTrans.length === 0) {
      console.log('❌ Nenhuma transação bancária pendente encontrada');
      return;
    }

    const bankTransaction = bankTrans[0];
    console.log('🏦 Transação bancária encontrada:', {
      id: bankTransaction.id,
      amount: bankTransaction.amount,
      description: bankTransaction.description || bankTransaction.payee,
      reconciliation_status: bankTransaction.reconciliation_status,
      status_conciliacao: bankTransaction.status_conciliacao
    });

    // 2. Buscar uma transação do sistema compatível
    const { data: systemTrans, error: systemError } = await supabase
      .from('lancamentos')
      .select('*')
      .or('status_conciliacao.eq.pendente,status_conciliacao.is.null')
      .limit(1);

    if (systemError) {
      console.error('❌ Erro ao buscar transação do sistema:', systemError);
      return;
    }

    if (!systemTrans || systemTrans.length === 0) {
      console.log('❌ Nenhuma transação do sistema pendente encontrada');
      return;
    }

    const systemTransaction = systemTrans[0];
    console.log('💰 Transação do sistema encontrada:', {
      id: systemTransaction.id,
      valor: systemTransaction.valor,
      descricao: systemTransaction.descricao,
      status_conciliacao: systemTransaction.status_conciliacao
    });

    // 3. Testar a API de conciliação CORRIGIDA
    console.log('\n🔗 Testando API de conciliação corrigida...');
    
    const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: bankTransaction.id,
        system_transaction_id: systemTransaction.id,
        confidence_level: 'manual',
        rule_applied: 'test_manual_corrigido'
      })
    });

    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ API retornou:', result);

    // 4. Verificar se os dados foram atualizados CORRETAMENTE no banco
    console.log('\n🔍 Verificando atualizações no banco...');

    // Verificar transação bancária
    const { data: updatedBank } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTransaction.id)
      .single();

    console.log('🏦 Status atualizado da transação bancária:', {
      id: updatedBank.id,
      reconciliation_status: updatedBank.reconciliation_status,
      status_conciliacao: updatedBank.status_conciliacao,
      matched_lancamento_id: updatedBank.matched_lancamento_id,
      match_confidence: updatedBank.match_confidence
    });

    // Verificar transação do sistema
    const { data: updatedSystem } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('id', systemTransaction.id)
      .single();

    console.log('💰 Status atualizado da transação do sistema:', {
      id: updatedSystem.id,
      status_conciliacao: updatedSystem.status_conciliacao
    });

    // Verificar transaction_matches
    const { data: matches } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bankTransaction.id);

    console.log('🔗 Matches criados/atualizados:', matches?.length || 0, 'registros');

    // 5. Testar desconciliação CORRIGIDA
    console.log('\n🔄 Testando desconciliação corrigida...');
    
    const unlinkResponse = await fetch('http://localhost:3000/api/reconciliation/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: bankTransaction.id
      })
    });

    if (!unlinkResponse.ok) {
      console.error('❌ Erro na API de desconciliação:', unlinkResponse.status);
      const errorText = await unlinkResponse.text();
      console.error('Resposta:', errorText);
      return;
    }

    const unlinkResult = await unlinkResponse.json();
    console.log('✅ Desconciliação retornou:', unlinkResult);

    // 6. Verificar desconciliação
    const { data: finalBank } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTransaction.id)
      .single();

    console.log('🏦 Status final da transação bancária:', {
      id: finalBank.id,
      reconciliation_status: finalBank.reconciliation_status,
      status_conciliacao: finalBank.status_conciliacao,
      matched_lancamento_id: finalBank.matched_lancamento_id,
      match_confidence: finalBank.match_confidence
    });

    const { data: finalSystem } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('id', systemTransaction.id)
      .single();

    console.log('💰 Status final da transação do sistema:', {
      id: finalSystem.id,
      status_conciliacao: finalSystem.status_conciliacao
    });

    const { data: finalMatches } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bankTransaction.id);

    console.log('🔗 Matches finais:', finalMatches?.length || 0, 'registros');

    console.log('\n✅ TESTE CONCLUÍDO - Verificar se status_conciliacao está sendo atualizado corretamente!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testConciliacaoCorrigida();
