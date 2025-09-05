// Script para testar se a API de sugestões está detectando transferências
// Simula chamada para a API com dados reais

console.log('🧪 TESTE DE DETECÇÃO DE TRANSFERÊNCIAS NA API');
console.log('=============================================');

const testData = {
  bank_account_id: "4fd86770-32c4-4927-9d7e-8f3ded7b38fa"
};

console.log('📋 DADOS DO TESTE:');
console.log('Bank Account ID:', testData.bank_account_id);

// Simular transações que devem ser detectadas como transferências
const sampleTransactions = [
  {
    id: "test-1",
    fit_id: "TRANSF-1755722099059-SAIDA",
    payee: "[TRANSFER NCIA SA DA] fdd",
    amount: -1000.00,
    type: "debit"
  },
  {
    id: "test-2", 
    fit_id: "TRANSF-1755718714650-ENTRADA",
    payee: "[TRANSFER NCIA ENTRADA] teste",
    amount: 1000.00,
    type: "credit"
  },
  {
    id: "test-3",
    fit_id: "NORMAL-123456789",
    payee: "Compra no cartão",
    amount: -50.00,
    type: "debit"
  }
];

console.log('\n🔍 TESTANDO DETECÇÃO DE TRANSFERÊNCIAS:');
console.log('=====================================');

// Importar função de detecção (simulada)
function hasTransferKeywords(fitId, payee) {
  const transferKeywords = [
    'TRANSF-',
    '[TRANSFER NCIA',
    'TRANSFERENCIA',
    'TED TRANSFERENCIA',
    'PIX TRANSFERENCIA',
    'TRANSFER NCIA'
  ];
  
  const searchText = `${fitId || ''} ${payee || ''}`.toUpperCase();
  return transferKeywords.some(keyword => searchText.includes(keyword));
}

// Testar cada transação
sampleTransactions.forEach((transaction, index) => {
  const isTransfer = hasTransferKeywords(transaction.fit_id, transaction.payee);
  const expectedStatus = isTransfer ? 'transferencia' : 'pending';
  
  console.log(`\n${index + 1}. Transação: ${transaction.fit_id}`);
  console.log(`   Payee: ${transaction.payee}`);
  console.log(`   Detecção: ${isTransfer ? '✅ TRANSFERÊNCIA' : '❌ NORMAL'}`);
  console.log(`   Status esperado: ${expectedStatus}`);
});

console.log('\n🎯 RESULTADO ESPERADO:');
console.log('- Transação 1: ✅ transferencia (TRANSF- + [TRANSFER NCIA)');
console.log('- Transação 2: ✅ transferencia (TRANSF- + [TRANSFER NCIA)');  
console.log('- Transação 3: ❌ pending (transação normal)');

console.log('\n📡 PARA TESTAR API REAL:');
console.log(`curl -X POST http://localhost:3000/api/reconciliation/suggestions \\
  -H "Content-Type: application/json" \\
  -d '{"bank_account_id": "${testData.bank_account_id}"}'`);

console.log('\n🔧 SE AINDA NÃO ESTIVER FUNCIONANDO:');
console.log('1. Verifique se o matching engine foi recompilado');
console.log('2. Reinicie o servidor Next.js');
console.log('3. Execute as correções SQL acima');
console.log('4. Teste novamente a API');
