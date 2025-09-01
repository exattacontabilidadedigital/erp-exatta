// Teste específico da API de reconciliação para agosto
async function testReconciliationAPI() {
  console.log('🧪 Testando API de reconciliação para AGOSTO 2025...');
  
  const baseURL = 'http://localhost:3003';
  const bankAccountId = '8ad0f3fb-88cc-4f39-8d50-f47efb3a5486';
  const empresaId = '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d';
  
  // Período de agosto
  const periodStart = '2025-08-01';
  const periodEnd = '2025-08-31';
  
  const url = `${baseURL}/api/reconciliation/suggestions?bank_account_id=${bankAccountId}&period_start=${periodStart}&period_end=${periodEnd}&empresa_id=${empresaId}&include_reconciled=false`;
  
  console.log('📡 URL da API:', url);
  console.log('📅 Período:', `${periodStart} até ${periodEnd}`);
  
  try {
    console.log('\n🔄 Fazendo requisição...');
    const response = await fetch(url);
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n✅ Resposta da API:');
      console.log('   Pares encontrados:', data.pairs?.length || 0);
      console.log('   Reconciliation ID:', data.reconciliation_id || 'N/A');
      console.log('   Summary:', data.summary ? 'Presente' : 'Ausente');
      
      if (data.pairs && data.pairs.length > 0) {
        console.log('\n📄 Primeiro par encontrado:');
        const firstPair = data.pairs[0];
        console.log('   ID:', firstPair.id);
        console.log('   Status:', firstPair.status);
        console.log('   Banco - Valor:', firstPair.bankTransaction?.amount);
        console.log('   Banco - Data:', firstPair.bankTransaction?.posted_at);
        console.log('   Sistema - Valor:', firstPair.systemTransaction?.valor);
        console.log('   Sistema - Data:', firstPair.systemTransaction?.data_lancamento);
      }
      
      if (data.summary) {
        console.log('\n📊 Resumo:');
        console.log('   Total:', data.summary.total);
        console.log('   Conciliados:', data.summary.conciliados);
        console.log('   Sugeridos:', data.summary.sugeridos);
        console.log('   Sem match:', data.summary.sem_match);
      }
      
      // Verificar se há dados suficientes para cards
      const totalCards = data.pairs?.length || 0;
      console.log(`\n🎯 RESULTADO: ${totalCards} cards deveriam aparecer na interface`);
      
      if (totalCards > 0) {
        console.log('✅ A API ESTÁ RETORNANDO DADOS - Cards deveriam aparecer!');
      } else {
        console.log('❌ A API NÃO ESTÁ RETORNANDO DADOS - Cards não aparecerão');
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na API:', response.status, errorText);
    }
    
  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
    
    // Se der erro de rede, pode ser que o servidor não esteja rodando
    console.log('\n💡 Dicas para resolver:');
    console.log('   1. Certifique-se que o servidor está rodando (npm run dev)');
    console.log('   2. Verifique se a porta 3003 está correta');
    console.log('   3. Aguarde alguns segundos para o servidor compilar');
  }
}

// Aguardar um pouco para o servidor estar pronto
console.log('⏳ Aguardando servidor estar pronto...');
setTimeout(testReconciliationAPI, 5000);
