// 🔧 Teste das Novas Regras de Transferência
// Comparação entre transações OFX e lançamentos do sistema

const { MatchingEngine } = require('./lib/matching-engine.ts');

async function testNewTransferRules() {
  console.log('🧪 === TESTE DAS NOVAS REGRAS DE TRANSFERÊNCIA ===\n');

  // Exemplo de dados conforme relatado pelo usuário
  const ofxTransactions = [
    {
      id: '1',
      fit_id: 'TRANSF-123',
      amount: 500.00,
      posted_at: '2024-01-15',
      payee: 'TRANSFERENCIA CONTA',
      memo: 'TED PARA CONTA CORRENTE'
    },
    {
      id: '2', 
      fit_id: 'TRANSF-124',
      amount: -300.00,
      posted_at: '2024-01-15',
      payee: 'TRANSFERENCIA DEBITO',
      memo: 'TRANSFERENCIA ENTRE CONTAS'
    },
    {
      id: '3',
      fit_id: 'TRANSF-125', 
      amount: 1000.00,
      posted_at: '2024-01-16',
      payee: 'TRANSFER NCIA CREDITO',
      memo: 'TED RECEBIDA'
    },
    {
      id: '4',
      fit_id: 'TRANSF-126',
      amount: -750.00,
      posted_at: '2024-01-16', 
      payee: 'TRANSFERENCIA SAIDA',
      memo: 'TRANSFERENCIA INTERNA'
    },
    {
      id: '5',
      fit_id: 'TRANSF-127',
      amount: 200.00,
      posted_at: '2024-01-17',
      payee: 'TRANSFER NCIA ENTRADA',
      memo: 'RECEBIMENTO TED'
    },
    {
      id: '6',
      fit_id: 'TRANSF-128',
      amount: -400.00,
      posted_at: '2024-01-17',
      payee: 'TRANSFERENCIA PIX',
      memo: 'PIX TRANSFERENCIA'
    },
    {
      id: '7',
      fit_id: 'TRANSF-129',
      amount: 150.00,
      posted_at: '2024-01-18',
      payee: 'TRANSFER NCIA',
      memo: 'TRANSFERENCIA RECEBIDA'
    },
    {
      id: '8',
      fit_id: 'TRANSF-130',
      amount: -100.00,
      posted_at: '2024-01-18',
      payee: 'TRANSFERENCIA BANCARIA',
      memo: 'TRANSFERENCIA ENVIADA'
    }
  ];

  // Lançamentos no sistema (apenas 4 correspondem às transferências OFX)
  const systemTransactions = [
    {
      id: 'sys1',
      valor: -500.00, // Oposto ao OFX
      data_lancamento: '2024-01-15',
      descricao: 'TRANSFERENCIA CONTA EMPRESA',
      tipo: 'despesa'
    },
    {
      id: 'sys2',
      valor: 300.00, // Oposto ao OFX  
      data_lancamento: '2024-01-15',
      descricao: 'TRANSFERENCIA RECEBIMENTO',
      tipo: 'receita'
    },
    {
      id: 'sys3',
      valor: -1000.00, // Oposto ao OFX
      data_lancamento: '2024-01-16', 
      descricao: 'TED ENVIADA MATRIZ',
      tipo: 'despesa'
    },
    {
      id: 'sys4',
      valor: 750.00, // Oposto ao OFX
      data_lancamento: '2024-01-16',
      descricao: 'TRANSFERENCIA INTERNA FILIAL',
      tipo: 'receita'
    }
    // Nota: NÃO há lançamentos no sistema para as transações 5, 6, 7, 8
  ];

  console.log('📊 DADOS DE TESTE:');
  console.log(`- Transações OFX com TRANSF-: ${ofxTransactions.length}`);
  console.log(`- Lançamentos no sistema: ${systemTransactions.length}`);
  console.log('');

  const matchingEngine = new MatchingEngine();

  console.log('🎯 EXECUTANDO MATCHING ENGINE...\n');
  
  const results = matchingEngine.processMatching(
    ofxTransactions,
    systemTransactions,
    []
  );

  console.log('📋 RESULTADOS ESPERADOS vs OBTIDOS:\n');

  let transferenciasComMatch = 0;
  let semMatch = 0;

  results.forEach((result, index) => {
    const ofx = result.bankTransaction;
    const sys = result.systemTransaction;
    
    console.log(`Transação ${index + 1}:`);
    console.log(`  OFX: ${ofx.fit_id} | ${ofx.amount} | ${ofx.payee}`);
    
    if (sys) {
      console.log(`  SYS: ${sys.id} | ${sys.valor} | ${sys.descricao}`);
      console.log(`  STATUS: ${result.status} ✅`);
      if (result.status === 'transferencia') transferenciasComMatch++;
    } else {
      console.log(`  SYS: Não encontrado`);
      console.log(`  STATUS: ${result.status} ❌`);
      if (result.status === 'sem_match') semMatch++;
    }
    
    console.log(`  RAZÃO: ${result.matchReason}`);
    console.log('');
  });

  console.log('📊 RESUMO FINAL:');
  console.log(`✅ Transferências com match no sistema: ${transferenciasComMatch} (esperado: 4)`);
  console.log(`❌ Sem match (incluindo TRANSF- sem correspondência): ${semMatch} (esperado: 4)`);
  console.log('');

  // Validação
  const sucesso = transferenciasComMatch === 4 && semMatch === 4;
  
  if (sucesso) {
    console.log('🎉 TESTE PASSOU! As novas regras estão funcionando corretamente.');
    console.log('- Apenas transferências com correspondência no sistema = "transferencia"');
    console.log('- Transferências OFX sem correspondência no sistema = "sem_match"');
  } else {
    console.log('❌ TESTE FALHOU! As regras precisam de ajuste.');
    console.log(`Esperado: 4 transferências + 4 sem_match`);
    console.log(`Obtido: ${transferenciasComMatch} transferências + ${semMatch} sem_match`);
  }
}

// Executar teste
testNewTransferRules().catch(console.error);
