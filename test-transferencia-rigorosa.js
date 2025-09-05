// ✅ TESTE DA REGRA RIGOROSA DE TRANSFERÊNCIAS
// Validação dos 3 critérios simultâneos obrigatórios

console.log('🧪 TESTANDO REGRA RIGOROSA DE TRANSFERÊNCIAS');
console.log('============================================\n');

// Função para simular a validação rigorosa
function validarTransferenciaRigorosa(bankTxn, systemTxn) {
  console.log(`📋 Testando transferência:`, {
    bankMemo: bankTxn.memo,
    bankAmount: bankTxn.amount,
    bankDate: bankTxn.posted_at,
    systemDesc: systemTxn.descricao,
    systemAmount: systemTxn.valor,
    systemDate: systemTxn.data_lancamento,
    systemType: systemTxn.tipo
  });

  // ✅ CRITÉRIO 1: Descrição com termos de transferência
  const transferKeywords = ['TRANSFER', 'TRANSFERENCIA', 'TRANSF-', 'TED', 'DOC', 'PIX'];
  
  const bankHasTerms = transferKeywords.some(term => 
    (bankTxn.memo || '').toUpperCase().includes(term) ||
    (bankTxn.payee || '').toUpperCase().includes(term) ||
    (bankTxn.fit_id || '').toUpperCase().includes(term)
  );
  
  const systemHasTerms = systemTxn.tipo === 'transferencia' ||
    transferKeywords.some(term => 
      (systemTxn.descricao || '').toUpperCase().includes(term) ||
      (systemTxn.numero_documento || '').toUpperCase().includes(term)
    );
  
  const criterio1 = bankHasTerms || systemHasTerms;

  // ✅ CRITÉRIO 2: Data exatamente igual (mesmo dia)
  const criterio2 = bankTxn.posted_at === systemTxn.data_lancamento;

  // ✅ CRITÉRIO 3: Valores iguais e opostos
  const valoresIguais = Math.abs(Math.abs(bankTxn.amount) - Math.abs(systemTxn.valor)) <= 0.01;
  const bankPositive = bankTxn.amount >= 0;
  const systemPositive = systemTxn.valor >= 0;
  const sinaisOpostos = bankPositive !== systemPositive;
  const criterio3 = valoresIguais && sinaisOpostos;

  console.log(`📊 Verificação dos critérios:`, {
    criterio1_termos: criterio1 ? '✅' : '❌',
    bankHasTerms,
    systemHasTerms,
    criterio2_dataExata: criterio2 ? '✅' : '❌',
    criterio3_valoresOpostos: criterio3 ? '✅' : '❌',
    valoresIguais,
    sinaisOpostos,
    bankSign: bankPositive ? '+' : '-',
    systemSign: systemPositive ? '+' : '-'
  });

  const todosAtendidos = criterio1 && criterio2 && criterio3;
  
  console.log(`🎯 Resultado: ${todosAtendidos ? '✅ TRANSFERÊNCIA VÁLIDA' : '❌ NÃO É TRANSFERÊNCIA'}`);
  
  if (!todosAtendidos) {
    const faltando = [];
    if (!criterio1) faltando.push('termos de transferência');
    if (!criterio2) faltando.push('data exatamente igual');
    if (!criterio3) faltando.push('valores iguais e opostos');
    console.log(`   Critérios não atendidos: ${faltando.join(', ')}`);
  }
  
  return todosAtendidos;
}

// Casos de teste baseados na documentação
const testCases = [
  {
    name: '✅ TRANSFERÊNCIA VÁLIDA - Todos os critérios',
    bank: {
      memo: 'TRANSFERENCIA TED ENVIADA',
      amount: -1000.00,
      posted_at: '2025-08-19',
      fit_id: 'TRANSF-123456'
    },
    system: {
      descricao: 'TRANSFERENCIA RECEBIDA',
      valor: 1000.00,
      data_lancamento: '2025-08-19',
      tipo: 'transferencia'
    },
    expected: true
  },
  
  {
    name: '❌ FALHA - Data diferente (1 dia)',
    bank: {
      memo: 'TRANSFERENCIA PIX',
      amount: -500.00,
      posted_at: '2025-08-19'
    },
    system: {
      descricao: 'TRANSFERENCIA ENTRADA',
      valor: 500.00,
      data_lancamento: '2025-08-20', // 1 dia diferente
      tipo: 'transferencia'
    },
    expected: false
  },

  {
    name: '❌ FALHA - Mesmo sinal (ambos positivos)',
    bank: {
      memo: 'TRANSFERENCIA RECEBIDA',
      amount: 800.00,
      posted_at: '2025-08-19'
    },
    system: {
      descricao: 'TRANSFERENCIA SISTEMA',
      valor: 800.00, // Mesmo sinal
      data_lancamento: '2025-08-19',
      tipo: 'transferencia'
    },
    expected: false
  },

  {
    name: '❌ FALHA - Sem termos de transferência',
    bank: {
      memo: 'Pagamento fornecedor',
      amount: -300.00,
      posted_at: '2025-08-19'
    },
    system: {
      descricao: 'Recebimento cliente',
      valor: 300.00,
      data_lancamento: '2025-08-19',
      tipo: 'receita'
    },
    expected: false
  },

  {
    name: '🔵 CASO REAL - Dados do usuário',
    bank: {
      memo: '',
      payee: 'tytyty',
      fit_id: 'TRANSF-175571523634644-SAIDA',
      amount: -25.00,
      posted_at: '2025-08-18'
    },
    system: {
      descricao: 'TRANSFERENCIA ENTRE CONTAS',
      valor: 25.00,
      data_lancamento: '2025-08-18',
      tipo: 'transferencia'
    },
    expected: true
  }
];

console.log('🔍 Executando testes da regra rigorosa...\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(''.padEnd(50, '-'));
  
  const result = validarTransferenciaRigorosa(testCase.bank, testCase.system);
  const success = result === testCase.expected;
  
  console.log(`${success ? '✅ SUCESSO' : '❌ FALHA'} - Resultado conforme esperado: ${testCase.expected}\n`);
});

console.log('🎯 REGRA RIGOROSA DE TRANSFERÊNCIAS');
console.log('==================================');
console.log('✅ Critério 1: Descrição com termos (OFX OU Sistema)');
console.log('✅ Critério 2: Data exatamente igual (ZERO tolerância)');
console.log('✅ Critério 3: Valores iguais e sinais opostos');
console.log('✅ TODOS os 3 critérios devem ser atendidos simultaneamente');
console.log('\n🚀 Implementação rigorosa conforme documentação!');
