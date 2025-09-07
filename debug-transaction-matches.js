require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verificando variáveis de ambiente:');
console.log('URL:', supabaseUrl ? 'DEFINIDA' : 'INDEFINIDA');
console.log('KEY:', supabaseKey ? 'DEFINIDA' : 'INDEFINIDA');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTransactionMatches() {
  console.log('🧪 Testando transaction_matches...');
  
  // 1. Verificar estrutura da tabela
  try {
    console.log('\n1️⃣ Verificando estrutura da tabela...');
    const { data: existingData, error: selectError } = await supabase
      .from('transaction_matches')
      .select('*')
      .limit(1);
      
    if (selectError) {
      console.log('❌ Erro no SELECT:', selectError);
    } else {
      console.log('✅ SELECT funcionou');
      if (existingData && existingData.length > 0) {
        console.log('📋 Colunas encontradas:', Object.keys(existingData[0]));
      } else {
        console.log('📋 Tabela vazia');
      }
    }
  } catch (err) {
    console.log('❌ Erro na verificação:', err.message);
  }
  
  // 2. Teste de insert mínimo
  console.log('\n2️⃣ Testando INSERT mínimo...');
  const testRecord = {
    bank_transaction_id: 'd0eb0bc6-c024-4880-a781-e6691ff2842e',
    system_transaction_id: '0e9d53d4-1469-4e28-973b-fc14aa39c972',
    status: 'suggested',
    match_type: 'manual',
    confidence_level: 'medium',
    notes: 'teste via script debug'
  };
  
  console.log('🔍 Dados para inserir:', testRecord);
  
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('transaction_matches')
      .insert([testRecord])
      .select();
      
    if (insertError) {
      console.log('❌ Erro no INSERT:', insertError);
      console.log('📝 Detalhes do erro:');
      console.log('- Code:', insertError.code);
      console.log('- Message:', insertError.message);
      console.log('- Details:', insertError.details);
      console.log('- Hint:', insertError.hint);
    } else {
      console.log('✅ INSERT bem-sucedido:', insertData);
      
      // Limpar o teste
      console.log('\n3️⃣ Limpando dados de teste...');
      const { error: deleteError } = await supabase
        .from('transaction_matches')
        .delete()
        .eq('notes', 'teste via script debug');
        
      if (deleteError) {
        console.log('⚠️ Erro ao limpar:', deleteError);
      } else {
        console.log('✅ Dados de teste removidos');
      }
    }
  } catch (err) {
    console.log('❌ Erro no INSERT (catch):', err.message);
  }
  
  // 3. Verificar se existe algum RLS que pode estar interferindo
  console.log('\n4️⃣ Testando RLS/Políticas...');
  try {
    const { data: policyData, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'transaction_matches' });
      
    if (policyError) {
      console.log('ℹ️ Não foi possível verificar políticas (normal):', policyError.message);
    } else {
      console.log('📋 Políticas encontradas:', policyData);
    }
  } catch (err) {
    console.log('ℹ️ RPC não disponível (normal)');
  }
}

testTransactionMatches();
