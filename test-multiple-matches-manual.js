require('dotenv').config({ path: '.env.local' });
const { createClient     // 4. Fazer chamada para a API de conciliação
    const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {= require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testMultipleMatchesPreservation() {
  console.log('🔍 TESTE: Verificando preservação de múltiplos matches após conciliação\n');

  try {
    // 1. Buscar todos os matches suggested
    console.log('1. Buscando todos os matches sugeridos...');
    const { data: allMatches, error: matchError } = await supabase
      .from('transaction_matches')
      .select('bank_transaction_id, system_transaction_id, status, system_amount')
      .eq('status', 'suggested');

    if (matchError) {
      console.log('❌ Erro ao buscar matches:', matchError);
      return;
    }

    console.log(`📊 Total de matches sugeridos: ${allMatches?.length || 0}`);

    // 2. Agrupar por bank_transaction_id para encontrar múltiplos matches
    const groupedMatches = {};
    allMatches?.forEach(match => {
      if (!groupedMatches[match.bank_transaction_id]) {
        groupedMatches[match.bank_transaction_id] = [];
      }
      groupedMatches[match.bank_transaction_id].push(match);
    });

    // Encontrar transações com múltiplos matches
    const multipleMatchTransactions = Object.keys(groupedMatches).filter(
      transactionId => groupedMatches[transactionId].length > 1
    );

    console.log(`📊 Transações com múltiplos matches: ${multipleMatchTransactions.length}`);

    if (multipleMatchTransactions.length === 0) {
      console.log('ℹ️  Nenhuma transação com múltiplos matches encontrada para teste');
      return;
    }

    // 3. Pegar uma transação específica com múltiplos matches
    const transactionId = multipleMatchTransactions[0];
    console.log(`\n2. Analisando transação ID: ${transactionId}`);

    // Verificar matches antes da conciliação
    const matchesBefore = groupedMatches[transactionId];

    console.log(`📝 Matches antes da conciliação: ${matchesBefore?.length || 0}`);
    matchesBefore?.forEach((match, index) => {
      console.log(`   Match ${index + 1}: Sistema ${match.system_transaction_id}, Status: ${match.status}`);
    });

    // 3. Simular conciliação (via API) - testando apenas o primeiro match
    console.log('\n3. Simulando conciliação do primeiro match via API...');
    
    const firstMatch = matchesBefore[0];
    const conciliationData = {
      bank_transaction_id: transactionId,
      system_transaction_id: firstMatch.system_transaction_id,
      confidence_level: 'high',
      rule_applied: 'manual'
    };

    console.log('📤 Dados da conciliação:', JSON.stringify(conciliationData, null, 2));

    // 4. Fazer chamada para a API de conciliação
    const response = await fetch('http://localhost:3001/api/reconciliation/conciliate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conciliationData)
    });

    if (!response.ok) {
      console.log(`❌ Erro na API de conciliação: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Resposta:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Conciliação realizada com sucesso:', result);

    // 5. Verificar matches após a conciliação
    console.log('\n4. Verificando matches após conciliação...');
    
    const { data: matchesAfter, error: afterError } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', transactionId);

    if (afterError) {
      console.log('❌ Erro ao buscar matches após:', afterError);
      return;
    }

    console.log(`📝 Matches após a conciliação: ${matchesAfter?.length || 0}`);
    matchesAfter?.forEach((match, index) => {
      console.log(`   Match ${index + 1}: Sistema ${match.system_transaction_id}, Status: ${match.status}`);
    });

    // 6. Verificar se os matches foram preservados
    const beforeCount = matchesBefore?.length || 0;
    const afterCount = matchesAfter?.length || 0;
    const confirmedMatches = matchesAfter?.filter(m => m.status === 'confirmed').length || 0;

    console.log('\n📊 RESULTADO DO TESTE:');
    console.log(`   Matches antes: ${beforeCount}`);
    console.log(`   Matches após: ${afterCount}`);
    console.log(`   Matches confirmados: ${confirmedMatches}`);

    if (afterCount === beforeCount && confirmedMatches === beforeCount) {
      console.log('✅ SUCESSO: Múltiplos matches foram preservados e confirmados!');
    } else if (afterCount === beforeCount && confirmedMatches > 0) {
      console.log('⚠️  PARCIAL: Matches preservados mas nem todos confirmados');
    } else if (afterCount < beforeCount) {
      console.log('❌ FALHA: Alguns matches foram removidos durante a conciliação');
    } else {
      console.log('❓ RESULTADO INESPERADO: Verificar manualmente');
    }

  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testMultipleMatchesPreservation();
