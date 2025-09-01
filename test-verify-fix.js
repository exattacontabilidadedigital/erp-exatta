import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyFix() {
  console.log('🔍 Verificando se o fix está funcionando...');
  
  const bankTransactionId = '7dcd0cc7-3ec3-475c-8347-5dc02ad43413';
  const systemTransactionId = 'c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc';
  
  // 1. Verificar status da transação bancária
  console.log('\n1. Status da transação bancária:');
  const { data: bankTransaction } = await supabase
    .from('bank_transactions')
    .select('id, reconciliation_status, status_conciliacao, matched_lancamento_id, match_confidence')
    .eq('id', bankTransactionId)
    .single();
  
  console.log('🏦', bankTransaction);
  
  // 2. Verificar o match
  console.log('\n2. Match específico:');
  const { data: match } = await supabase
    .from('transaction_matches')
    .select('*')
    .eq('bank_transaction_id', bankTransactionId)
    .eq('system_transaction_id', systemTransactionId)
    .single();
  
  console.log('🔗', {
    id: match?.id,
    status: match?.status,
    match_type: match?.match_type,
    confidence_level: match?.confidence_level,
    match_score: match?.match_score,
    notes: match?.notes
  });
  
  // 3. Verificar se há matches duplicados para esta transação bancária
  console.log('\n3. Todos os matches para esta transação bancária:');
  const { data: allMatches } = await supabase
    .from('transaction_matches')
    .select('id, system_transaction_id, status, created_at')
    .eq('bank_transaction_id', bankTransactionId);
  
  console.log(`📊 Total de matches: ${allMatches?.length || 0}`);
  allMatches?.forEach((m, i) => {
    console.log(`   ${i+1}. ID: ${m.id}, System: ${m.system_transaction_id}, Status: ${m.status}`);
  });
  
  console.log('\n✅ Verificação concluída!');
}

verifyFix().catch(console.error);
