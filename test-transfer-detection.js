// Teste para verificar se as transferências estão sendo detectadas corretamente
const transferData = [
  {
    "fit_id": "TRANSF-1755722099059-SAIDA",
    "payee": "[TRANSFER NCIA SA DA] fdd",
    "memo": "",
    "amount": "-10.00"
  },
  {
    "fit_id": "TRANSF-1755718714650-ENTRADA", 
    "payee": "[TRANSFER NCIA ENTRADA] teste",
    "memo": "",
    "amount": "10.00"
  },
  {
    "fit_id": "TRANSF-175572343105726-ENTRADA",
    "payee": "teste",
    "memo": "",
    "amount": "10.00"
  },
  {
    "fit_id": "452993",
    "payee": "fdasf", 
    "memo": "",
    "amount": "158.00"
  }
];

function hasTransferKeywords(transaction) {
  const transferKeywords = [
    // Palavras principais
    'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
    'TRANSF-', 'TRANSF ', 'TRANSF_',
    
    // Tipos de transferência
    'TED', 'DOC', 'PIX', 'TEF',
    
    // Variações encontradas nos dados reais
    'TRANSFER NCIA ENTRADA', 'TRANSFER NCIA SAIDA', 'TRANSFER NCIA SA DA',
    '[TRANSFER NCIA ENTRADA]', '[TRANSFER NCIA SA DA]',
    'TRANSFERÊNCIA ENTRADA', 'TRANSFERÊNCIA SAIDA',
    
    // Outros termos comuns
    'ENVIO', 'RECEBIMENTO', 'REMESSA',
    'TRANSFERENCIA BANCARIA', 'TRANSFERENCIA ENTRE CONTAS'
  ];

  const description = `${transaction.memo || ''} ${transaction.payee || ''} ${transaction.fit_id || ''}`.toUpperCase().trim();
  
  // Verificar palavras-chave na descrição
  const hasKeywordInDescription = transferKeywords.some(keyword => description.includes(keyword));
  
  return hasKeywordInDescription;
}

console.log('🧪 TESTE DE DETECÇÃO DE TRANSFERÊNCIAS');
console.log('=====================================');

transferData.forEach((txn, index) => {
  const description = `${txn.memo || ''} ${txn.payee || ''} ${txn.fit_id || ''}`.toUpperCase().trim();
  const isTransfer = hasTransferKeywords(txn);
  
  console.log(`\n${index + 1}. ${txn.fit_id}`);
  console.log(`   Payee: ${txn.payee}`);
  console.log(`   Description: "${description}"`);
  console.log(`   É transferência: ${isTransfer ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Status esperado: ${isTransfer ? 'transferencia' : 'sem_match'}`);
});

console.log('\n🎯 RESULTADO ESPERADO:');
console.log('- Primeiras 3 transações devem ser detectadas como transferências');
console.log('- Última transação deve ser "sem_match"');
console.log('- Se as transferências não estão sendo detectadas, há problema na função');
