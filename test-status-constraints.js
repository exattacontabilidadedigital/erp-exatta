const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mgppaygsulvjekgnubrf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHBheWdzdWx2amVrZ251YnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0ODQ1NzksImV4cCI6MjAzNDA2MDU3OX0.pjqE75VKP1-M6Bxf2PtTiAQO_F1VgwVqKzAVYC2u5r8'
);

async function checkConstraints() {
  console.log('🔍 Verificando constraints de status_conciliacao...');

  try {
    // Vamos verificar quais valores estão sendo usados atualmente
    const { data: currentValues, error } = await supabase
      .from('bank_transactions')
      .select('status_conciliacao')
      .not('status_conciliacao', 'is', null)
      .limit(20);

    if (error) {
      console.log('❌ Erro ao buscar valores atuais:', error);
    } else {
      const uniqueValues = [...new Set(currentValues.map(v => v.status_conciliacao))];
      console.log('📊 Valores atuais de status_conciliacao na tabela:', uniqueValues);
    }

    // Vamos tentar atualizar com diferentes valores para descobrir o que é aceito
    const testTransactionId = '7aec8041-6b83-4dff-847a-f7d3c6d2defd';
    
    const testValues = ['pendente', 'conciliado', 'desconciliado', 'desvinculado', 'ignorado'];
    
    for (const testValue of testValues) {
      console.log(`\n🧪 Testando valor: "${testValue}"`);
      
      const { error } = await supabase
        .from('bank_transactions')
        .update({ status_conciliacao: testValue })
        .eq('id', testTransactionId);
      
      if (error) {
        console.log(`❌ "${testValue}" rejeitado:`, error.message);
      } else {
        console.log(`✅ "${testValue}" aceito!`);
        break; // Para no primeiro que funcionar
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkConstraints();
