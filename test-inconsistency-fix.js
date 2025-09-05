/**
 * Script para testar a correção de inconsistências
 * 
 * Este script simula o comportamento do frontend após as correções:
 * 1. Filtrar pares inconsistentes (já conciliados mas aparecendo como suggested)
 * 2. Melhor verificação de transações conciliadas
 * 3. Log de debug para identificar problemas
 */

console.log('🧪 TESTE DE CORREÇÃO DE INCONSISTÊNCIAS');
console.log('=' .repeat(50));

// Simular dados com o problema reportado
const problematicPairs = [
  {
    id: 'pair-001',
    status: 'suggested', // ❌ PROBLEMA: Aparece como suggested
    bankTransaction: {
      id: '7dcd0cc7-3ec3-475c-8347-5dc02ad43413',
      status_conciliacao: 'conciliado' // ✅ MAS: Já está conciliado no banco
    },
    systemTransaction: {
      id: '8e2fe946-cd77-4686-bb97-835cd281fbd8',
      descricao: 'Transferência PIX'
    }
  },
  {
    id: 'pair-002',
    status: 'suggested',
    bankTransaction: {
      id: 'bank-002',
      status_conciliacao: 'pendente' // ✅ OK: Realmente pendente
    },
    systemTransaction: {
      id: 'sys-002',
      descricao: 'Transferência TED'
    }
  }
];

console.log('📊 DADOS ORIGINAIS:');
problematicPairs.forEach((pair, index) => {
  console.log(`Pair ${index + 1}:`, {
    id: pair.id,
    status: pair.status,
    bankStatus: pair.bankTransaction.status_conciliacao,
    bankId: pair.bankTransaction.id,
    systemId: pair.systemTransaction.id
  });
});

console.log('\n🔍 APLICANDO NOVA LÓGICA DE VERIFICAÇÃO...');

// Função corrigida para verificar se está conciliado
const isTransactionReconciled = (pair) => {
  const bankReconciled = pair.bankTransaction?.status_conciliacao === 'conciliado';
  const pairConfirmed = pair.status === 'conciliado';
  
  const result = bankReconciled || pairConfirmed;
  
  // Log para debug quando há inconsistência
  if (result && pair.status === 'suggested') {
    console.warn('⚠️ INCONSISTÊNCIA DETECTADA:', {
      pairId: pair.id,
      bankTransactionId: pair.bankTransaction?.id,
      systemTransactionId: pair.systemTransaction?.id,
      bankStatus: pair.bankTransaction?.status_conciliacao,
      pairStatus: pair.status,
      shouldBeHidden: true,
      message: 'Transação aparece como sugerida mas já está conciliada'
    });
  }
  
  return result;
};

// Filtrar pares inconsistentes
const filteredPairs = problematicPairs.filter((pair) => {
  const bankReconciled = pair.bankTransaction?.status_conciliacao === 'conciliado';
  const pairSuggested = pair.status === 'suggested';
  
  // Se está conciliado no banco mas aparece como suggested, é inconsistência
  if (bankReconciled && pairSuggested) {
    console.warn('🚫 REMOVENDO PAIR INCONSISTENTE:', {
      pairId: pair.id,
      bankTransactionId: pair.bankTransaction?.id,
      systemTransactionId: pair.systemTransaction?.id,
      bankStatus: pair.bankTransaction?.status_conciliacao,
      pairStatus: pair.status,
      reason: 'Já conciliado no banco mas aparece como suggested'
    });
    return false; // Remove este pair
  }
  
  return true; // Mantém este pair
});

console.log('\n📋 RESULTADO DO FILTRO:');
console.log('Pares originais:', problematicPairs.length);
console.log('Pares filtrados:', filteredPairs.length);
console.log('Pares removidos:', problematicPairs.length - filteredPairs.length);

console.log('\n✅ PARES VÁLIDOS RESTANTES:');
filteredPairs.forEach((pair, index) => {
  const isReconciled = isTransactionReconciled(pair);
  console.log(`Pair ${index + 1}:`, {
    id: pair.id,
    status: pair.status,
    bankStatus: pair.bankTransaction.status_conciliacao,
    isReconciled,
    shouldShowConciliarButton: !isReconciled && pair.status === 'suggested'
  });
});

console.log('\n🎯 CONCLUSÃO:');
if (filteredPairs.length < problematicPairs.length) {
  console.log('✅ Correção funcionou! Pares inconsistentes foram removidos.');
  console.log('🎉 Botões "Conciliar" não aparecerão mais para transações já conciliadas.');
} else {
  console.log('❌ Nenhuma inconsistência foi detectada ou removida.');
}

console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('1. Teste a interface - cards inconsistentes devem desaparecer');
console.log('2. Verifique se botões "Conciliar" aparecem apenas para pendentes');
console.log('3. Se ainda houver erro 409, verifique a API backend');
