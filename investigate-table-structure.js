const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function investigateStructure() {
  console.log('🔍 Investigando estrutura das tabelas...\n');
  
  try {
    // 1. Verificar estrutura da tabela bank_transactions
    console.log('📋 1. Verificando sample de bank_transactions:');
    const { data: bankSample, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .limit(3);
    
    if (bankSample && bankSample.length > 0) {
      console.log('   Colunas bank_transactions:', Object.keys(bankSample[0]));
      console.log('   Sample:', {
        id: bankSample[0].id,
        reconciliation_status: bankSample[0].reconciliation_status,
        status_conciliacao: bankSample[0].status_conciliacao,
        memo: bankSample[0].memo
      });
    }
    
    console.log('\n📋 2. Verificando sample de transaction_matches:');
    const { data: matchSample, error: matchError } = await supabase
      .from('transaction_matches')
      .select('*')
      .limit(3);
    
    if (matchSample && matchSample.length > 0) {
      console.log('   Colunas transaction_matches:', Object.keys(matchSample[0]));
      console.log('   Sample:', {
        id: matchSample[0].id,
        bank_transaction_id: matchSample[0].bank_transaction_id,
        lancamento_id: matchSample[0].lancamento_id,
        system_transaction_id: matchSample[0].system_transaction_id
      });
    }
    
    // 3. Testar um ID específico do teste
    const testId = '758d207e-2f80-4d51-b9c5-de47dac831aa';
    console.log(`\n📋 3. Buscando lançamento ${testId.substring(0, 8)}... em transaction_matches:`);
    
    const { data: matches, error: matchesError } = await supabase
      .from('transaction_matches')
      .select(`
        id,
        bank_transaction_id,
        lancamento_id,
        system_transaction_id,
        status,
        bank_transactions:bank_transaction_id (
          id,
          reconciliation_status,
          status_conciliacao,
          memo,
          amount
        )
      `)
      .or(`lancamento_id.eq.${testId},system_transaction_id.eq.${testId}`)
      .limit(5);
    
    if (matches && matches.length > 0) {
      console.log('   ✅ Encontrado em transaction_matches:', matches.length, 'registros');
      matches.forEach((match, index) => {
        console.log(`   ${index + 1}.`, {
          matchId: match.id,
          bankTransactionId: match.bank_transaction_id,
          lancamentoId: match.lancamento_id,
          systemTransactionId: match.system_transaction_id,
          bankTransaction: match.bank_transactions
        });
      });
    } else {
      console.log('   ❌ Não encontrado em transaction_matches');
    }
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  }
}

investigateStructure();
