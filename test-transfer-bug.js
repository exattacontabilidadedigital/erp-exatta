const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kwxhtujmlrwfpngnkukl.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGh0dWptbHJ3ZnBuZ25rdWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMTUyMzYsImV4cCI6MjA0ODg5MTIzNn0.Wt4Cjz6LBJnYmCGCo7JUJrU1pJl6x_ogtLQ8QX2d7fE'
);

async function testTransferConciliation() {
  console.log('🧪 TESTE: Detecção de Conciliação Múltipla em Transferências "fdd"');
  console.log('=' .repeat(80));

  try {
    // 1. Buscar todas as transações bancárias com "fdd" e valor 10
    console.log('\n📊 1. Buscando todas as transações bancárias com "fdd" e valor 10...');
    
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .or('payee.ilike.%fdd%,memo.ilike.%fdd%')
      .order('posted_at', { ascending: true });

    if (bankError) {
      console.error('❌ Erro ao buscar transações bancárias:', bankError);
      return;
    }

    console.log(`✅ Encontradas ${bankTransactions.length} transações bancárias com "fdd" e valor 10:`);
    bankTransactions.forEach((trans, index) => {
      console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Data: ${trans.posted_at} | Desc: ${trans.payee || trans.memo || trans.descricao || 'N/A'} | Status: ${trans.status_conciliacao}`);
    });

    if (bankTransactions.length === 0) {
      console.log('⚠️  Nenhuma transação bancária encontrada');
      return;
    }

    // 2. Buscar transações do sistema correspondentes com "fdd"
    console.log('\n💼 2. Buscando transações do sistema com "fdd" e valor 10...');
    
    const { data: systemTransactions, error: systemError } = await supabase
      .from('lancamentos')
      .select('*')
      .ilike('descricao', '%fdd%')
      .order('data_lancamento', { ascending: true });

    if (systemError) {
      console.error('❌ Erro ao buscar lançamentos:', systemError);
      return;
    }

    console.log(`✅ Encontrados ${systemTransactions.length} lançamentos do sistema com "fdd":`);
    systemTransactions.forEach((trans, index) => {
      console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Data: ${trans.data_lancamento} | Desc: ${trans.descricao}`);
    });

    if (systemTransactions.length === 0) {
      console.log('⚠️  Nenhum lançamento do sistema encontrado');
      return;
    }

    // 3. Verificar matches existentes para essas transações
    console.log('\n🔗 3. Verificando matches existentes...');
    
    const bankIds = bankTransactions.map(t => t.id);
    const { data: existingMatches, error: matchError } = await supabase
      .from('transaction_matches')
      .select('*')
      .in('bank_transaction_id', bankIds)
      .order('created_at', { ascending: true });

    if (matchError) {
      console.error('❌ Erro ao buscar matches:', matchError);
      return;
    }

    console.log(`✅ Matches existentes: ${existingMatches.length}`);
    existingMatches.forEach((match, index) => {
      const bankTrans = bankTransactions.find(b => b.id === match.bank_transaction_id);
      console.log(`   ${index + 1}. Bank: ${match.bank_transaction_id.substring(0, 8)}... (${bankTrans?.posted_at}) → System: ${match.system_transaction_id.substring(0, 8)}... | Status: ${match.status} | Tipo: ${match.match_type}`);
    });

    // 4. Escolher uma transação específica para conciliar
    const targetBankTrans = bankTransactions.find(t => t.status_conciliacao === 'pendente');
    const targetSystemTrans = systemTransactions[0];

    if (!targetBankTrans) {
      console.log('⚠️  Todas as transações já estão conciliadas');
      return;
    }

    console.log(`\n🎯 4. Vamos conciliar uma transação específica:`);
    console.log(`   Bank Transaction: ${targetBankTrans.id}`);
    console.log(`   System Transaction: ${targetSystemTrans.id}`);
    console.log(`   Data Bank: ${targetBankTrans.posted_at}`);
    console.log(`   Data System: ${targetSystemTrans.data_lancamento}`);
    console.log(`   Desc Bank: ${targetBankTrans.payee || targetBankTrans.memo || targetBankTrans.descricao || 'N/A'}`);
    console.log(`   Desc System: ${targetSystemTrans.descricao}`);

    // 5. Registrar estado ANTES da conciliação
    const beforeStats = {
      pendentes: bankTransactions.filter(t => t.status_conciliacao === 'pendente').length,
      conciliadas: bankTransactions.filter(t => t.status_conciliacao === 'conciliado').length,
      ignoradas: bankTransactions.filter(t => t.status_conciliacao === 'ignorado').length
    };

    console.log('\n📊 Estado ANTES da conciliação:');
    console.log(`   Pendentes: ${beforeStats.pendentes}`);
    console.log(`   Conciliadas: ${beforeStats.conciliadas}`);
    console.log(`   Ignoradas: ${beforeStats.ignoradas}`);

    // 6. Simular a conciliação
    console.log('\n🔄 6. Fazendo a conciliação específica...');
    
    try {
      const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: targetBankTrans.id,
          system_transaction_id: targetSystemTrans.id,
          confidence_level: 'manual',
          rule_applied: 'test_specific_conciliation'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API:', response.status, errorText);
        return;
      }

      const result = await response.json();
      console.log('✅ Resultado da API:', result.message);

    } catch (apiError) {
      console.error('❌ Erro ao chamar API:', apiError.message);
      return;
    }

    // 7. Verificar estado DEPOIS da conciliação
    console.log('\n🔍 7. Verificando estado DEPOIS da conciliação...');
    
    const { data: updatedBankTransactions, error: updatedError } = await supabase
      .from('bank_transactions')
      .select('*')
      .or('payee.ilike.%fdd%,memo.ilike.%fdd%')
      .order('posted_at', { ascending: true });

    if (updatedError) {
      console.error('❌ Erro ao buscar transações atualizadas:', updatedError);
      return;
    }

    const afterStats = {
      pendentes: updatedBankTransactions.filter(t => t.status_conciliacao === 'pendente').length,
      conciliadas: updatedBankTransactions.filter(t => t.status_conciliacao === 'conciliado').length,
      ignoradas: updatedBankTransactions.filter(t => t.status_conciliacao === 'ignorado').length
    };

    console.log('\n📊 Estado DEPOIS da conciliação:');
    console.log(`   Pendentes: ${afterStats.pendentes}`);
    console.log(`   Conciliadas: ${afterStats.conciliadas}`);
    console.log(`   Ignoradas: ${afterStats.ignoradas}`);

    // 8. Análise detalhada das mudanças
    console.log('\n🔍 8. Detalhamento das mudanças:');
    
    updatedBankTransactions.forEach((updatedTrans, index) => {
      const originalTrans = bankTransactions.find(orig => orig.id === updatedTrans.id);
      const statusChanged = originalTrans && originalTrans.status_conciliacao !== updatedTrans.status_conciliacao;
      const isTarget = updatedTrans.id === targetBankTrans.id;
      
      const icon = isTarget ? '🎯' : (statusChanged ? '🔄' : '  ');
      const change = statusChanged ? ` (${originalTrans.status_conciliacao} → ${updatedTrans.status_conciliacao})` : '';
      
      console.log(`   ${icon} ${index + 1}. ID: ${updatedTrans.id.substring(0, 8)}... | Status: ${updatedTrans.status_conciliacao}${change}`);
    });

    // 9. Detecção do problema
    const conciliadasAntes = beforeStats.conciliadas;
    const conciliadasDepois = afterStats.conciliadas;
    const diferenca = conciliadasDepois - conciliadasAntes;

    console.log('\n🚨 9. ANÁLISE DO PROBLEMA:');
    console.log(`   Conciliadas ANTES: ${conciliadasAntes}`);
    console.log(`   Conciliadas DEPOIS: ${conciliadasDepois}`);
    console.log(`   DIFERENÇA: ${diferenca}`);

    if (diferenca === 1) {
      console.log('✅ COMPORTAMENTO CORRETO: Apenas 1 transação foi conciliada');
    } else if (diferenca > 1) {
      console.log(`❌ PROBLEMA CONFIRMADO: ${diferenca} transações foram conciliadas quando deveria ser apenas 1!`);
      
      // Identificar exatamente quais foram conciliadas incorretamente
      const novasConciliadas = updatedBankTransactions.filter(updated => {
        const original = bankTransactions.find(orig => orig.id === updated.id);
        return updated.status_conciliacao === 'conciliado' && 
               original && original.status_conciliacao !== 'conciliado';
      });

      console.log('\n🚨 TRANSAÇÕES CONCILIADAS INCORRETAMENTE:');
      novasConciliadas.forEach((trans, index) => {
        const isTarget = trans.id === targetBankTrans.id;
        const reason = isTarget ? ' (Era o alvo correto)' : ' (CONCILIADA POR ENGANO!)';
        console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Data: ${trans.posted_at} | Desc: ${trans.payee || trans.memo || trans.descricao}${reason}`);
      });

      // Verificar matches criados
      const { data: newMatches } = await supabase
        .from('transaction_matches')
        .select('*')
        .in('bank_transaction_id', novasConciliadas.map(t => t.id))
        .order('created_at', { ascending: false });

      console.log('\n🔗 MATCHES CRIADOS/ATUALIZADOS:');
      newMatches?.forEach((match, index) => {
        console.log(`   ${index + 1}. Bank: ${match.bank_transaction_id.substring(0, 8)}... → System: ${match.system_transaction_id.substring(0, 8)}... | Criado: ${match.created_at}`);
      });

    } else if (diferenca === 0) {
      console.log('⚠️  NENHUMA transação foi conciliada - pode haver erro na API');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testTransferConciliation();
