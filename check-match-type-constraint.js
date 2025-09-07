require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
  console.log('🔍 Verificando constraints na tabela transaction_matches...');
  
  // Primeiro, vamos ver que valores de match_type existem na tabela
  try {
    console.log('\n1️⃣ Valores existentes de match_type:');
    const { data: existingTypes, error: typesError } = await supabase
      .from('transaction_matches')
      .select('match_type')
      .not('match_type', 'is', null);
      
    if (typesError) {
      console.log('❌ Erro ao buscar tipos:', typesError);
    } else {
      const uniqueTypes = [...new Set(existingTypes.map(t => t.match_type))];
      console.log('📋 Match types existentes:', uniqueTypes);
    }
  } catch (err) {
    console.log('❌ Erro na verificação:', err.message);
  }
  
  // Vamos tentar diferentes valores para descobrir quais são aceitos
  const testValues = [
    'manual',
    'automatic',
    'exact',
    'partial',
    'suggested',
    'confirmed',
    'exact_match',
    'partial_match',
    'auto_match',
    'value_match',
    'date_match'
  ];
  
  console.log('\n2️⃣ Testando valores permitidos para match_type:');
  
  for (const testValue of testValues) {
    try {
      const testRecord = {
        bank_transaction_id: 'd0eb0bc6-c024-4880-a781-e6691ff2842e',
        system_transaction_id: '0e9d53d4-1469-4e28-973b-fc14aa39c972',
        status: 'suggested',
        match_type: testValue,
        confidence_level: 'medium',
        notes: `teste match_type: ${testValue}`
      };
      
      const { data, error } = await supabase
        .from('transaction_matches')
        .insert([testRecord])
        .select();
        
      if (error) {
        console.log(`❌ ${testValue}: ${error.message}`);
      } else {
        console.log(`✅ ${testValue}: ACEITO`);
        
        // Limpar imediatamente
        await supabase
          .from('transaction_matches')
          .delete()
          .eq('id', data[0].id);
      }
    } catch (err) {
      console.log(`❌ ${testValue}: ${err.message}`);
    }
  }
}

checkConstraints();
