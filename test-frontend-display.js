import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFrontendDisplay() {
  console.log('🖥️ Testando exibição do frontend...');
  
  const bankTransactionId = '7dcd0cc7-3ec3-475c-8347-5dc02ad43413';
  
  // 1. Verificar estado atual da transação
  console.log('\n1. Estado atual da transação bancária:');
  const { data: bankTransaction } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('id', bankTransactionId)
    .single();
  
  if (bankTransaction) {
    console.log('🏦 Transação bancária:', {
      id: bankTransaction.id,
      memo: bankTransaction.memo,
      amount: bankTransaction.amount,
      reconciliation_status: bankTransaction.reconciliation_status,
      status_conciliacao: bankTransaction.status_conciliacao,
      matched_lancamento_id: bankTransaction.matched_lancamento_id
    });
    
    // 2. Simular lógica do frontend
    console.log('\n2. Simulando lógica do frontend:');
    
    // Esta é a condição que o frontend usa para verificar se está conciliado
    const isAlreadyConciliated = bankTransaction.status_conciliacao === 'conciliado';
    console.log(`   📊 status_conciliacao === 'conciliado': ${isAlreadyConciliated}`);
    
    // Cor que seria aplicada
    if (isAlreadyConciliated) {
      console.log('   🎨 Cor aplicada: bg-green-100 border-green-300 (VERDE - CONCILIADO)');
    } else {
      console.log('   🎨 Cor aplicada: baseada no status do pair (não conciliado)');
    }
    
    // 3. Verificar match relacionado
    console.log('\n3. Match relacionado:');
    const { data: match } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bankTransactionId)
      .eq('system_transaction_id', bankTransaction.matched_lancamento_id)
      .single();
    
    if (match) {
      console.log('🔗 Match encontrado:', {
        id: match.id,
        status: match.status,
        match_type: match.match_type,
        confidence_level: match.confidence_level
      });
    } else {
      console.log('❌ Nenhum match encontrado');
    }
    
    // 4. Verificar se tudo está correto para exibição
    console.log('\n4. Status de exibição:');
    if (bankTransaction.status_conciliacao === 'conciliado' && 
        bankTransaction.reconciliation_status === 'matched' &&
        bankTransaction.matched_lancamento_id) {
      console.log('✅ TUDO CORRETO - Card deveria aparecer VERDE (conciliado)');
    } else {
      console.log('❌ Algo está inconsistente:');
      console.log(`   - status_conciliacao: ${bankTransaction.status_conciliacao} (deveria ser 'conciliado')`);
      console.log(`   - reconciliation_status: ${bankTransaction.reconciliation_status} (deveria ser 'matched')`);
      console.log(`   - matched_lancamento_id: ${bankTransaction.matched_lancamento_id} (deveria ter valor)`);
    }
  } else {
    console.log('❌ Transação não encontrada');
  }
}

testFrontendDisplay().catch(console.error);
