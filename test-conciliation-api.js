/*
  TESTE: Verificar API de conciliação com dados reais
*/

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gxmktsubcahamajrcjbp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4bWt0c3ViY2FoYW1hanJjamJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjEzNzUsImV4cCI6MjA0Njk5NzM3NX0.KmHhh2VLsz8xrpG2yJaX0kBxELKYfHVe2n8kZNSqGYA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConciliationWithRealData() {
  try {
    console.log('\n🔍 TESTANDO API DE CONCILIAÇÃO COM DADOS REAIS');
    console.log('=' .repeat(60));

    // 1. Buscar dados reais para teste
    console.log('\n📊 1. BUSCANDO DADOS PARA TESTE...');
    
    const { data: bankTransactions, error1 } = await supabase
      .from('bank_transactions')
      .select('id, memo, amount, status_conciliacao')
      .eq('status_conciliacao', 'pendente')
      .limit(2);

    if (error1) {
      console.error('❌ Erro ao buscar transações bancárias:', error1);
      return;
    }

    const { data: systemTransactions, error2 } = await supabase
      .from('lancamentos')
      .select('id, descricao, valor')
      .limit(2);

    if (error2) {
      console.error('❌ Erro ao buscar lançamentos:', error2);
      return;
    }

    if (!bankTransactions?.length || !systemTransactions?.length) {
      console.log('⚠️ Não há dados suficientes para teste');
      console.log(`Bank transactions: ${bankTransactions?.length || 0}`);
      console.log(`System transactions: ${systemTransactions?.length || 0}`);
      return;
    }

    console.log(`✅ Encontrados ${bankTransactions.length} bank transactions e ${systemTransactions.length} system transactions`);

    // 2. Testar API com dados reais
    console.log('\n🧪 2. TESTANDO API DE CONCILIAÇÃO...');
    
    const testPayload = {
      bank_transaction_id: bankTransactions[0].id,
      system_transaction_id: systemTransactions[0].id,
      confidence_level: 'manual',
      rule_applied: 'test_manual'
    };

    console.log('📤 Payload do teste:', testPayload);

    // Simular a requisição que o frontend faz
    console.log('📡 Fazendo requisição para API...');
    
    // Simular fetch usando Node.js (para teste local)
    const url = 'http://localhost:3000/api/reconciliation/conciliate';
    console.log(`🌐 URL: ${url}`);
    
    console.log('⚠️ NOTA: Este teste precisa ser executado no browser ou com o servidor rodando');
    console.log('💡 Para testar manualmente:');
    console.log('1. Abra o Developer Tools (F12)');
    console.log('2. Vá para Console');
    console.log('3. Execute este código:');
    console.log(`
fetch('/api/reconciliation/conciliate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(testPayload, null, 2)})
})
.then(response => {
  console.log('Status:', response.status, response.statusText);
  return response.text();
})
.then(text => {
  console.log('Resposta:', text);
  try {
    const json = JSON.parse(text);
    console.log('JSON:', json);
  } catch (e) {
    console.log('Não é JSON válido');
  }
})
.catch(error => console.error('Erro:', error));
    `);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testConciliationWithRealData();
