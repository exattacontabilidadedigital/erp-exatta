// Script para verificar a estrutura da tabela transaction_matches
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configurações do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstrutura() {
  console.log('🔍 Verificando estrutura da tabela transaction_matches...');
  
  // Buscar pelo menos um registro para ver a estrutura
  const { data, error } = await supabase
    .from('transaction_matches')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao consultar transaction_matches:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Estrutura da tabela transaction_matches:');
    console.log('Colunas disponíveis:', Object.keys(data[0]));
    console.log('\n📊 Exemplo de registro:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️ Nenhum registro encontrado na tabela transaction_matches');
    
    // Tentar inserir um registro de teste para ver quais colunas são aceitas
    const testData = {
      bank_transaction_id: 'test',
      system_transaction_id: 'test',
      match_type: 'manual',
      confidence_level: 'medium'
    };
    
    const { error: insertError } = await supabase
      .from('transaction_matches')
      .insert([testData]);
    
    if (insertError) {
      console.log('❌ Erro ao tentar inserir teste (revela estrutura esperada):');
      console.log(insertError.message);
    }
  }
}

verificarEstrutura().catch(console.error);
