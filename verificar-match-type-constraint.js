// Script para verificar os valores permitidos no match_type
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configurações do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarValoresPermitidos() {
  console.log('🔍 Verificando valores existentes para match_type...');
  
  // Buscar todos os valores únicos de match_type
  const { data, error } = await supabase
    .from('transaction_matches')
    .select('match_type')
    .not('match_type', 'is', null);

  if (error) {
    console.error('❌ Erro ao consultar match_type:', error);
    return;
  }

  if (data && data.length > 0) {
    const uniqueValues = [...new Set(data.map(row => row.match_type))];
    console.log('✅ Valores existentes para match_type:');
    uniqueValues.forEach(value => {
      console.log(`  - "${value}"`);
    });
    
    console.log('\n📊 Total de registros por tipo:');
    const counts = {};
    data.forEach(row => {
      counts[row.match_type] = (counts[row.match_type] || 0) + 1;
    });
    
    Object.entries(counts).forEach(([type, count]) => {
      console.log(`  - "${type}": ${count} registros`);
    });
  } else {
    console.log('⚠️ Nenhum registro encontrado com match_type definido');
  }
  
  // Tentar inserir alguns valores de teste para descobrir quais são aceitos
  console.log('\n🧪 Testando valores possíveis...');
  
  const testValues = ['manual', 'automatic', 'exact', 'suggested', 'multiple_transactions', 'multiple', 'partial'];
  
  for (const testValue of testValues) {
    const testData = {
      bank_transaction_id: `test-${Date.now()}-${Math.random()}`,
      system_transaction_id: `test-${Date.now()}-${Math.random()}`,
      match_type: testValue,
      confidence_level: 'medium'
    };
    
    const { error: insertError } = await supabase
      .from('transaction_matches')
      .insert([testData]);
    
    if (insertError) {
      console.log(`❌ "${testValue}": ${insertError.message}`);
    } else {
      console.log(`✅ "${testValue}": aceito`);
      
      // Remover o registro de teste
      await supabase
        .from('transaction_matches')
        .delete()
        .eq('bank_transaction_id', testData.bank_transaction_id);
    }
  }
}

verificarValoresPermitidos().catch(console.error);
