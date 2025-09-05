// Análise e correção das novas transações OFX importadas
// Data: 2025-09-04 (reimportação)

console.log('🔍 ANÁLISE DAS NOVAS TRANSAÇÕES OFX IMPORTADAS');
console.log('==============================================');

// Dados das transações reimportadas
const transacoes = [
  {idx: 0, id: "12702eaa-66de-44bc-91b9-4ba62b064979", fit_id: "452359432", payee: "dfa", amount: "-50.00"},
  {idx: 1, id: "28bdb02f-d8bb-442c-8ba2-071eb8e12005", fit_id: "TRANSF-175572343105726-ENTRADA", payee: "teste", amount: "10.00"},
  {idx: 2, id: "702bd4fa-462a-4e60-bebc-d50069d042c6", fit_id: "TRANSF-1755722099059-SAIDA", payee: "[TRANSFER NCIA SA DA] fdd", amount: "-10.00"},
  {idx: 3, id: "7ab493b3-6af2-4814-a298-03f7b385c873", fit_id: "TRANSF-175573923634644-ENTRADA", payee: "tytyty", amount: "25.00"},
  {idx: 4, id: "7e04196b-e647-41de-aa3c-bdb06164fe2f", fit_id: "5435824", payee: "fdafafa", amount: "-150.00"},
  {idx: 5, id: "9485f018-c412-46f7-935b-575679563511", fit_id: "TRANSF-1755723105726-SAIDA", payee: "teste", amount: "-10.00"},
  {idx: 6, id: "9d320bd0-f67b-408e-9a13-53109ff02534", fit_id: "786995", payee: "fdfa", amount: "-50.18"},
  {idx: 7, id: "a389a463-9eb3-400d-8d47-9e22348810d4", fit_id: "TRANSF-1755718714650-ENTRADA", payee: "[TRANSFER NCIA ENTRADA] teste", amount: "10.00"},
  {idx: 8, id: "be172daf-50ad-41d8-b56f-64be86133bfd", fit_id: "454", payee: "fda", amount: "-50.00"},
  {idx: 9, id: "be60ae09-dd6c-40b2-a967-9028024150c3", fit_id: "TRANSF-175571523634644-SAIDA", payee: "tytyty", amount: "-25.00"},
  {idx: 10, id: "bf435b98-c1de-4ec1-970a-9bc2327e57bd", fit_id: "TRANSF-17557252099059-ENTRADA", payee: "[TRANSFER NCIA ENTRADA] fdd", amount: "10.00"},
  {idx: 11, id: "e1a6e860-a0a1-460f-8165-ca7be58ca925", fit_id: "4549809", payee: "fdasfa", amount: "-58.00"},
  {idx: 12, id: "f1e4f845-0b7a-4927-b01a-bbaed72e07ce", fit_id: "TRANSF-1755718714650-SAIDA", payee: "[TRANSFER NCIA SA DA] teste", amount: "-10.00"},
  {idx: 13, id: "f78ffdec-0071-44db-beef-d02c90e947c6", fit_id: "452993", payee: "fdasf", amount: "158.00"}
];

// Função de detecção de transferências
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

console.log('\n📊 ANÁLISE DAS TRANSAÇÕES:');
console.log('==========================');

const transferencias = [];
const normais = [];

transacoes.forEach(t => {
  const isTransfer = hasTransferKeywords(t.fit_id, t.payee);
  if (isTransfer) {
    transferencias.push(t);
    console.log(`✅ TRANSFERÊNCIA - ID: ${t.id}`);
    console.log(`   FIT_ID: ${t.fit_id}`);
    console.log(`   PAYEE: ${t.payee}`);
    console.log(`   VALOR: ${t.amount}`);
    console.log('');
  } else {
    normais.push(t);
  }
});

console.log(`\n📈 RESUMO:`);
console.log(`- Total de transações: ${transacoes.length}`);
console.log(`- Transferências detectadas: ${transferencias.length}`);
console.log(`- Transações normais: ${normais.length}`);

console.log('\n🔧 SQL PARA CORREÇÃO DAS TRANSFERÊNCIAS:');
console.log('========================================');

if (transferencias.length > 0) {
  const sqlUpdates = transferencias.map(t => {
    return `-- ${t.fit_id} (${t.payee})
UPDATE bank_transactions 
SET 
  reconciliation_status = 'transferencia',
  status_conciliacao = 'transferencia',
  updated_at = NOW()
WHERE id = '${t.id}';`;
  }).join('\n\n');

  console.log(sqlUpdates);
}

console.log('\n\n📋 TRANSAÇÕES NORMAIS (devem permanecer "pending"):');
console.log('=================================================');
normais.forEach(t => {
  console.log(`- ${t.fit_id}: ${t.payee} (${t.amount})`);
});

console.log('\n\n🎯 EMPRESA_ID CORRETO IDENTIFICADO:');
console.log('===================================');
console.log('empresa_id: "3cdbb91a-29cd-4a02-8bf8-f09fa1df439d"');
console.log('bank_account_id: "4fd86770-32c4-4927-9d7e-8f3ded7b38fa"');

console.log('\n✅ RESULTADO ESPERADO APÓS EXECUÇÃO:');
console.log(`- ${transferencias.length} transações com reconciliation_status = "transferencia"`);
console.log(`- ${normais.length} transações permanecem como "pending"`);
console.log('- Status corrigido para importação atual');
