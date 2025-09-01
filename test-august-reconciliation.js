// Script para testar especificamente a reconciliação de agosto 2025
// Usando fetch nativo do Node.js 18+

async function testAugustReconciliation() {
  console.log('🔍 Testando reconciliação para agosto 2025...\n');
  
  const url = 'http://localhost:3003/api/reconciliation/suggestions';
  
  // Parâmetros necessários para a API (baseado no código da API)
  const params = new URLSearchParams({
    bank_account_id: '1', // ID da conta bancária (vamos usar 1 como padrão)
    period_start: '2025-08-01',
    period_end: '2025-08-31',
    empresa_id: '1', // ID da empresa (vamos usar 1 como padrão)
    include_reconciled: 'false'
  });
  
  const fullUrl = `${url}?${params}`;
  
  console.log('📡 URL da requisição:', fullUrl);
  
  try {
    console.log('⏳ Fazendo requisição para API...');
    const response = await fetch(fullUrl);
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n📈 Resultado da API:');
    console.log('- Total de sugestões:', data.suggestions?.length || 0);
    console.log('- Total de transações bancárias:', data.bankTransactions?.length || 0);
    console.log('- Total de lançamentos:', data.systemTransactions?.length || 0);
    
    if (data.suggestions && data.suggestions.length > 0) {
      console.log('\n📋 Primeiras 3 sugestões:');
      data.suggestions.slice(0, 3).forEach((suggestion, index) => {
        console.log(`${index + 1}. Status: ${suggestion.status || 'N/A'}`);
        if (suggestion.bankTransaction) {
          console.log(`   Banco: ${suggestion.bankTransaction.memo || 'N/A'} - R$ ${suggestion.bankTransaction.amount}`);
        }
        if (suggestion.systemTransaction) {
          console.log(`   Sistema: ${suggestion.systemTransaction.descricao || 'N/A'} - R$ ${suggestion.systemTransaction.valor}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  Nenhuma sugestão encontrada para agosto 2025');
    }
    
    // Verificar se existem transações bancárias não conciliadas
    if (data.bankTransactions) {
      const unmatched = data.bankTransactions.filter(bt => 
        !data.suggestions.some(s => s.bankTransaction?.id === bt.id)
      );
      console.log(`💳 Transações bancárias não conciliadas: ${unmatched.length}`);
    }
    
    // Verificar se existem lançamentos do sistema não conciliados
    if (data.systemTransactions) {
      const unmatched = data.systemTransactions.filter(st => 
        !data.suggestions.some(s => s.systemTransaction?.id === st.id)
      );
      console.log(`📝 Lançamentos do sistema não conciliados: ${unmatched.length}`);
    }
    
  } catch (error) {
    console.error('💥 Erro ao fazer requisição:', error.message);
  }
}

// Executar o teste
testAugustReconciliation().then(() => {
  console.log('\n✅ Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
