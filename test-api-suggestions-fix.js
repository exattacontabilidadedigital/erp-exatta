// Teste para verificar se a API suggestions está retornando transferências e sugestões
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gmppaengyqmxiwsyuhgm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcHBhZW5neXFteGl3c3l1aGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyMzI1NDAsImV4cCI6MjAzODgwODU0MH0.gL4jNT3Aq4j0iqDJH7lHzWUhCjKWCh1zHj0rYxFOBKs'
);

async function testAPISuggestions() {
  try {
    console.log('🔍 Testando API suggestions com includeReconciled=false...');
    
    // Parâmetros do teste (baseado nos dados que você forneceu)
    const params = {
      bank_account_id: '4fd86770-32c4-4927-9d7e-8f3ded7b38fa',
      period_start: '2025-08-01',
      period_end: '2025-08-31', 
      empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d',
      include_reconciled: 'false'
    };
    
    const queryString = new URLSearchParams(params).toString();
    const url = `http://localhost:3000/api/reconciliation/suggestions?${queryString}`;
    
    console.log('🌐 URL da requisição:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ Erro na requisição:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Detalhes do erro:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Resposta recebida!');
    console.log('📊 Total de pairs:', data.pairs?.length || 0);
    
    if (data.pairs && data.pairs.length > 0) {
      // Analisar distribuição por reconciliation_status
      const statusCount = data.pairs.reduce((acc, pair) => {
        const status = pair.bankTransaction?.reconciliation_status || 'undefined';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Distribuição por reconciliation_status:');
      console.table(statusCount);
      
      // Mostrar alguns exemplos
      console.log('\n📋 Exemplos de transações:');
      data.pairs.slice(0, 10).forEach((pair, index) => {
        console.log(`${index + 1}. ${pair.bankTransaction?.fit_id} - ${pair.bankTransaction?.reconciliation_status} - ${pair.bankTransaction?.payee?.substring(0, 30)}`);
      });
      
      // Verificar se temos transferências e sugestões
      const hasTransferencias = statusCount['transferencia'] > 0;
      const hasSugeridos = statusCount['sugerido'] > 0;
      
      console.log('\n🎯 RESULTADO DO TESTE:');
      console.log(`✅ Transferências visíveis: ${hasTransferencias ? 'SIM' : 'NÃO'} (${statusCount['transferencia'] || 0})`);
      console.log(`✅ Sugestões visíveis: ${hasSugeridos ? 'SIM' : 'NÃO'} (${statusCount['sugerido'] || 0})`);
      console.log(`✅ Sem match visíveis: ${statusCount['sem_match'] || 0}`);
      
      if (hasTransferencias && hasSugeridos) {
        console.log('🎉 SUCESSO! API agora retorna transferências e sugestões!');
      } else {
        console.log('⚠️ Ainda há problemas na API...');
      }
      
    } else {
      console.log('❌ Nenhuma transação retornada');
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
  }
}

// Executar teste
testAPISuggestions().then(() => {
  console.log('\n✅ Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
