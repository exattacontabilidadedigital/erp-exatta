// Debug específico para as transferências atuais

console.log('🔍 DEBUG DAS TRANSFERÊNCIAS ATUAIS');
console.log('================================');

// Dados reais do banco
const transacoes = [
  { id: "091e93da-641c-4ef1-a173-50979331fc9d", fit_id: "TRANSF-1755723105726-SAIDA", payee: "teste" },
  { id: "0c35f7a4-5fa7-41c7-a054-3bd35670a2e0", fit_id: "TRANSF-17557252099059-ENTRADA", payee: "[TRANSFER NCIA ENTRADA] fdd" },
  { id: "16c696a1-1e1c-48ff-996f-ca13f33e7dc8", fit_id: "TRANSF-175571523634644-SAIDA", payee: "tytyty" },
  { id: "9b2915cb-895c-4069-b24d-e7714abfdd56", fit_id: "TRANSF-1755722099059-SAIDA", payee: "[TRANSFER NCIA SA DA] fdd" },
  { id: "e6d35148-7564-48ca-bee9-7b52a94b65c4", fit_id: "TRANSF-1755718714650-ENTRADA", payee: "[TRANSFER NCIA ENTRADA] teste" },
  { id: "e975fc47-eb7b-4ad6-9d65-6c37b3ad0241", fit_id: "TRANSF-1755718714650-SAIDA", payee: "[TRANSFER NCIA SA DA] teste" },
  { id: "ec3f18e3-ae27-4efb-b8f2-b9681ca3c2a0", fit_id: "TRANSF-175573923634644-ENTRADA", payee: "tytyty" },
  { id: "f37da80f-4899-41e4-9254-df7ab4b73842", fit_id: "TRANSF-175572343105726-ENTRADA", payee: "teste" }
];

console.log('\n📊 TESTANDO DETECÇÃO ATUAL:');

function hasTransferKeywords(fitId, payee) {
  const transferKeywords = [
    'TRANSF-',
    '[TRANSFER NCIA',
    'TRANSFERENCIA',
    'TED TRANSFERENCIA',
    'PIX TRANSFERENCIA',
    'TRANSFER NCIA'
  ];
  
  const searchText = `${fitId || ''} ${payee || ''}`.toUpperCase();
  return transferKeywords.some(keyword => searchText.includes(keyword));
}

let detectadas = 0;
transacoes.forEach((t, index) => {
  const isTransfer = hasTransferKeywords(t.fit_id, t.payee);
  if (isTransfer) detectadas++;
  
  console.log(`${index + 1}. ${t.fit_id}`);
  console.log(`   Payee: ${t.payee}`);
  console.log(`   Detecção: ${isTransfer ? '✅ TRANSFERÊNCIA' : '❌ NORMAL'}`);
  console.log(`   ID: ${t.id}`);
  console.log('');
});

console.log(`📊 RESULTADO: ${detectadas}/${transacoes.length} transferências detectadas`);

console.log('\n🔧 POSSÍVEIS CAUSAS DO PROBLEMA:');
console.log('1. ❌ API não está sendo chamada');
console.log('2. ❌ Matching engine não está executando');
console.log('3. ❌ Método isTransfer() não está funcionando');
console.log('4. ❌ Update no banco não está funcionando');
console.log('5. ❌ Logs não mostram execução');

console.log('\n🧪 PRÓXIMOS PASSOS:');
console.log('1. Verificar se servidor está rodando');
console.log('2. Chamar API de sugestões e ver logs');
console.log('3. Verificar se método isTransfer existe');
console.log('4. Verificar se UPDATE está sendo executado');

console.log('\n💡 TESTE MANUAL RECOMENDADO:');
console.log(`
-- SQL direto para confirmar problema:
UPDATE bank_transactions 
SET reconciliation_status = 'transferencia'
WHERE fit_id LIKE 'TRANSF-%' 
  AND bank_account_id = '4fd86770-32c4-4927-9d7e-8f3ded7b38fa'
  AND reconciliation_status = 'pending';

-- Verificar resultado:
SELECT fit_id, payee, reconciliation_status 
FROM bank_transactions 
WHERE bank_account_id = '4fd86770-32c4-4927-9d7e-8f3ded7b38fa'
  AND fit_id LIKE 'TRANSF-%';
`);
