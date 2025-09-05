// Teste da lógica corrigida do getCardBackgroundColor
console.log('🧪 Testando lógica corrigida do getCardBackgroundColor...\n');

// Simulando a função isValidTransfer
function isValidTransfer(bankTransaction, systemTransaction) {
  if (!bankTransaction || !systemTransaction) return false;
  // Simulação básica - na prática verifica valores, datas, direção, etc.
  return bankTransaction.memo?.toLowerCase().includes('transfer') && 
         systemTransaction.descricao?.toLowerCase().includes('transfer');
}

// Função corrigida
function getCardBackgroundColor(status, pair) {
  // Verificar se a transação foi conciliada (pelos campos oficiais ou status matched)
  // ✅ CORREÇÃO: Só considera conciliado se TAMBÉM tiver correspondência no sistema
  const isConciliated = (pair.bankTransaction?.status_conciliacao === 'conciliado' || 
                        status === 'conciliado' || 
                        status === 'matched') &&
                        pair.systemTransaction; // 🎯 DEVE ter correspondência real
  
  if (isConciliated) {
    return 'bg-green-200 border-green-400 shadow-md'; // Verde mais forte para conciliadas
  }
  
  // PRIORIDADE 1: Verificar se é transferência VÁLIDA (ambos lados + valores/datas iguais)
  const isValidTransferPair = isValidTransfer(pair.bankTransaction, pair.systemTransaction);
  
  if (isValidTransferPair && (status === 'transfer' || status === 'transferencia')) {
    return 'bg-blue-100 border-blue-500 border-l-4 border-l-blue-600 hover:bg-blue-150 shadow-sm'; // Azul para transferências válidas
  }
  
  // PRIORIDADE 2: Status de conciliação/sugestão
  switch (status) {
    case 'suggested':
    case 'sugerido': 
      return 'bg-orange-50 border-orange-300 hover:bg-orange-100'; // Laranja claro para sugeridos
    case 'conflito': 
      return 'bg-red-100 border-red-300 hover:bg-red-150'; // Vermelho para conflitos
    case 'pendente': 
      return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-150'; // Amarelo para pendentes
  }
  
  // PRIORIDADE 3: Outros status
  switch (status) {
    case 'no_match':
    case 'sem_match': 
      return 'bg-white border-gray-300 hover:bg-gray-50'; // Branco para sem match
    default: 
      return 'bg-white border-gray-300 hover:bg-gray-50';
  }
}

// Casos de teste
console.log('📋 CASOS DE TESTE:\n');

// Caso 1: ❌ Problemático ANTES - Status conciliado MAS sem systemTransaction
const caso1 = {
  status: 'conciliado',
  pair: {
    bankTransaction: { 
      id: '1', 
      status_conciliacao: 'conciliado',
      amount: 100,
      memo: 'Pagamento teste'
    },
    systemTransaction: null // ❌ SEM correspondência no sistema
  }
};

console.log('Caso 1 - Status conciliado SEM correspondência sistema:');
console.log('Status:', caso1.status);
console.log('systemTransaction:', caso1.pair.systemTransaction);
console.log('Resultado:', getCardBackgroundColor(caso1.status, caso1.pair));
console.log('✅ Esperado: bg-white (branco) - NÃO verde\n');

// Caso 2: ✅ Correto - Status conciliado COM systemTransaction  
const caso2 = {
  status: 'conciliado',
  pair: {
    bankTransaction: { 
      id: '2', 
      status_conciliacao: 'conciliado',
      amount: 100,
      memo: 'Pagamento teste'
    },
    systemTransaction: { // ✅ COM correspondência no sistema
      id: '2',
      descricao: 'Pagamento teste',
      valor: 100
    }
  }
};

console.log('Caso 2 - Status conciliado COM correspondência sistema:');
console.log('Status:', caso2.status);
console.log('systemTransaction:', caso2.pair.systemTransaction ? 'EXISTS' : 'NULL');
console.log('Resultado:', getCardBackgroundColor(caso2.status, caso2.pair));
console.log('✅ Esperado: bg-green-200 (verde) - OK!\n');

// Caso 3: Status sugerido - deve ficar laranja
const caso3 = {
  status: 'sugerido',
  pair: {
    bankTransaction: { 
      id: '3', 
      amount: 100,
      memo: 'Pagamento teste'
    },
    systemTransaction: {
      id: '3',
      descricao: 'Pagamento teste',
      valor: 100
    }
  }
};

console.log('Caso 3 - Status sugerido:');
console.log('Status:', caso3.status);
console.log('Resultado:', getCardBackgroundColor(caso3.status, caso3.pair));
console.log('✅ Esperado: bg-orange-50 (laranja)\n');

// Caso 4: Sem match - deve ficar branco
const caso4 = {
  status: 'sem_match',
  pair: {
    bankTransaction: { 
      id: '4', 
      amount: 100,
      memo: 'Pagamento teste'
    },
    systemTransaction: null
  }
};

console.log('Caso 4 - Status sem_match:');
console.log('Status:', caso4.status);
console.log('Resultado:', getCardBackgroundColor(caso4.status, caso4.pair));
console.log('✅ Esperado: bg-white (branco)\n');

console.log('🎯 RESUMO DA CORREÇÃO:');
console.log('✅ Cards só ficam VERDES quando:');
console.log('   - Status = conciliado/matched E');
console.log('   - pair.systemTransaction existe (correspondência real)');
console.log('✅ Cards SEM correspondência ficam BRANCOS');
console.log('✅ Mantém todas as outras cores (azul, laranja, etc.)');
