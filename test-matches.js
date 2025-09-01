const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function checkMatchesData() {
  console.log('🔍 Verificando dados de matches e conciliação...\n');
  
  try {
    // Verificar se existem matches
    const { data: matches, error: matchesError } = await supabase
      .from('transaction_matches')
      .select('*')
      .limit(3);
    
    if (matchesError) {
      console.log('⚠️ Tabela transaction_matches pode não existir:', matchesError.message);
    } else {
      console.log(`📊 Matches encontrados: ${matches?.length || 0}`);
      if (matches && matches.length > 0) {
        console.log('Estrutura dos matches:', Object.keys(matches[0]));
      }
    }
    
    // Verificar transações conciliadas
    const { data: conciliadas, error: conciliadasError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('reconciliation_status', 'reconciled')
      .limit(3);
    
    console.log(`📊 Transações conciliadas: ${conciliadas?.length || 0}`);
    
    // Verificar transações com status_conciliacao = 'conciliado'
    const { data: conciliadasStatus, error: conciliadasStatusError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('status_conciliacao', 'conciliado')
      .limit(3);
    
    console.log(`📊 Transações com status_conciliacao = 'conciliado': ${conciliadasStatus?.length || 0}`);
    
    // Verificar resumo geral dos status
    const { data: statusSummary, error: statusError } = await supabase
      .from('bank_transactions')
      .select('reconciliation_status, status_conciliacao, count(*)')
      .limit(100);
    
    if (!statusError && statusSummary) {
      console.log('\n📊 Resumo de status das transações:');
      const statusCount = {};
      const statusConciliacaoCount = {};
      
      statusSummary.forEach(row => {
        const recStatus = row.reconciliation_status || 'null';
        const concStatus = row.status_conciliacao || 'null';
        
        statusCount[recStatus] = (statusCount[recStatus] || 0) + 1;
        statusConciliacaoCount[concStatus] = (statusConciliacaoCount[concStatus] || 0) + 1;
      });
      
      console.log('reconciliation_status:', statusCount);
      console.log('status_conciliacao:', statusConciliacaoCount);
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

checkMatchesData().then(() => process.exit(0));
