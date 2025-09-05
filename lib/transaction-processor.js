// 🚀 Função para processar status durante o upload do OFX
// Elimina a necessidade de 'pending' - calcula status direto

const { MatchingEngine } = require('../lib/matching-engine');

/**
 * Processa uma transação OFX e determina o reconciliation_status correto
 * @param {Object} ofxTransaction - Transação do OFX
 * @param {Array} systemTransactions - Lançamentos do sistema
 * @param {MatchingEngine} matchingEngine - Engine de matching
 * @returns {string} - Status final: 'transferencia', 'sugerido', ou 'sem_match'
 */
function processTransactionStatus(ofxTransaction, systemTransactions, matchingEngine) {
  console.log(`🔍 Processando status para transação: ${ofxTransaction.fit_id}`);
  
  // 1. VERIFICAR SE É TRANSFERÊNCIA
  const isTransfer = matchingEngine.isTransfer(ofxTransaction.fit_id, ofxTransaction.payee);
  
  if (isTransfer) {
    console.log(`🔄 É transferência: ${ofxTransaction.fit_id}`);
    
    // Verificar se tem correspondência no sistema
    const hasSystemMatch = systemTransactions.some(sysTxn => {
      // Critérios de transferência: data exata + valores opostos + termos
      const sameDate = isSameDate(ofxTransaction.posted_at, sysTxn.data_lancamento);
      const valuesMatch = Math.abs(Math.abs(ofxTransaction.amount) - Math.abs(sysTxn.valor)) <= 0.01;
      const oppositeSigns = (ofxTransaction.amount >= 0) !== (sysTxn.valor >= 0);
      
      return sameDate && valuesMatch && oppositeSigns;
    });
    
    if (hasSystemMatch) {
      console.log(`✅ Transferência com match no sistema: ${ofxTransaction.fit_id}`);
      return 'transferencia';
    } else {
      console.log(`❌ Transferência sem match no sistema: ${ofxTransaction.fit_id}`);
      return 'sem_match';
    }
  }
  
  // 2. VERIFICAR SE TEM SUGESTÃO DE MATCH
  const hasSuggestion = systemTransactions.some(sysTxn => {
    // Critérios de sugestão: valor similar + data próxima + mesmo sinal
    const sameDate = isSameDate(ofxTransaction.posted_at, sysTxn.data_lancamento);
    const valueMatch = Math.abs(Math.abs(ofxTransaction.amount) - Math.abs(sysTxn.valor)) <= 2.00;
    const sameSigns = (ofxTransaction.amount >= 0) === (sysTxn.valor >= 0);
    
    return sameDate && valueMatch && sameSigns;
  });
  
  if (hasSuggestion) {
    console.log(`💡 Sugestão encontrada: ${ofxTransaction.fit_id}`);
    return 'sugerido';
  }
  
  // 3. SEM MATCH
  console.log(`❌ Sem match: ${ofxTransaction.fit_id}`);
  return 'sem_match';
}

/**
 * Processa todas as transações OFX e determina status corretos
 * @param {Array} ofxTransactions - Transações do OFX
 * @param {Array} systemTransactions - Lançamentos do sistema
 * @returns {Array} - Transações com reconciliation_status definido
 */
function processAllTransactions(ofxTransactions, systemTransactions) {
  console.log(`🔄 Processando ${ofxTransactions.length} transações OFX...`);
  
  const matchingEngine = new MatchingEngine();
  const processedTransactions = [];
  
  for (const ofxTxn of ofxTransactions) {
    const status = processTransactionStatus(ofxTxn, systemTransactions, matchingEngine);
    
    processedTransactions.push({
      ...ofxTxn,
      reconciliation_status: status
    });
  }
  
  const summary = {
    total: processedTransactions.length,
    transferencia: processedTransactions.filter(t => t.reconciliation_status === 'transferencia').length,
    sugerido: processedTransactions.filter(t => t.reconciliation_status === 'sugerido').length,
    sem_match: processedTransactions.filter(t => t.reconciliation_status === 'sem_match').length
  };
  
  console.log(`📊 Resumo do processamento:`, summary);
  
  return processedTransactions;
}

function isSameDate(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
}

module.exports = {
  processTransactionStatus,
  processAllTransactions
};
