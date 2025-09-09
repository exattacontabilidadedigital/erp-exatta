// Script para verificar a estrutura da tabela bank_transactions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configurações do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstruturaBankTransactions() {
  console.log('🔍 Verificando estrutura da tabela bank_transactions...');
  
  // Buscar pelo menos um registro para ver a estrutura
  const { data, error } = await supabase
    .from('bank_transactions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao consultar bank_transactions:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Estrutura da tabela bank_transactions:');
    console.log('Colunas disponíveis:', Object.keys(data[0]));
    console.log('\n📊 Exemplo de registro:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️ Nenhum registro encontrado na tabela bank_transactions');
  }
}

verificarEstruturaBankTransactions().catch(console.error);
