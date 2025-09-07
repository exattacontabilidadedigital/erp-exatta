require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateApiCall() {
  console.log('🎯 Simulando exatamente o que a API faz...');
  
  // Dados EXATOS do que a API está tentando inserir
  const bank_transaction_id = 'd0eb0bc6-c024-4880-a781-e6691ff2842e';
  const system_transaction_ids = ['0e9d53d4-1469-4e28-973b-fc14aa39c972'];
  const primary_transaction_id = '0e9d53d4-1469-4e28-973b-fc14aa39c972';
  const finalStatus = 'transferencia';
  const finalMatchType = 'exact_match';
  const confidence_level = 'high';
  const has_discrepancy = false;
  const total_value = 10;
  
  console.log('📋 Dados simulados:');
  console.log('- bank_transaction_id:', bank_transaction_id);
  console.log('- system_transaction_ids:', system_transaction_ids);
  console.log('- finalStatus:', finalStatus);
  console.log('- finalMatchType:', finalMatchType);
  
  // Criar registros EXATAMENTE como a API faz
  const matchRecords = system_transaction_ids.map((system_transaction_id) => ({
    bank_transaction_id,
    system_transaction_id,
    status: finalStatus === 'transferencia' ? 'confirmed' : 'suggested',
    match_type: finalMatchType,
    confidence_level: finalStatus === 'transferencia' ? 'high' : (confidence_level || 'medium'),
    notes: `Primary: ${primary_transaction_id === system_transaction_id ? 'Yes' : 'No'}, Total: ${total_value}, Discrepancy: ${has_discrepancy}, Via: modal_selection`,
    created_at: new Date().toISOString()
  }));
  
  console.log('🔍 Match records a serem inseridos:');
  console.log(JSON.stringify(matchRecords, null, 2));
  
  try {
    console.log('\n📤 Tentando INSERT...');
    const { data: matchesResult, error: matchesError } = await supabase
      .from('transaction_matches')
      .insert(matchRecords)
      .select();
      
    if (matchesError) {
      console.log('❌ Erro EXATO da API:', matchesError);
      console.log('📝 Detalhes:');
      console.log('- Code:', matchesError.code);
      console.log('- Message:', matchesError.message);
      console.log('- Details:', matchesError.details);
      console.log('- Hint:', matchesError.hint);
    } else {
      console.log('✅ Sucesso! Dados inseridos:', matchesResult);
      
      // Limpar
      console.log('\n🧹 Limpando dados de teste...');
      const { error: deleteError } = await supabase
        .from('transaction_matches')
        .delete()
        .in('id', matchesResult.map(r => r.id));
        
      if (deleteError) {
        console.log('⚠️ Erro ao limpar:', deleteError);
      } else {
        console.log('✅ Limpeza concluída');
      }
    }
  } catch (err) {
    console.log('❌ Erro no catch:', err);
  }
}

simulateApiCall();
