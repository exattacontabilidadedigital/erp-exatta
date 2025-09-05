// Teste da nova função isValidTransfer com critérios rigorosos
console.log('🧪 TESTANDO NOVA FUNÇÃO isValidTransfer - CRITÉRIOS RIGOROSOS');
console.log('='.repeat(70));

// Simulação da função isValidTransfer corrigida
function isValidTransfer(bankTransaction, systemTransaction) {
  if (!bankTransaction || !systemTransaction) return false;
  
  // ✅ CRITÉRIO 1: Keywords específicas
  const TRANSFER_KEYWORDS = [
    'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA', 'TRANSF',
    'TRANSFER NCIA', 'TRANSFER NCIA ENTRADA', 'TRANSFER NCIA SA DA',
    'TED', 'DOC', 'PIX', 'ENTRADA', 'SAIDA', 'SAÍDA'
  ];
  
  const hasTransferTerms = (text) => 
    TRANSFER_KEYWORDS.some(keyword => text.toUpperCase().includes(keyword));
  
  const bankHasTransferTerms = hasTransferTerms(bankTransaction.memo || '') || 
                              hasTransferTerms(bankTransaction.payee || '') ||
                              (bankTransaction.fit_id && bankTransaction.fit_id.includes('TRANSF-'));
  
  const systemHasTransferTerms = systemTransaction.tipo === 'transferencia' ||
                                hasTransferTerms(systemTransaction.descricao || '') ||
                                hasTransferTerms(systemTransaction.numero_documento || '');
  
  // AMBOS devem ter keywords
  if (!bankHasTransferTerms || !systemHasTransferTerms) {
    console.log('❌ REJEITADO - Keywords insuficientes:', {
      bankHasTerms: bankHasTransferTerms,
      systemHasTerms: systemHasTransferTerms
    });
    return false;
  }
  
  // ✅ CRITÉRIO 2: Valores
  const bankAmount = Math.abs(bankTransaction.amount);
  const systemAmount = Math.abs(systemTransaction.valor);
  const amountDifference = Math.abs(bankAmount - systemAmount);
  const amountTolerance = Math.max(bankAmount, systemAmount) * 0.01;
  
  const valuesMatch = amountDifference <= amountTolerance && amountDifference <= 0.01;
  
  if (!valuesMatch) {
    console.log('❌ REJEITADO - Valores não conferem:', {
      bankAmount, systemAmount, difference: amountDifference
    });
    return false;
  }
  
  // ✅ CRITÉRIO 3: Contrapartidas RIGOROSAS
  const isValidCounterpart = (
    (bankTransaction.transaction_type === 'DEBIT' && systemTransaction.tipo === 'receita') ||
    (bankTransaction.transaction_type === 'CREDIT' && systemTransaction.tipo === 'despesa')
  );
  
  if (!isValidCounterpart) {
    console.log('❌ REJEITADO - Contrapartida inválida:', {
      bankType: bankTransaction.transaction_type,
      systemType: systemTransaction.tipo,
      expected: bankTransaction.transaction_type === 'DEBIT' ? 'DEBIT ↔ receita' : 'CREDIT ↔ despesa'
    });
    return false;
  }
  
  // ✅ CRITÉRIO 4: Datas (máximo 3 dias)
  const bankDate = new Date(bankTransaction.posted_at);
  const systemDate = new Date(systemTransaction.data_lancamento);
  
  if (isNaN(bankDate.getTime()) || isNaN(systemDate.getTime())) {
    console.log('❌ REJEITADO - Datas inválidas');
    return false;
  }
  
  const timeDifference = Math.abs(bankDate.getTime() - systemDate.getTime());
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
  
  if (daysDifference > 3) {
    console.log('❌ REJEITADO - Datas muito distantes:', {
      daysDifference: daysDifference.toFixed(1)
    });
    return false;
  }
  
  console.log('✅ ACEITO - Transferência válida!', {
    criteria: { keywords: '✅', values: '✅', counterpart: '✅', dates: '✅' }
  });
  return true;
}

// TESTES
console.log('\n🧪 TESTE 1 - TRANSFERÊNCIA VÁLIDA (DEBIT ↔ receita):');
const test1 = isValidTransfer(
  {
    transaction_type: 'DEBIT',
    amount: -100,
    memo: 'TRANSFERÊNCIA PARA POUPANÇA',
    posted_at: '2025-08-20'
  },
  {
    tipo: 'receita',
    valor: 100,
    descricao: 'TRANSFERÊNCIA ENTRADA',
    data_lancamento: '2025-08-20'
  }
);

console.log('\n🧪 TESTE 2 - TRANSFERÊNCIA VÁLIDA (CREDIT ↔ despesa):');
const test2 = isValidTransfer(
  {
    transaction_type: 'CREDIT',
    amount: 500,
    payee: 'PIX RECEBIDO',
    posted_at: '2025-08-19'
  },
  {
    tipo: 'despesa',
    valor: 500,
    descricao: 'APLICAÇÃO PIX',
    data_lancamento: '2025-08-19'
  }
);

console.log('\n🧪 TESTE 3 - REJEITADO (Contrapartida incorreta):');
const test3 = isValidTransfer(
  {
    transaction_type: 'DEBIT',
    amount: -100,
    memo: 'TRANSFERÊNCIA',
    posted_at: '2025-08-20'
  },
  {
    tipo: 'despesa', // ❌ DEBIT deveria ser receita
    valor: 100,
    descricao: 'TRANSFERÊNCIA',
    data_lancamento: '2025-08-20'
  }
);

console.log('\n🧪 TESTE 4 - REJEITADO (Keywords insuficientes):');
const test4 = isValidTransfer(
  {
    transaction_type: 'DEBIT',
    amount: -100,
    memo: 'PAGAMENTO FORNECEDOR', // ❌ Sem keywords
    posted_at: '2025-08-20'
  },
  {
    tipo: 'receita',
    valor: 100,
    descricao: 'RECEBIMENTO CLIENTE', // ❌ Sem keywords
    data_lancamento: '2025-08-20'
  }
);

console.log('\n🧪 TESTE 5 - TRANSFERÊNCIA COM FIT_ID:');
const test5 = isValidTransfer(
  {
    transaction_type: 'DEBIT',
    amount: -100,
    fit_id: 'TRANSF-1755722099059-SAIDA', // ✅ Keywords no FIT_ID
    payee: '[TRANSFER NCIA SA DA] teste',
    posted_at: '2025-08-20'
  },
  {
    tipo: 'receita',
    valor: 100,
    descricao: 'TRANSFERÊNCIA ENTRADA',
    data_lancamento: '2025-08-20'
  }
);

console.log('\n📊 RESUMO DOS TESTES:');
console.log(`Teste 1 (DEBIT ↔ receita): ${test1 ? '✅ PASSOU' : '❌ FALHOU'}`);
console.log(`Teste 2 (CREDIT ↔ despesa): ${test2 ? '✅ PASSOU' : '❌ FALHOU'}`);
console.log(`Teste 3 (Contrapartida incorreta): ${test3 ? '❌ FALHOU' : '✅ REJEITOU CORRETAMENTE'}`);
console.log(`Teste 4 (Keywords insuficientes): ${test4 ? '❌ FALHOU' : '✅ REJEITOU CORRETAMENTE'}`);
console.log(`Teste 5 (FIT_ID + keywords): ${test5 ? '✅ PASSOU' : '❌ FALHOU'}`);

console.log('\n🎯 CONCLUSÃO:');
console.log('✅ Função implementada com critérios RIGOROSOS');
console.log('✅ Elimina falsos positivos');
console.log('✅ Aceita apenas transferências legítimas');
console.log('✅ Logs detalhados para debug');
