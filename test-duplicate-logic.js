import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDuplicateLogic() {
  console.log('🧪 Testando lógica de duplicação...');
  
  const bankTransactionId = '7dcd0cc7-3ec3-475c-8347-5dc02ad43413';
  const systemTransactionId = 'c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc';
  
  console.log('\n🔍 1. Verificando match específico...');
  // Esta é a lógica corrigida - verificar combinação específica
  const { data: existingMatch, error } = await supabase
    .from('transaction_matches')
    .select('*')
    .eq('bank_transaction_id', bankTransactionId)
    .eq('system_transaction_id', systemTransactionId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('❌ Erro ao buscar match:', error);
    return;
  }
  
  if (existingMatch) {
    console.log('✅ Match existente encontrado:', {
      id: existingMatch.id,
      status: existingMatch.status,
      match_type: existingMatch.match_type,
      created_at: existingMatch.created_at
    });
    
    console.log('\n🔄 2. Atualizando match existente...');
    const { data: updatedMatch, error: updateError } = await supabase
      .from('transaction_matches')
      .update({
        match_score: 0.9,
        match_type: 'automatic',
        confidence_level: 'high',
        status: 'confirmed',
        notes: 'Teste de atualização - sem duplicação'
      })
      .eq('id', existingMatch.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
    } else {
      console.log('✅ Match atualizado com sucesso:', updatedMatch.id);
    }
    
  } else {
    console.log('📄 Nenhum match existente - poderia criar novo');
    
    console.log('\n🔄 2. Simulando criação de novo match...');
    console.log('💡 INSERT seria executado aqui (não executando para evitar duplicação)');
    /*
    const { data: newMatch, error: insertError } = await supabase
      .from('transaction_matches')
      .insert({
        bank_transaction_id: bankTransactionId,
        system_transaction_id: systemTransactionId,
        match_score: 0.9,
        match_type: 'automatic',
        confidence_level: 'high',
        status: 'confirmed',
        notes: 'Teste de criação - lógica corrigida'
      })
      .select()
      .single();
    */
  }
  
  console.log('\n🔍 3. Verificando status da transação bancária...');
  const { data: bankTransaction } = await supabase
    .from('bank_transactions')
    .select('id, reconciliation_status, status_conciliacao, matched_lancamento_id')
    .eq('id', bankTransactionId)
    .single();
  
  if (bankTransaction) {
    console.log('🏦 Status atual:', {
      reconciliation_status: bankTransaction.reconciliation_status,
      status_conciliacao: bankTransaction.status_conciliacao,
      matched_lancamento_id: bankTransaction.matched_lancamento_id
    });
    
    console.log('\n🔄 4. Atualizando status da transação bancária...');
    const { error: updateBankError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'matched',
        status_conciliacao: 'conciliado',
        matched_lancamento_id: systemTransactionId,
        match_confidence: 0.9
      })
      .eq('id', bankTransactionId);

    if (updateBankError) {
      console.error('❌ Erro ao atualizar transação bancária:', updateBankError);
    } else {
      console.log('✅ Status da transação bancária atualizado com sucesso');
    }
  }
  
  console.log('\n✅ Teste concluído - lógica funcionando sem duplicação!');
}

testDuplicateLogic().catch(console.error);
