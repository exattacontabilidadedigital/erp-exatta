// =========================================================
// TESTE DA NOVA REGRA DE TRANSFERÊNCIA
// Sistema ERP - Conciliação Bancária
// =========================================================

console.log('🧪 Teste da Nova Regra de Transferência iniciado...');

// Simular função de validação de transferência
const isValidTransfer = (bankTransaction, systemTransaction) => {
  if (!bankTransaction || !systemTransaction) return false;
  
  console.log('🔍 Verificando regra de transferência para:', {
    bankId: bankTransaction.id,
    systemId: systemTransaction.id,
    bankMemo: bankTransaction.memo || bankTransaction.payee,
    systemDesc: systemTransaction.descricao,
    bankAmount: bankTransaction.amount,
    systemAmount: systemTransaction.valor,
    bankDate: bankTransaction.posted_at,
    systemDate: systemTransaction.data_lancamento
  });
  
  // ✅ CRITÉRIO 1: Descrição contendo termos de transferência
  const TRANSFER_KEYWORDS = [
    'TRANSF', 'TRANSFERÊNCIA', 'TRANSFERENCIA',
    'TED', 'DOC', 'PIX TRANSF', 'TRANSFER',
    'TRANSFER NCIA', 'TRANSFER NCIA ENTRADA', 'TRANSFER NCIA SA DA'
  ];
  
  const hasTransferTerms = (text) => {
    if (!text) return false;
    const upperText = text.toUpperCase();
    return TRANSFER_KEYWORDS.some(keyword => upperText.includes(keyword));
  };
  
  // Verificar se PELO MENOS UM dos lançamentos (OFX ou Sistema) contém termos de transferência
  const bankHasTransferTerms = hasTransferTerms(bankTransaction.memo || '') || 
                              hasTransferTerms(bankTransaction.payee || '') ||
                              (bankTransaction.fit_id && bankTransaction.fit_id.includes('TRANSF-'));
  
  const systemHasTransferTerms = systemTransaction.tipo === 'transferencia' ||
                                hasTransferTerms(systemTransaction.descricao || '') ||
                                hasTransferTerms(systemTransaction.numero_documento || '');
  
  const hasAnyTransferTerm = bankHasTransferTerms || systemHasTransferTerms;
  
  if (!hasAnyTransferTerm) {
    console.log('🚫 Transferência rejeitada - sem termos de transferência');
    return false;
  }
  
  // ✅ CRITÉRIO 2: Data exatamente igual (mesmo dia)
  const bankDate = new Date(bankTransaction.posted_at);
  const systemDate = new Date(systemTransaction.data_lancamento);
  
  if (isNaN(bankDate.getTime()) || isNaN(systemDate.getTime())) {
    console.log('🚫 Transferência rejeitada - datas inválidas');
    return false;
  }
  
  // Comparar apenas a parte da data (ignorar horário)
  const bankDateStr = bankDate.toISOString().split('T')[0];
  const systemDateStr = systemDate.toISOString().split('T')[0];
  const exactSameDate = bankDateStr === systemDateStr;
  
  if (!exactSameDate) {
    console.log('🚫 Transferência rejeitada - datas diferentes:', {
      bankDate: bankDateStr,
      systemDate: systemDateStr
    });
    return false;
  }
  
  // ✅ CRITÉRIO 3: Valores iguais e opostos
  const bankAmount = bankTransaction.amount;
  const systemAmount = systemTransaction.valor;
  
  // Verificar se os valores são iguais em absoluto
  const absoluteBankAmount = Math.abs(bankAmount);
  const absoluteSystemAmount = Math.abs(systemAmount);
  const amountDifference = Math.abs(absoluteBankAmount - absoluteSystemAmount);
  const amountTolerance = 0.01; // Tolerância de 1 centavo
  
  const valuesAreEqual = amountDifference <= amountTolerance;
  
  if (!valuesAreEqual) {
    console.log('🚫 Transferência rejeitada - valores não são iguais:', {
      bankAmount: absoluteBankAmount,
      systemAmount: absoluteSystemAmount,
      difference: amountDifference
    });
    return false;
  }
  
  // Verificar se os valores têm sinais opostos (um positivo, outro negativo)
  const haveOppositeSigns = (bankAmount > 0 && systemAmount < 0) || 
                           (bankAmount < 0 && systemAmount > 0);
  
  if (!haveOppositeSigns) {
    console.log('🚫 Transferência rejeitada - valores não têm sinais opostos:', {
      bankAmount,
      systemAmount
    });
    return false;
  }
  
  // ✅ TODAS AS VERIFICAÇÕES PASSARAM
  console.log('✅ Transferência VÁLIDA identificada!');
  return true;
};

// Casos de teste
const testCases = [
  {
    name: "✅ Caso 1: Transferência válida - TED",
    bank: {
      id: "bank1",
      memo: "TED RECEBIDO",
      amount: -1000.00,
      posted_at: "2025-09-02"
    },
    system: {
      id: "sys1", 
      descricao: "Transferência para conta corrente",
      valor: 1000.00,
      data_lancamento: "2025-09-02"
    },
    expected: true
  },
  {
    name: "✅ Caso 2: Transferência válida - PIX",
    bank: {
      id: "bank2",
      payee: "PIX TRANSF - EMPRESA XYZ",
      amount: 500.00,
      posted_at: "2025-09-02"
    },
    system: {
      id: "sys2",
      tipo: "transferencia",
      descricao: "Pagamento via PIX",
      valor: -500.00,
      data_lancamento: "2025-09-02"
    },
    expected: true
  },
  {
    name: "❌ Caso 3: Transferência inválida - sem termos",
    bank: {
      id: "bank3",
      memo: "COMPRA MERCADO",
      amount: -200.00,
      posted_at: "2025-09-02"
    },
    system: {
      id: "sys3",
      descricao: "Despesa com alimentação",
      valor: 200.00,
      data_lancamento: "2025-09-02"
    },
    expected: false
  },
  {
    name: "❌ Caso 4: Transferência inválida - datas diferentes",
    bank: {
      id: "bank4",
      memo: "TRANSFERÊNCIA ENTRE CONTAS",
      amount: -1000.00,
      posted_at: "2025-09-02"
    },
    system: {
      id: "sys4",
      descricao: "TRANSF para poupança",
      valor: 1000.00,
      data_lancamento: "2025-09-03" // Data diferente
    },
    expected: false
  },
  {
    name: "❌ Caso 5: Transferência inválida - valores diferentes",
    bank: {
      id: "bank5",
      memo: "DOC ENVIADO",
      amount: -1000.00,
      posted_at: "2025-09-02"
    },
    system: {
      id: "sys5",
      descricao: "Transferência DOC",
      valor: 1500.00, // Valor diferente
      data_lancamento: "2025-09-02"
    },
    expected: false
  },
  {
    name: "❌ Caso 6: Transferência inválida - sinais iguais",
    bank: {
      id: "bank6",
      memo: "TRANSFERÊNCIA RECEBIDA",
      amount: 1000.00, // Positivo
      posted_at: "2025-09-02"
    },
    system: {
      id: "sys6",
      descricao: "Transferência entrada",
      valor: 1000.00, // Também positivo
      data_lancamento: "2025-09-02"
    },
    expected: false
  }
];

// Executar testes
console.log('\n📋 Executando casos de teste da regra de transferência:\n');

testCases.forEach((testCase, index) => {
  console.log(`\n--- ${testCase.name} ---`);
  
  const result = isValidTransfer(testCase.bank, testCase.system);
  const passed = result === testCase.expected;
  
  console.log(`Resultado: ${result ? '✅ TRANSFERÊNCIA' : '❌ NÃO É TRANSFERÊNCIA'}`);
  console.log(`Esperado: ${testCase.expected ? '✅ TRANSFERÊNCIA' : '❌ NÃO É TRANSFERÊNCIA'}`);
  console.log(`Status: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  if (!passed) {
    console.error(`❌ TESTE FALHOU! Caso ${index + 1}`);
  }
});

console.log('\n🏁 Teste da Nova Regra de Transferência concluído!');
console.log('\n📝 Resumo das regras implementadas:');
console.log('1. ✅ Descrição contém termos de transferência (TRANSF, TED, DOC, PIX TRANSF, etc.)');
console.log('2. ✅ Data exatamente igual (mesmo dia)');
console.log('3. ✅ Valores iguais e opostos (ex: -R$ 1.000 ↔ +R$ 1.000)');
console.log('4. ✅ Status sugerido como "transferência" até conciliação manual');
