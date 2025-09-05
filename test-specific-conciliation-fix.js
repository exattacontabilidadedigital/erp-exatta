const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mgppaygsulvjekgnubrf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHBheWdzdWx2amVrZ251YnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0ODQ1NzksImV4cCI6MjAzNDA2MDU3OX0.pjqE75VKP1-M6Bxf2PtTiAQO_F1VgwVqKzAVYC2u5r8'
);

async function testSpecificConciliation() {
  console.log('🔗 TESTANDO CONCILIAÇÃO ESPECÍFICA');
  console.log('='.repeat(50));

  try {
    // Usar os IDs do teste anterior que causaram erro
    const testPayload = {
      bank_transaction_id: '0cddd5c4-36ef-480a-a214-8faaaed7360f',
      system_transaction_id: 'fa839aea-a24a-4f93-a7a5-b073dd7f6b6f',
      confidence_level: 'high',
      rule_applied: 'exact_match'
    };

    console.log('📤 Payload de teste:', testPayload);

    // Fazer a requisição para a API
    const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Resposta raw:', responseText);

    try {
      const responseData = JSON.parse(responseText);
      console.log('✅ Resposta JSON parseada:', responseData);
    } catch (parseError) {
      console.log('❌ Erro ao parsear JSON:', parseError.message);
    }

    // Se deu erro, vamos verificar o estado atual da transação
    if (!response.ok) {
      console.log('\n🔍 Verificando estado atual da transação...');
      
      const { data: currentState, error } = await supabase
        .from('bank_transactions')
        .select('id, reconciliation_status, status_conciliacao, matched_lancamento_id')
        .eq('id', testPayload.bank_transaction_id)
        .single();

      if (error) {
        console.log('❌ Erro ao verificar estado:', error);
      } else {
        console.log('📊 Estado atual:', currentState);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testSpecificConciliation();
