// Teste direto com Supabase
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectConnection() {
  console.log('🧪 Testando conexão direta com Supabase...\n');
  
  const accountId = '8ad0f3fb-88cc-4f39-8d50-f47efb3a5486';
  const empresaId = '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d';
  
  try {
    // 1. Verificar estrutura das tabelas primeiro
    console.log('🔍 Verificando estrutura das tabelas...');
    
    // Testar uma consulta simples para ver a estrutura
    const { data: bankSample, error: bankStructError } = await supabase
      .from('bank_transactions')
      .select('*')
      .limit(1);
    
    if (bankStructError) {
      console.error('❌ Erro estrutura bank_transactions:', bankStructError);
    } else {
      console.log('🏦 Estrutura bank_transactions:', Object.keys(bankSample?.[0] || {}));
    }

    const { data: lancamentosSample, error: lancamentosStructError } = await supabase
      .from('lancamentos')
      .select('*')
      .limit(1);
    
    if (lancamentosStructError) {
      console.error('❌ Erro estrutura lancamentos:', lancamentosStructError);
    } else {
      console.log('💼 Estrutura lancamentos:', Object.keys(lancamentosSample?.[0] || {}));
    }

    // 1. Testar transações bancárias
    console.log('\n🏦 Buscando transações bancárias...');
    const { data: bankTxns, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', accountId) // Campo correto!
      .gte('posted_at', '2025-08-01')
      .lte('posted_at', '2025-08-31')
      .eq('reconciliation_status', 'pending');
    
    if (bankError) {
      console.error('❌ Erro transações bancárias:', bankError);
    } else {
      console.log(`✅ Transações bancárias encontradas: ${bankTxns.length}`);
      if (bankTxns.length > 0) {
        console.log('📄 Exemplo:', {
          id: bankTxns[0].id,
          memo: bankTxns[0].memo,
          amount: bankTxns[0].amount,
          date: bankTxns[0].posted_at,
          status: bankTxns[0].reconciliation_status
        });
      }
    }

    // 2. Testar lançamentos do sistema
    console.log('\n💼 Buscando lançamentos do sistema...');
    const { data: systemTxns, error: systemError } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('data_lancamento', '2025-08-01') // Campo correto!
      .lte('data_lancamento', '2025-08-31')
      .eq('status', 'pago');
    
    if (systemError) {
      console.error('❌ Erro lançamentos:', systemError);
    } else {
      console.log(`✅ Lançamentos encontrados: ${systemTxns.length}`);
      if (systemTxns.length > 0) {
        console.log('📄 Exemplo:', {
          id: systemTxns[0].id,
          descricao: systemTxns[0].descricao,
          valor: systemTxns[0].valor,
          data: systemTxns[0].data_lancamento,
          status: systemTxns[0].status
        });
      }
    }

    // 3. Verificar dados OFX (importações bancárias)
    console.log('\n🏧 Verificando dados OFX/importações bancárias...');
    const { data: allBankTxns, error: allBankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', accountId)
      .gte('posted_at', '2025-08-01')
      .lte('posted_at', '2025-08-31')
      .order('posted_at', { ascending: false });
    
    if (allBankError) {
      console.error('❌ Erro buscando todas transações bancárias:', allBankError);
    } else {
      console.log(`✅ Total de transações bancárias (todos status): ${allBankTxns.length}`);
      if (allBankTxns.length > 0) {
        console.log('📄 Exemplos de transações bancárias:');
        allBankTxns.slice(0, 3).forEach((txn, index) => {
          console.log(`   ${index + 1}. ID: ${txn.id}`);
          console.log(`      Data: ${txn.posted_at}`);
          console.log(`      Valor: ${txn.amount}`);
          console.log(`      Memo: ${txn.memo}`);
          console.log(`      Status: ${txn.reconciliation_status}`);
          console.log('');
        });
      }
    }

    // 4. Resumo
    console.log('\n📊 Resumo dos dados reais:');
    console.log(`   - Conta ID: ${accountId}`);
    console.log(`   - Empresa ID: ${empresaId}`);
    console.log(`   - Período: 2025-08-01 a 2025-08-31`);
    console.log(`   - Transações bancárias: ${bankTxns?.length || 0}`);
    console.log(`   - Lançamentos sistema: ${systemTxns?.length || 0}`);
    
    if ((bankTxns?.length || 0) > 0 && (systemTxns?.length || 0) > 0) {
      console.log('\n🎯 Dados suficientes para conciliação! A aplicação deveria mostrar cards.');
    } else {
      console.log('\n⚠️ Dados insuficientes. Verificar se há dados neste período.');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testDirectConnection().catch(console.error);
