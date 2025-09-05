// 🔧 Teste Simples das Novas Regras de Transferência
// Simula a lógica de matching para verificar as correções

function hasTransferKeywords(transaction) {
  const text = `${transaction.fit_id || ''} ${transaction.payee || ''} ${transaction.memo || ''}`.toLowerCase();
  
  const keywords = [
    'transf', 'transfer', 'ted', 'doc', 'pix',
    'transferencia', 'transferência', 'transfer ncia'
  ];
  
  return keywords.some(keyword => text.includes(keyword));
}

function isSameDate(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
}

function detectTransfer(ofxTxn, systemTransactions) {
  console.log(`🔄 Detectando transferência para ${ofxTxn.id}...`);
  
  // CRITÉRIO 1: Verificar se tem palavras-chave de transferência
  const hasOFXTerms = hasTransferKeywords(ofxTxn);
  
  if (!hasOFXTerms) {
    console.log(`❌ Critério 1 FALHOU - Não tem termos de transferência`);
    return null;
  }
  
  console.log(`✅ Critério 1 PASSOU - Tem termos de transferência`);
  
  // Buscar correspondência no sistema
  for (const sysTxn of systemTransactions) {
    console.log(`🔍 Verificando correspondência no sistema: ${sysTxn.id} - ${sysTxn.valor}`);
    
    // CRITÉRIO 2: DATA EXATAMENTE IGUAL
    const sameDate = isSameDate(ofxTxn.posted_at, sysTxn.data_lancamento);
    
    if (!sameDate) {
      console.log(`🚫 Critério 2 FALHOU - Datas diferentes`);
      continue;
    }
    
    // CRITÉRIO 3: VALORES IGUAIS E OPOSTOS
    const ofxAmount = ofxTxn.amount;
    const sysAmount = sysTxn.valor;
    const valoresIguais = Math.abs(Math.abs(ofxAmount) - Math.abs(sysAmount)) <= 0.01;
    const sinaIsOpostos = (ofxAmount >= 0) !== (sysAmount >= 0);
    
    if (!valoresIguais || !sinaIsOpostos) {
      console.log(`🚫 Critério 3 FALHOU - Valores não são iguais e opostos`);
      continue;
    }
    
    console.log(`✅ TRANSFERÊNCIA COM MATCH DETECTADA!`);
    return {
      bankTransaction: ofxTxn,
      systemTransaction: sysTxn,
      status: 'transferencia',
      matchReason: 'Transferência com correspondência no sistema'
    };
  }
  
  // Se tem termos mas não encontrou no sistema = sem_match
  console.log(`❌ Transferência OFX sem correspondência no sistema - será sem_match`);
  return null;
}

async function testNewTransferRules() {
  console.log('🧪 === TESTE DAS NOVAS REGRAS DE TRANSFERÊNCIA ===\\n');

  // 8 transações OFX com termos TRANSF-
  const ofxTransactions = [
    { id: '1', fit_id: 'TRANSF-123', amount: 500.00, posted_at: '2024-01-15', payee: 'TRANSFERENCIA CONTA' },
    { id: '2', fit_id: 'TRANSF-124', amount: -300.00, posted_at: '2024-01-15', payee: 'TRANSFERENCIA DEBITO' },
    { id: '3', fit_id: 'TRANSF-125', amount: 1000.00, posted_at: '2024-01-16', payee: 'TRANSFER NCIA CREDITO' },
    { id: '4', fit_id: 'TRANSF-126', amount: -750.00, posted_at: '2024-01-16', payee: 'TRANSFERENCIA SAIDA' },
    { id: '5', fit_id: 'TRANSF-127', amount: 200.00, posted_at: '2024-01-17', payee: 'TRANSFER NCIA ENTRADA' },
    { id: '6', fit_id: 'TRANSF-128', amount: -400.00, posted_at: '2024-01-17', payee: 'TRANSFERENCIA PIX' },
    { id: '7', fit_id: 'TRANSF-129', amount: 150.00, posted_at: '2024-01-18', payee: 'TRANSFER NCIA' },
    { id: '8', fit_id: 'TRANSF-130', amount: -100.00, posted_at: '2024-01-18', payee: 'TRANSFERENCIA BANCARIA' }
  ];

  // Apenas 4 lançamentos no sistema (correspondentes às primeiras 4 transações OFX)
  const systemTransactions = [
    { id: 'sys1', valor: -500.00, data_lancamento: '2024-01-15', descricao: 'TRANSFERENCIA CONTA EMPRESA' },
    { id: 'sys2', valor: 300.00, data_lancamento: '2024-01-15', descricao: 'TRANSFERENCIA RECEBIMENTO' },
    { id: 'sys3', valor: -1000.00, data_lancamento: '2024-01-16', descricao: 'TED ENVIADA MATRIZ' },
    { id: 'sys4', valor: 750.00, data_lancamento: '2024-01-16', descricao: 'TRANSFERENCIA INTERNA FILIAL' }
  ];

  console.log('📊 DADOS DE TESTE:');
  console.log(`- Transações OFX com TRANSF-: ${ofxTransactions.length}`);
  console.log(`- Lançamentos no sistema: ${systemTransactions.length}`);
  console.log('');

  console.log('🎯 EXECUTANDO MATCHING...\\n');
  
  const results = [];
  const usedSystemTransactions = new Set();

  // Processar cada transação OFX
  for (const ofxTxn of ofxTransactions) {
    const availableSystemTxns = systemTransactions.filter(sys => !usedSystemTransactions.has(sys.id));
    const transferMatch = detectTransfer(ofxTxn, availableSystemTxns);
    
    if (transferMatch) {
      results.push(transferMatch);
      usedSystemTransactions.add(transferMatch.systemTransaction.id);
    } else {
      // Sem match
      results.push({
        bankTransaction: ofxTxn,
        status: 'sem_match',
        matchReason: 'Nenhuma correspondência encontrada no sistema'
      });
    }
    console.log('');
  }

  console.log('📋 RESULTADOS:\\n');
  
  let transferenciasComMatch = 0;
  let semMatch = 0;

  results.forEach((result, index) => {
    const ofx = result.bankTransaction;
    const sys = result.systemTransaction;
    
    console.log(`Transação ${index + 1}: ${ofx.fit_id}`);
    console.log(`  STATUS: ${result.status}`);
    
    if (result.status === 'transferencia') {
      transferenciasComMatch++;
      console.log(`  ✅ Match com sistema: ${sys.id}`);
    } else {
      semMatch++;
      console.log(`  ❌ Sem correspondência no sistema`);
    }
    console.log('');
  });

  console.log('📊 RESUMO FINAL:');
  console.log(`✅ Transferências com match no sistema: ${transferenciasComMatch} (esperado: 4)`);
  console.log(`❌ Sem match: ${semMatch} (esperado: 4)`);
  console.log('');

  const sucesso = transferenciasComMatch === 4 && semMatch === 4;
  
  if (sucesso) {
    console.log('🎉 TESTE PASSOU! As novas regras estão funcionando:');
    console.log('✅ Apenas transferências com correspondência no sistema = "transferencia"');
    console.log('✅ Transferências OFX sem correspondência no sistema = "sem_match"');
  } else {
    console.log('❌ TESTE FALHOU!');
    console.log(`Esperado: 4 transferências + 4 sem_match`);
    console.log(`Obtido: ${transferenciasComMatch} transferências + ${semMatch} sem_match`);
  }
}

testNewTransferRules().catch(console.error);
