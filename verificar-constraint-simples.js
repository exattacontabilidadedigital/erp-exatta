// Script simplificado para testar constraint do match_type
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configurações do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarConstraint() {
  console.log('🔍 Verificando valores permitidos para match_type...');
  
  // Buscar valores existentes
  const { data, error } = await supabase
    .from('transaction_matches')
    .select('match_type')
    .not('match_type', 'is', null);

  if (data && data.length > 0) {
    const uniqueValues = [...new Set(data.map(row => row.match_type))];
    console.log('✅ Valores existentes para match_type:');
    uniqueValues.forEach(value => {
      console.log(`  - "${value}"`);
    });
  }
  
  // Vamos olhar a migração original para ver os valores permitidos
  console.log('\n🎯 Baseado na migração original, valores provavelmente permitidos:');
  console.log('  - "exact"');
  console.log('  - "manual"'); 
  console.log('  - "automatic"');
  console.log('  - "suggested"');
  console.log('  - "multiple_transactions" (se foi adicionado)');
  
  console.log('\n💡 Sugestão: usar "manual" para múltiplas seleções');
}

verificarConstraint().catch(console.error);
