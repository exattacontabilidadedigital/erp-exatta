const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConciliacao() {
  try {
    console.log('=== 🧪 TESTE DE CONCILIAÇÃO REAL ===\n');

    // 1. Buscar uma transação bancária pendente
    const { data: bankTrans, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('reconciliation_status', 'pending')
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
      description: bankTransaction.description,
      status: bankTransaction.reconciliation_status
    });

    // 2. Buscar uma transação do sistema compatível
    const { data: systemTrans, error: systemError } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('status_conciliacao', 'pendente')
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
      status: systemTransaction.status_conciliacao
    });

    // 3. Testar a API de conciliação
    console.log('\n🔗 Testando API de conciliação...');
    
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

    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ API retornou:', result);

    // 4. Verificar se os dados foram atualizados no banco
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
      matched_lancamento_id: updatedBank.matched_lancamento_id,
      match_confidence: updatedBank.match_confidence
    });

    // Verificar transaction_matches
    const { data: matches } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bankTransaction.id);

    console.log('🔗 Matches criados/atualizados:', matches);

    // 5. Agora testar desconciliação
    console.log('\n🔄 Testando desconciliação...');
    
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
      matched_lancamento_id: finalBank.matched_lancamento_id,
      match_confidence: finalBank.match_confidence
    });

    const { data: finalMatches } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bankTransaction.id);

    console.log('🔗 Matches finais:', finalMatches);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testConciliacao();
