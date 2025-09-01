// Script para testar as novas regras rigorosas de transferência
console.log('🧪 Testando novas regras rigorosas de transferência...\n');

// Simular função isValidTransfer com as novas regras
function isValidTransferTest(bankTransaction, systemTransaction) {
  if (!bankTransaction || !systemTransaction) return false;
  
  // 1. Verificar termos de transferência (simplificado para teste)
  const hasOFXTerms = bankTransaction.memo?.toUpperCase().includes('TRANSFER') || 
                      bankTransaction.memo?.toUpperCase().includes('PIX') ||
                      bankTransaction.memo?.toUpperCase().includes('TED');
                      
  const hasSystemTerms = systemTransaction.tipo === 'transferencia' ||
                         systemTransaction.descricao?.toUpperCase().includes('TRANSFER');
  
  if (!hasOFXTerms || !hasSystemTerms) {
    return { valid: false, reason: 'Termos de transferência não encontrados' };
  }
  
  // 2. Verificar valores EXATAMENTE iguais
  const bankAmount = bankTransaction.amount;
  const systemAmount = systemTransaction.valor;
  const absoluteBankAmount = Math.abs(bankAmount);
  const absoluteSystemAmount = Math.abs(systemAmount);
  const valuesExactlyMatch = Math.abs(absoluteBankAmount - absoluteSystemAmount) < 0.01;
  
  if (!valuesExactlyMatch) {
    return { 
      valid: false, 
      reason: `Valores diferentes: OFX=${bankAmount}, Sistema=${systemAmount}` 
    };
  }
  
  // 3. NOVA REGRA: Verificar contrapartida EXATA (sentidos opostos obrigatórios)
  const isValidCounterpart = (
    // REGRA 1: DÉBITO no OFX (saída) + RECEITA no sistema (entrada)
    (bankTransaction.transaction_type === 'DEBIT' && bankAmount < 0 && 
     systemTransaction.tipo === 'receita' && systemAmount > 0 && 
     Math.abs(bankAmount) === Math.abs(systemAmount)) ||
     
    // REGRA 2: CRÉDITO no OFX (entrada) + DESPESA no sistema (saída)
    (bankTransaction.transaction_type === 'CREDIT' && bankAmount > 0 && 
     systemTransaction.tipo === 'despesa' && systemAmount < 0 && 
     Math.abs(bankAmount) === Math.abs(systemAmount)) ||
     
    // REGRA 3: Ambos são transferências com contrapartida exata
    (systemTransaction.tipo === 'transferencia' && 
     ((bankAmount < 0 && systemAmount > 0) || (bankAmount > 0 && systemAmount < 0)) &&
     Math.abs(bankAmount) === Math.abs(systemAmount))
  );
  
  if (!isValidCounterpart) {
    return { 
      valid: false, 
      reason: `Contrapartida inválida: OFX(${bankTransaction.transaction_type}, ${bankAmount}) vs Sistema(${systemTransaction.tipo}, ${systemAmount})` 
    };
  }
  
  // 4. Verificar datas EXATAMENTE iguais
  const bankDate = new Date(bankTransaction.posted_at);
  const systemDate = new Date(systemTransaction.data_lancamento);
  bankDate.setHours(0, 0, 0, 0);
  systemDate.setHours(0, 0, 0, 0);
  const datesExactlyMatch = bankDate.getTime() === systemDate.getTime();
  
  if (!datesExactlyMatch) {
    return { 
      valid: false, 
      reason: `Datas diferentes: OFX=${bankDate.toISOString().split('T')[0]} vs Sistema=${systemDate.toISOString().split('T')[0]}` 
    };
  }
  
  return { 
    valid: true, 
    reason: 'Transferência válida - todos os critérios atendidos',
    details: {
      bankType: bankTransaction.transaction_type,
      bankAmount,
      systemType: systemTransaction.tipo,
      systemAmount,
      sentidosOpostos: (bankAmount < 0 && systemAmount > 0) || (bankAmount > 0 && systemAmount < 0)
    }
  };
}

// Casos de teste
const testCases = [
  {
    name: "✅ Transferência VÁLIDA - Débito OFX + Receita Sistema",
    bank: {
      memo: "TRANSFERENCIA PIX",
      amount: -1000.00,
      transaction_type: "DEBIT",
      posted_at: "2024-01-15T10:00:00Z"
    },
    system: {
      descricao: "TRANSFERENCIA RECEBIDA",
      valor: 1000.00,
      tipo: "receita",
      data_lancamento: "2024-01-15T15:30:00Z"
    }
  },
  {
    name: "✅ Transferência VÁLIDA - Crédito OFX + Despesa Sistema",
    bank: {
      memo: "TRANSFERENCIA TED RECEBIDA",
      amount: 1500.00,
      transaction_type: "CREDIT",
      posted_at: "2024-01-16T09:00:00Z"
    },
    system: {
      descricao: "TRANSFERENCIA ENVIADA",
      valor: -1500.00,
      tipo: "despesa",
      data_lancamento: "2024-01-16T09:00:00Z"
    }
  },
  {
    name: "❌ INVÁLIDA - Mesmo sentido (ambos positivos)",
    bank: {
      memo: "TRANSFERENCIA PIX",
      amount: 1000.00,
      transaction_type: "CREDIT",
      posted_at: "2024-01-15T10:00:00Z"
    },
    system: {
      descricao: "TRANSFERENCIA RECEBIDA",
      valor: 1000.00,
      tipo: "receita",
      data_lancamento: "2024-01-15T10:00:00Z"
    }
  },
  {
    name: "❌ INVÁLIDA - Valores diferentes",
    bank: {
      memo: "TRANSFERENCIA PIX",
      amount: -1000.00,
      transaction_type: "DEBIT",
      posted_at: "2024-01-15T10:00:00Z"
    },
    system: {
      descricao: "TRANSFERENCIA RECEBIDA",
      valor: 999.50,
      tipo: "receita",
      data_lancamento: "2024-01-15T10:00:00Z"
    }
  },
  {
    name: "❌ INVÁLIDA - Datas diferentes",
    bank: {
      memo: "TRANSFERENCIA PIX",
      amount: -1000.00,
      transaction_type: "DEBIT",
      posted_at: "2024-01-15T10:00:00Z"
    },
    system: {
      descricao: "TRANSFERENCIA RECEBIDA",
      valor: 1000.00,
      tipo: "receita",
      data_lancamento: "2024-01-16T10:00:00Z"
    }
  },
  {
    name: "✅ Transferência VÁLIDA - Tipo transferencia no sistema",
    bank: {
      memo: "TRANSFERENCIA INTERNA",
      amount: -2000.00,
      transaction_type: "DEBIT",
      posted_at: "2024-01-17T14:00:00Z"
    },
    system: {
      descricao: "MOVIMENTACAO INTERNA",
      valor: 2000.00,
      tipo: "transferencia",
      data_lancamento: "2024-01-17T14:00:00Z"
    }
  }
];

// Executar testes
console.log('🧪 EXECUTANDO TESTES DAS NOVAS REGRAS:\n');
console.log('='.repeat(80));

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('-'.repeat(60));
  
  const result = isValidTransferTest(testCase.bank, testCase.system);
  
  console.log(`📊 Dados de entrada:`);
  console.log(`   OFX: ${testCase.bank.transaction_type} | ${testCase.bank.amount} | ${testCase.bank.memo}`);
  console.log(`   Sistema: ${testCase.system.tipo} | ${testCase.system.valor} | ${testCase.system.descricao}`);
  
  if (result.valid) {
    console.log(`✅ RESULTADO: ${result.reason}`);
    if (result.details) {
      console.log(`   💡 Detalhes: Sentidos opostos = ${result.details.sentidosOpostos}`);
    }
  } else {
    console.log(`❌ RESULTADO: ${result.reason}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('📋 RESUMO DAS NOVAS REGRAS RIGOROSAS:');
console.log('1. 📝 Ambos devem ter termos de transferência');
console.log('2. 💰 Valores devem ser EXATAMENTE iguais (abs)');
console.log('3. ↔️  Sentidos devem ser OPOSTOS (contrapartida)');
console.log('4. 📅 Datas devem ser EXATAMENTE iguais (mesmo dia)');
console.log('5. 🎯 DÉBITO OFX(-) + RECEITA Sistema(+) = ✅');
console.log('6. 🎯 CRÉDITO OFX(+) + DESPESA Sistema(-) = ✅');
console.log('7. 🎯 Tipo "transferencia" + sentidos opostos = ✅');
console.log('='.repeat(80));
