import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDuplicateMatches() {
  console.log('🔍 Testando matches duplicados...');
  
  const bankTransactionId = '7dcd0cc7-3ec3-475c-8347-5dc02ad43413';
  const systemTransactionId = 'c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc';
  
  // 1. Verificar matches existentes para esta transação bancária
  console.log('\n1. Verificando matches existentes...');
  const { data: existingMatches, error } = await supabase
    .from('transaction_matches')
    .select('*')
    .eq('bank_transaction_id', bankTransactionId);
  
  if (error) {
    console.error('❌ Erro ao buscar matches:', error);
    return;
  }
  
  console.log(`📊 Matches encontrados: ${existingMatches.length}`);
  existingMatches.forEach((match, index) => {
    console.log(`   Match ${index + 1}: ID=${match.id}, System=${match.system_transaction_id}, Status=${match.status}`);
  });
  
  // 2. Verificar se há matches duplicados com a mesma combinação
  console.log('\n2. Verificando matches com mesma combinação...');
  const { data: duplicateMatches } = await supabase
    .from('transaction_matches')
    .select('*')
    .eq('bank_transaction_id', bankTransactionId)
    .eq('system_transaction_id', systemTransactionId);
  
  console.log(`📊 Matches duplicados: ${duplicateMatches?.length || 0}`);
  duplicateMatches?.forEach((match, index) => {
    console.log(`   Duplicado ${index + 1}: ID=${match.id}, Status=${match.status}, Criado=${match.created_at}`);
  });
  
  // 3. Verificar status da transação bancária
  console.log('\n3. Status da transação bancária...');
  const { data: bankTransaction } = await supabase
    .from('bank_transactions')
    .select('id, reconciliation_status, status_conciliacao, matched_lancamento_id')
    .eq('id', bankTransactionId)
    .single();
  
  if (bankTransaction) {
    console.log('🏦 Transação bancária:', {
      id: bankTransaction.id,
      reconciliation_status: bankTransaction.reconciliation_status,
      status_conciliacao: bankTransaction.status_conciliacao,
      matched_lancamento_id: bankTransaction.matched_lancamento_id
    });
  }
  
  // 4. Verificar todos os matches na tabela
  console.log('\n4. Total de matches na tabela...');
  const { data: allMatches, count } = await supabase
    .from('transaction_matches')
    .select('*', { count: 'exact' });
  
  console.log(`📊 Total de matches: ${count}`);
  
  // 5. Buscar matches por grupos de duplicados
  console.log('\n5. Buscando grupos duplicados...');
  const { data: duplicateGroups } = await supabase
    .from('transaction_matches')
    .select('bank_transaction_id, system_transaction_id, count(*)')
    .group('bank_transaction_id, system_transaction_id')
    .having('count(*) > 1');
  
  if (duplicateGroups && duplicateGroups.length > 0) {
    console.log(`⚠️ Grupos com duplicatas encontrados: ${duplicateGroups.length}`);
    duplicateGroups.forEach(group => {
      console.log(`   Bank: ${group.bank_transaction_id}, System: ${group.system_transaction_id}, Count: ${group.count}`);
    });
  } else {
    console.log('✅ Nenhum grupo duplicado encontrado');
  }
}

testDuplicateMatches().catch(console.error);
