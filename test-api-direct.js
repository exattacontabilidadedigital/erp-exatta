// Script para testar a API diretamente
async function testAPI() {
  try {
    console.log('🧪 Testando API de sugestões...');
    
    const url = 'http://localhost:3001/api/reconciliation/suggestions?bank_account_id=4fd86770-32c4-4927-9d7e-8f3ded7b38fa&period_start=2025-08-01&period_end=2025-08-31&empresa_id=3cdbb91a-29cd-4a02-8bf8-f09fa1df439d&include_reconciled=true';
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 Resposta da API:', {
      success: data.success,
      pairsCount: data.pairs?.length || 0,
      hasSystemTransactions: data.system_transactions?.length || 0
    });
    
    // Procurar por pairs conciliados
    const conciliatedPairs = data.pairs?.filter(pair => 
      pair.bankTransaction?.status_conciliacao === 'conciliado'
    ) || [];
    
    console.log('🔍 Pairs conciliados encontrados:', conciliatedPairs.length);
    
    conciliatedPairs.forEach((pair, index) => {
      console.log(`📋 Pair conciliado ${index + 1}:`, {
        id: pair.id,
        bankTransactionId: pair.bankTransaction?.id,
        hasSystemTransaction: !!pair.systemTransaction,
        matchedLancamentoId: pair.bankTransaction?.matched_lancamento_id,
        systemTransactionData: pair.systemTransaction
      });
    });
    
    // Verificar se há systemTransactions disponíveis globalmente
    console.log('📦 SystemTransactions globais:', {
      total: data.system_transactions?.length || 0,
      sampleIds: data.system_transactions?.slice(0, 5).map(st => st.id) || []
    });
    
    // Simular a lógica de reconstituição
    if (conciliatedPairs.length > 0) {
      const pair = conciliatedPairs[0];
      if (!pair.systemTransaction && pair.bankTransaction?.matched_lancamento_id) {
        console.log('🔧 Simulando reconstituição...');
        
        const allSystemTransactions = data.pairs?.flatMap(p => p.systemTransactions || []).filter(Boolean) || [];
        const matchedSystemTransaction = allSystemTransactions.find(st => st.id === pair.bankTransaction.matched_lancamento_id);
        
        console.log('🔍 Resultado da simulação:', {
          matched_lancamento_id: pair.bankTransaction.matched_lancamento_id,
          allSystemTransactionsCount: allSystemTransactions.length,
          foundMatch: !!matchedSystemTransaction,
          matchedSystemTransaction
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

// Executar teste
testAPI();
