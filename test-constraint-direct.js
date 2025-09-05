const { createClient } = require('@supabase/supabase-js');

// Usando as mesmas configurações da aplicação
const supabase = createClient(
  'https://mgppaygsulvjekgnubrf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHBheWdzdWx2amVrZ251YnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0ODQ1NzksImV4cCI6MjAzNDA2MDU3OX0.pjqE75VKP1-M6Bxf2PtTiAQO_F1VgwVqKzAVYC2u5r8'
);

async function fixConstraintsDirectly() {
  console.log('🔧 Tentando correção direta das constraints...');

  try {
    // 1. Primeiro, vamos verificar os valores atuais problemáticos
    console.log('🔍 Verificando valores atuais de reconciliation_status...');
    
    const { data: allTransactions, error: fetchError } = await supabase
      .from('bank_transactions')
      .select('id, reconciliation_status, status_conciliacao')
      .limit(10);

    if (fetchError) {
      console.log('❌ Erro ao buscar transações:', fetchError);
      return;
    }

    console.log('📊 Amostra de transações atuais:');
    allTransactions?.forEach(t => {
      console.log(`   • ID: ${t.id.substring(0, 8)}... | reconciliation: ${t.reconciliation_status} | conciliacao: ${t.status_conciliacao}`);
    });

    // 2. Tentar atualizar um registro específico que estava causando erro
    console.log('\n🔄 Testando atualização com valor correto...');
    
    const testTransactionId = '0cddd5c4-36ef-480a-a214-8faaaed7360f'; // Do erro anterior
    
    const { data: updateResult, error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'transferencia',  // Valor correto
        status_conciliacao: 'conciliado'         // Valor correto
      })
      .eq('id', testTransactionId)
      .select();

    if (updateError) {
      console.log('❌ Erro na atualização de teste:', updateError);
      console.log('💡 Isso confirma que o problema está na constraint');
      
      // Vamos tentar diferentes valores para descobrir o que está errado
      console.log('\n🧪 Testando valores individuais...');
      
      // Teste 1: Só reconciliation_status
      const { error: test1 } = await supabase
        .from('bank_transactions')
        .update({ reconciliation_status: 'sugerido' })
        .eq('id', testTransactionId);
      
      console.log('   Teste reconciliation_status="sugerido":', test1 ? 'ERRO' : 'OK');
      
      // Teste 2: Só status_conciliacao  
      const { error: test2 } = await supabase
        .from('bank_transactions')
        .update({ status_conciliacao: 'pendente' })
        .eq('id', testTransactionId);
      
      console.log('   Teste status_conciliacao="pendente":', test2 ? 'ERRO' : 'OK');
      
    } else {
      console.log('✅ Atualização de teste bem-sucedida!', updateResult);
    }

    // 3. Vamos tentar uma abordagem alternativa: usar SQL raw mais simples
    console.log('\n🔧 Tentando abordagem SQL direta...');
    
    // Primeiro, limpar possíveis valores inválidos
    const cleanupQueries = [
      "UPDATE bank_transactions SET reconciliation_status = 'sem_match' WHERE reconciliation_status IS NULL OR reconciliation_status = ''",
      "UPDATE bank_transactions SET status_conciliacao = 'pendente' WHERE status_conciliacao IS NULL OR status_conciliacao = ''"
    ];

    for (const query of cleanupQueries) {
      try {
        const { error } = await supabase.rpc('sql', { query });
        if (error) {
          console.log(`❌ Erro no SQL: ${query}`, error);
        } else {
          console.log(`✅ SQL executado: ${query.substring(0, 50)}...`);
        }
      } catch (sqlError) {
        console.log(`⚠️ Erro SQL esperado: ${sqlError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
fixConstraintsDirectly();
