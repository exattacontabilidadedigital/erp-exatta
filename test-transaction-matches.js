// Teste para verificar dados na tabela transaction_matches
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gicfrjtwlkmowjzuohtq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpY2ZyanR3bGttb3dqenVvaHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3ODA4NjIsImV4cCI6MjA0MDM1Njg2Mn0.XkZhuwX8vQhZB7Aw65x4nVdcvlx1hzGa8qtUsNuY2Fg'
);

async function checkTransactionMatches() {
  console.log('🔍 Verificando dados na tabela transaction_matches...');
  
  try {
    // Buscar todos os matches
    const { data: matches, error } = await supabase
      .from('transaction_matches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar matches:', error);
      return;
    }

    console.log(`📊 Total de matches encontrados: ${matches?.length || 0}`);
    
    if (matches && matches.length > 0) {
      console.log('\n📋 Primeiros 5 matches:');
      matches.slice(0, 5).forEach((match, idx) => {
        console.log(`${idx + 1}. Match ID: ${match.id}`);
        console.log(`   Bank Transaction: ${match.bank_transaction_id}`);
        console.log(`   System Transaction: ${match.system_transaction_id}`);
        console.log(`   Status: ${match.status}`);
        console.log(`   Confidence: ${match.confidence}`);
        console.log(`   Created: ${match.created_at}`);
        console.log('');
      });
    }

    // Verificar se algum dos IDs das transações bancárias está nos matches
    const bankIds = [
      '8b2e1f3d-dd3d-419c-9e77-02cfc6a1ff8b',
      'c2b10b52-c75a-4c4f-acaf-602430a01b5c', 
      '7dcd0cc7-3ec3-475c-8347-5dc02ad43413'
    ];

    console.log('🎯 Verificando se alguma das transações bancárias tem match ativo...');
    
    for (const bankId of bankIds) {
      const { data: specificMatches, error: specificError } = await supabase
        .from('transaction_matches')
        .select('*')
        .eq('bank_transaction_id', bankId);

      if (specificMatches && specificMatches.length > 0) {
        console.log(`\n✅ ENCONTRADO match para ${bankId}:`);
        specificMatches.forEach(match => {
          console.log(`   Status: ${match.status}`);
          console.log(`   Confidence: ${match.confidence}`);
          console.log(`   System Transaction: ${match.system_transaction_id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro na consulta:', error);
  }
}

checkTransactionMatches();
