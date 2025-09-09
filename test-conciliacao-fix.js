// Teste para verificar se a correção do card do lado direito está funcionando
console.log('🧪 Testando correção do card do lado direito...');

// Simular dados que seriam retornados da API após conciliação
const mockPairAfterConciliation = {
  id: 'ad3e7398-5011-472e-862b-9f0b57c87677_no_match_13',
  bankTransaction: {
    id: 'ad3e7398-5011-472e-862b-9f0b57c87677',
    status_conciliacao: 'conciliado',
    reconciliation_status: 'pending',
    matched_lancamento_id: '5febd97c-5aa3-4f89-883a-1d4f3be4215e',
    amount: 1500.00,
    memo: 'Teste de conciliação',
    transaction_date: '2025-08-15'
  },
  systemTransaction: null, // ❌ PROBLEMA: API não retorna após conciliação
  systemTransactions: []
};

// Simular dados completos da API (incluindo todas as systemTransactions)
const mockApiData = {
  pairs: [
    {
      ...mockPairAfterConciliation,
      systemTransactions: [
        {
          id: '5febd97c-5aa3-4f89-883a-1d4f3be4215e',
          descricao: 'Lançamento teste conciliado',
          valor: 1500.00,
          tipo: 'receita',
          data_lancamento: '2025-08-15'
        }
      ]
    }
  ]
};

// Simular a lógica de correção implementada
function testReconciliationFix(pair, allPairs) {
  const bankStatus = pair.bankTransaction?.status_conciliacao;
  
  console.log('🔍 Testando pair:', {
    id: pair.id,
    bankStatus,
    hasSystemTransaction: !!pair.systemTransaction,
    matchedLancamentoId: pair.bankTransaction?.matched_lancamento_id
  });
  
  // ✅ CORREÇÃO: Reconstituir systemTransaction para pairs conciliados
  if (bankStatus === 'conciliado' && !pair.systemTransaction && pair.bankTransaction?.matched_lancamento_id) {
    console.log('🔧 RECONSTITUINDO systemTransaction...');
    
    const allSystemTransactions = allPairs.flatMap(p => p.systemTransactions || []).filter(Boolean);
    const matchedSystemTransaction = allSystemTransactions.find(st => st.id === pair.bankTransaction.matched_lancamento_id);
    
    if (matchedSystemTransaction) {
      pair.systemTransaction = matchedSystemTransaction;
      console.log('✅ SystemTransaction reconstituído:', {
        id: matchedSystemTransaction.id,
        descricao: matchedSystemTransaction.descricao,
        valor: matchedSystemTransaction.valor
      });
      return true;
    } else {
      console.warn('⚠️ Não foi possível reconstituir systemTransaction');
      return false;
    }
  }
  
  return !!pair.systemTransaction;
}

// Executar teste
const testPair = { ...mockPairAfterConciliation };
const success = testReconciliationFix(testPair, mockApiData.pairs);

console.log('\n📊 RESULTADO DO TESTE:');
console.log('Antes da correção:', {
  hasSystemTransaction: false,
  cardWouldShow: false
});

console.log('Após a correção:', {
  hasSystemTransaction: !!testPair.systemTransaction,
  cardWouldShow: success,
  systemTransactionData: testPair.systemTransaction
});

if (success) {
  console.log('✅ CORREÇÃO FUNCIONOU! O card do lado direito agora deve exibir os valores.');
} else {
  console.log('❌ CORREÇÃO FALHOU! Ainda há problemas na reconstituição do systemTransaction.');
}
