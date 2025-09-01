import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSuggestionsAPI() {
  console.log('🔄 Testando API de sugestões...');
  
  const bankAccountId = '4fd86770-32c4-4927-9d7e-8f3ded7b38fa';
  const periodStart = '2025-08-01';
  const periodEnd = '2025-08-31';
  const empresaId = '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d';
  
  // Simular exatamente o que a API de sugestões faz
  console.log('\n1. Buscando transações bancárias não conciliadas...');
  const { data: bankTransactions, error: bankError } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('bank_account_id', bankAccountId)
    .eq('empresa_id', empresaId)
    .eq('reconciliation_status', 'pending') // A API só busca 'pending'
    .gte('posted_at', periodStart)
    .lte('posted_at', periodEnd)
    .order('posted_at', { ascending: false });

  if (bankError) {
    console.error('❌ Erro ao buscar transações bancárias:', bankError);
    return;
  }

  console.log(`📊 Transações bancárias 'pending' encontradas: ${bankTransactions?.length || 0}`);
  
  // Verificar se nossa transação conciliada está na lista
  const targetTransaction = bankTransactions?.find(t => t.id === '7dcd0cc7-3ec3-475c-8347-5dc02ad43413');
  
  if (targetTransaction) {
    console.log('❌ PROBLEMA: Transação conciliada ainda aparece como "pending"');
    console.log('   Isso significa que ela ainda aparecerá na lista para conciliar');
    console.log('   Status:', targetTransaction.reconciliation_status, targetTransaction.status_conciliacao);
  } else {
    console.log('✅ Correto: Transação conciliada não aparece na lista de "pending"');
  }
  
  // Buscar TODAS as transações para ver o estado real
  console.log('\n2. Buscando TODAS as transações bancárias...');
  const { data: allTransactions } = await supabase
    .from('bank_transactions')
    .select('id, memo, amount, reconciliation_status, status_conciliacao, matched_lancamento_id')
    .eq('bank_account_id', bankAccountId)
    .eq('empresa_id', empresaId)
    .gte('posted_at', periodStart)
    .lte('posted_at', periodEnd)
    .order('posted_at', { ascending: false });

  console.log(`📊 Total de transações: ${allTransactions?.length || 0}`);
  
  // Mostrar status de cada transação
  allTransactions?.forEach((t, i) => {
    const isTarget = t.id === '7dcd0cc7-3ec3-475c-8347-5dc02ad43413';
    const marker = isTarget ? '🎯' : '  ';
    console.log(`${marker} ${i+1}. ID: ${t.id.slice(0,8)}... | memo: "${t.memo}" | amount: ${t.amount} | reconciliation: ${t.reconciliation_status} | conciliacao: ${t.status_conciliacao}`);
  });
  
  // Verificar se existem transações matched
  const matchedTransactions = allTransactions?.filter(t => t.reconciliation_status === 'matched');
  console.log(`\n📊 Transações com reconciliation_status = 'matched': ${matchedTransactions?.length || 0}`);
  
  if (matchedTransactions && matchedTransactions.length > 0) {
    console.log('🔍 Essas transações matched deveriam aparecer verdes no frontend:');
    matchedTransactions.forEach((t, i) => {
      console.log(`   ${i+1}. ${t.id.slice(0,8)}... | ${t.memo || '(sem memo)'} | ${t.amount} | ${t.status_conciliacao}`);
    });
  }
}

testSuggestionsAPI().catch(console.error);
