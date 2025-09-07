import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pftafsuudpbpyzqqgpex.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdGFmc3V1ZHBicHl6cXFncGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMzE4MTQ1MiwiZXhwIjoyMDI4NzU3NDUyfQ.xZJzYD2Fb2kC4aXSJFBTbSmQs-vfX6xaEOaL2T0E9-I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCheckLancamentoAPI() {
  console.log('🧪 Testando API check-lancamento-usage...\n');
  
  try {
    // Pegar alguns IDs de lançamentos do sistema
    console.log('🔍 Buscando lançamentos na base...');
    const { data: systemTransactions, error } = await supabase
      .from('lancamentos')
      .select('id, descricao, valor, tipo')
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao buscar lançamentos:', error);
      return;
    }
    
    console.log('📋 IDs de lançamentos encontrados:');
    if (systemTransactions && systemTransactions.length > 0) {
      systemTransactions.forEach((t, i) => {
        console.log(`${i+1}. ${t.id} - ${t.descricao} (${t.tipo}: R$ ${t.valor})`);
      });
    } else {
      console.log('❌ Nenhum lançamento encontrado');
      return;
    }
    console.log('');
    
    // Testar a API para cada ID
    for (const transaction of systemTransactions) {
      console.log(`🔍 Testando ID: ${transaction.id}`);
      console.log(`   Descrição: ${transaction.descricao}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/reconciliation/check-lancamento-usage/${transaction.id}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Resultado:`, result);
          
          // Detalhar o resultado
          if (result.isUsed) {
            console.log(`   🟡 USADO - Status: ${result.usageDetails.status}`);
            console.log(`   💳 Transação bancária: ${result.usageDetails.bankTransactionId}`);
            console.log(`   ⭐ Cor da estrela: ${result.starColor}`);
          } else {
            console.log(`   🟢 LIVRE - Pode ser usado`);
            console.log(`   ⭐ Cor da estrela: ${result.starColor}`);
          }
        } else {
          const error = await response.text();
          console.log(`❌ Erro ${response.status}:`, error);
        }
        
      } catch (error) {
        console.log(`❌ Erro de rede:`, error.message);
      }
      
      console.log(''); // Linha em branco
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCheckLancamentoAPI();
