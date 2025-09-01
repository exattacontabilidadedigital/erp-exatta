const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testRealDataIntegration() {
  console.log('🧪 Testando integração com dados reais...\n');
  
  try {
    // Buscar conta bancária real
    const { data: contas, error: contasError } = await supabase
      .from('contas_bancarias')
      .select('id, agencia, conta, empresa_id, banco_id')
      .limit(1);
    
    if (contasError || !contas || contas.length === 0) {
      console.error('❌ Erro ao buscar contas bancárias:', contasError);
      return;
    }
    
    const conta = contas[0];
    console.log('✅ Conta bancária encontrada:', `${conta.agencia} / ${conta.conta}`, '(ID:', conta.id, ')');
    
    // Buscar transações bancárias para esta conta
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', conta.id)
      .eq('reconciliation_status', 'pending')
      .limit(5);
    
    console.log(`📊 Transações bancárias pendentes: ${bankTransactions?.length || 0}`);
    
    // Buscar lançamentos para esta empresa
    const { data: lancamentos, error: lancError } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('empresa_id', conta.empresa_id)
      .eq('status', 'pago')
      .limit(5);
    
    console.log(`📊 Lançamentos pagos: ${lancamentos?.length || 0}`);
    
    if (bankTransactions && bankTransactions.length > 0) {
      console.log('\n📋 Exemplo de transação bancária:');
      console.log(`- ID: ${bankTransactions[0].id}`);
      console.log(`- Valor: R$ ${bankTransactions[0].amount}`);
      console.log(`- Data: ${bankTransactions[0].posted_at}`);
      console.log(`- Memo: ${bankTransactions[0].memo}`);
      console.log(`- Status: ${bankTransactions[0].reconciliation_status}`);
    }
    
    if (lancamentos && lancamentos.length > 0) {
      console.log('\n📋 Exemplo de lançamento:');
      console.log(`- ID: ${lancamentos[0].id}`);
      console.log(`- Valor: R$ ${lancamentos[0].valor}`);
      console.log(`- Data: ${lancamentos[0].data_lancamento}`);
      console.log(`- Descrição: ${lancamentos[0].descricao}`);
      console.log(`- Status: ${lancamentos[0].status}`);
    }
    
    // Testar chamada da API de sugestões
    console.log('\n🌐 Testando chamada da API de sugestões...');
    
    const url = `http://localhost:3000/api/reconciliation/suggestions?bank_account_id=${conta.id}&period_start=2024-01-01&period_end=2024-12-31&empresa_id=${conta.empresa_id}`;
    console.log('📡 URL:', url);
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API de sugestões funcionando!');
        console.log('📦 Resposta:', {
          pairs: data.pairs?.length || 0,
          summary: data.summary
        });
      } else {
        console.log('⚠️ API local não está rodando (normal se não estiver em desenvolvimento)');
        console.log('📊 Status:', response.status);
      }
    } catch (fetchError) {
      console.log('⚠️ Não foi possível conectar à API local (normal se não estiver rodando)');
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

testRealDataIntegration().then(() => process.exit(0));
