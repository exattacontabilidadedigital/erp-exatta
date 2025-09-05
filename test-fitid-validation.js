const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kwxhtujmlrwfpngnkukl.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGh0dWptbHJ3ZnBuZ25rdWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMTUyMzYsImV4cCI6MjA0ODg5MTIzNn0.Wt4Cjz6LBJnYmCGCo7JUJrU1pJl6x_ogtLQ8QX2d7fE'
);

async function testFITIDValidation() {
  console.log('🔒 TESTE: Validação de FITID para Prevenção de Erros');
  console.log('=' .repeat(70));

  try {
    // 1. Buscar transações com FITID
    console.log('\n📊 1. Buscando transações bancárias com FITID...');
    
    const { data: transactionsWithFITID, error: searchError } = await supabase
      .from('bank_transactions')
      .select('id, fit_id, status_conciliacao, reconciliation_status, amount, posted_at, memo, payee')
      .not('fit_id', 'is', null)
      .limit(10)
      .order('created_at', { ascending: false });

    if (searchError) {
      console.error('❌ Erro ao buscar transações:', searchError);
      return;
    }

    console.log(`✅ Encontradas ${transactionsWithFITID.length} transações com FITID:`);
    transactionsWithFITID.forEach((trans, index) => {
      console.log(`   ${index + 1}. FITID: ${trans.fit_id} | Status: ${trans.status_conciliacao} | Valor: ${trans.amount}`);
    });

    if (transactionsWithFITID.length === 0) {
      console.log('⚠️  Nenhuma transação com FITID encontrada');
      return;
    }

    // 2. Verificar integridade dos FITIDs
    console.log('\n🔍 2. Verificando integridade dos FITIDs...');
    
    const fitIds = transactionsWithFITID.map(t => t.fit_id);
    const fitIdCounts = {};
    
    for (const fitId of fitIds) {
      const { data: duplicates, error } = await supabase
        .from('bank_transactions')
        .select('id, status_conciliacao, amount')
        .eq('fit_id', fitId);
      
      if (!error && duplicates) {
        fitIdCounts[fitId] = {
          total: duplicates.length,
          conciliadas: duplicates.filter(t => t.status_conciliacao === 'conciliado').length,
          pendentes: duplicates.filter(t => t.status_conciliacao === 'pendente').length
        };
      }
    }

    console.log('📋 Estatísticas por FITID:');
    Object.entries(fitIdCounts).forEach(([fitId, stats]) => {
      const hasIssue = stats.total > 1 || stats.conciliadas > 1;
      const icon = hasIssue ? '⚠️' : '✅';
      console.log(`   ${icon} ${fitId}: ${stats.total} total, ${stats.conciliadas} conciliadas, ${stats.pendentes} pendentes`);
    });

    // 3. Teste de conciliação com FITID já usado
    console.log('\n🧪 3. Testando prevenção de duplicação por FITID...');
    
    const conciliadaExample = transactionsWithFITID.find(t => t.status_conciliacao === 'conciliado');
    const pendenteExample = transactionsWithFITID.find(t => t.status_conciliacao === 'pendente');

    if (conciliadaExample) {
      console.log(`🎯 Testando FITID já conciliado: ${conciliadaExample.fit_id}`);
      
      // Simular tentativa de nova conciliação
      const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: conciliadaExample.id,
          system_transaction_id: 'test-system-id',
          confidence_level: 'manual',
          rule_applied: 'test_fitid_validation'
        })
      });

      const result = await response.json();
      
      if (response.status === 409) {
        console.log('✅ Prevenção funcionando: API rejeitou corretamente a conciliação duplicada');
        console.log(`   Mensagem: ${result.message}`);
        console.log(`   FITID: ${result.fit_id}`);
      } else {
        console.log('❌ PROBLEMA: API permitiu conciliação duplicada!');
        console.log(`   Status: ${response.status}`);
        console.log(`   Resposta: ${JSON.stringify(result)}`);
      }
    }

    // 4. Teste de conciliação normal
    if (pendenteExample) {
      console.log(`\n🎯 Testando FITID pendente válido: ${pendenteExample.fit_id}`);
      
      // Buscar um lançamento do sistema para testar
      const { data: systemTransactions } = await supabase
        .from('lancamentos')
        .select('id')
        .limit(1);

      if (systemTransactions && systemTransactions.length > 0) {
        const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bank_transaction_id: pendenteExample.id,
            system_transaction_id: systemTransactions[0].id,
            confidence_level: 'manual',
            rule_applied: 'test_fitid_valid'
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Conciliação válida executada com sucesso');
          console.log(`   FITID: ${pendenteExample.fit_id} agora está conciliado`);
        } else {
          console.log('ℹ️  Conciliação não executada (pode haver outras validações)');
          console.log(`   Status: ${response.status}`);
          console.log(`   Mensagem: ${result.message || 'N/A'}`);
        }
      }
    }

    // 5. Relatório final
    console.log('\n📊 5. RELATÓRIO FINAL DE FITID:');
    
    const totalComFITID = transactionsWithFITID.length;
    const { count: totalSemFITID } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .is('fit_id', null);

    const problematicos = Object.values(fitIdCounts).filter(stats => 
      stats.total > 1 || stats.conciliadas > 1
    ).length;

    console.log(`   📈 Transações com FITID: ${totalComFITID}`);
    console.log(`   📉 Transações sem FITID: ${totalSemFITID || 0}`);
    console.log(`   ⚠️  FITIDs problemáticos: ${problematicos}`);
    console.log(`   🔒 Cobertura FITID: ${totalComFITID > 0 ? ((totalComFITID / (totalComFITID + (totalSemFITID || 0))) * 100).toFixed(1) : 0}%`);

    if (problematicos === 0) {
      console.log('\n🎉 EXCELENTE: Nenhum problema de integridade FITID detectado!');
    } else {
      console.log(`\n⚠️  ATENÇÃO: ${problematicos} FITIDs com possíveis problemas de duplicação`);
    }

  } catch (error) {
    console.error('❌ Erro no teste FITID:', error);
  }
}

// Executar o teste
testFITIDValidation();
