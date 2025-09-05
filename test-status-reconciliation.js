// Teste para validar se a coluna reconciliation_status está salvando os status corretos
// Execute este arquivo para verificar se as correções funcionaram

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testReconciliationStatus() {
  console.log('🧪 TESTE: Validando status de reconciliation_status na tabela bank_transactions');
  
  try {
    // 1. Verificar quais status existem atualmente na tabela
    console.log('\n📊 1. Status atualmente presentes na tabela:');
    const { data: statusCounts, error: statusError } = await supabase
      .from('bank_transactions')
      .select('reconciliation_status')
      .not('reconciliation_status', 'is', null);
    
    if (statusError) {
      console.error('❌ Erro ao buscar status:', statusError);
      return;
    }
    
    // Contar cada status
    const statusMap = {};
    statusCounts.forEach(row => {
      const status = row.reconciliation_status;
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    console.log('Status encontrados:', statusMap);
    
    // 2. Verificar se os status documentados estão sendo usados
    console.log('\n📋 2. Validação dos status documentados:');
    const expectedStatuses = [
      'pending',      // ✅ Transações pendentes
      'sugerido',     // ✅ Sugestões automáticas
      'transferencia', // ✅ Transferências detectadas
      'conciliado',   // ✅ Transações conciliadas
      'sem_match',    // ✅ Sem correspondência
      'ignorado',     // ✅ Ignoradas pelo usuário
      'desvinculado'  // ✅ Desconciliadas
    ];
    
    expectedStatuses.forEach(status => {
      const count = statusMap[status] || 0;
      const symbol = count > 0 ? '✅' : '⚠️';
      console.log(`${symbol} ${status}: ${count} transações`);
    });
    
    // 3. Verificar se existem status não documentados (possíveis inconsistências)
    console.log('\n🔍 3. Status não documentados (possíveis inconsistências):');
    const undocumentedStatuses = Object.keys(statusMap).filter(
      status => !expectedStatuses.includes(status)
    );
    
    if (undocumentedStatuses.length > 0) {
      console.log('❌ Status não documentados encontrados:');
      undocumentedStatuses.forEach(status => {
        console.log(`   - ${status}: ${statusMap[status]} transações`);
      });
    } else {
      console.log('✅ Todos os status encontrados estão documentados');
    }
    
    // 4. Testar uma atualização de status para garantir que funciona
    console.log('\n🧪 4. Teste de atualização de status:');
    
    // Buscar uma transação para teste
    const { data: testTransaction } = await supabase
      .from('bank_transactions')
      .select('id, reconciliation_status')
      .limit(1)
      .single();
    
    if (testTransaction) {
      const originalStatus = testTransaction.reconciliation_status;
      const testStatus = 'pending'; // Status seguro para teste
      
      console.log(`Testando atualização na transação ${testTransaction.id}`);
      console.log(`Status original: ${originalStatus}`);
      
      // Atualizar para o status de teste
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({ reconciliation_status: testStatus })
        .eq('id', testTransaction.id);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar status:', updateError);
      } else {
        console.log(`✅ Status atualizado para: ${testStatus}`);
        
        // Reverter para o status original
        await supabase
          .from('bank_transactions')
          .update({ reconciliation_status: originalStatus })
          .eq('id', testTransaction.id);
        
        console.log(`✅ Status revertido para: ${originalStatus}`);
      }
    }
    
    console.log('\n✅ TESTE CONCLUÍDO');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testReconciliationStatus();
