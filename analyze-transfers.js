// Script para analisar transferências no sistema e OFX
console.log('🔍 Analisando transferências no sistema e OFX...');

// Dados dos lançamentos fornecidos
const reconciliationData = [
  {"idx":0,"id":"04af519c-7b4f-4bb2-bc3d-707c6028508b","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"3efcecee-fa3a-4c7f-a04f-f63cf7332ceb","system_transaction_id":"c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-08-30 14:02:23.457924+00","updated_at":"2025-08-30 14:02:23.457924+00","reconciliation_session_id":null},
  {"idx":1,"id":"2b086f0d-0eb4-42d2-91cc-60b0959052da","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"7dcd0cc7-3ec3-475c-8347-5dc02ad43413","system_transaction_id":"8e2fe946-cd77-4686-bb97-835cd281fbd8","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 17:39:55.525499+00","updated_at":"2025-08-30 17:39:55.525499+00","reconciliation_session_id":null},
  {"idx":2,"id":"31f051fa-ca5f-42cd-a5e7-b417ec303e38","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"7dcd0cc7-3ec3-475c-8347-5dc02ad43413","system_transaction_id":"c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 17:04:08.410925+00","updated_at":"2025-08-30 17:04:08.410925+00","reconciliation_session_id":null},
  {"idx":3,"id":"4650518e-5286-4fe2-933d-cec97fda7e0d","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"7dcd0cc7-3ec3-475c-8347-5dc02ad43413","system_transaction_id":"0e9d53d4-1469-4e28-973b-fc14aa39c972","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 13:40:32.359131+00","updated_at":"2025-08-30 13:40:32.359131+00","reconciliation_session_id":null},
  {"idx":4,"id":"5eda1384-d438-4ad4-829a-0a0bda72f081","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"c2b10b52-c75a-4c4f-acaf-602430a01b5c","system_transaction_id":"8e2fe946-cd77-4686-bb97-835cd281fbd8","match_score":"0.95","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 17:30:35.3629+00","updated_at":"2025-08-30 17:30:35.3629+00","reconciliation_session_id":null},
  {"idx":5,"id":"64578536-2884-48d3-9014-751536974eb4","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"6cbab3f3-b535-4d1a-9a5f-f9ee617db92b","system_transaction_id":"8e2fe946-cd77-4686-bb97-835cd281fbd8","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-08-30 14:02:23.457924+00","updated_at":"2025-08-30 14:02:23.457924+00","reconciliation_session_id":null},
  {"idx":6,"id":"741b95c0-1acf-44dc-b697-a9c1b836e201","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"c2b10b52-c75a-4c4f-acaf-602430a01b5c","system_transaction_id":"416f7508-6a7c-41af-9b9c-cfe9c1ff68ff","match_score":"0.95","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 17:39:42.931879+00","updated_at":"2025-08-30 17:39:42.931879+00","reconciliation_session_id":null},
  {"idx":7,"id":"776e431c-9311-43bb-8d94-ed3aea171cbd","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"8b2e1f3d-dd3d-419c-9e77-02cfc6a1ff8b","system_transaction_id":"58fdde57-ebba-4019-bdbf-c3eb39c9ef37","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-08-30 14:02:23.457924+00","updated_at":"2025-08-30 14:02:23.457924+00","reconciliation_session_id":null},
  {"idx":8,"id":"7cd9f651-7a78-4ab4-a642-ca158584d44c","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"c2b10b52-c75a-4c4f-acaf-602430a01b5c","system_transaction_id":"0e9d53d4-1469-4e28-973b-fc14aa39c972","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 17:21:53.801281+00","updated_at":"2025-08-30 17:21:53.801281+00","reconciliation_session_id":null},
  {"idx":9,"id":"8fe92ae8-c6b6-4276-8ff2-3f4c9591ce6f","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"8bc8286c-dd27-43b7-8251-a843cdc4d5f5","system_transaction_id":"e5bad3be-b612-4819-a275-1d9dad480d9f","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-08-30 14:02:23.457924+00","updated_at":"2025-08-30 14:02:23.457924+00","reconciliation_session_id":null},
  {"idx":10,"id":"927f5c24-c10a-465e-96dd-ba272d5328d8","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"c2b10b52-c75a-4c4f-acaf-602430a01b5c","system_transaction_id":"c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Conciliação high - Regra: transfer_confirmation","created_at":"2025-08-30 17:39:55.525499+00","updated_at":"2025-08-30 17:39:55.525499+00","reconciliation_session_id":null},
  {"idx":11,"id":"99e3ccb3-6e5c-4c3b-9f3a-c370d9fb9d7d","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"7dcd0cc7-3ec3-475c-8347-5dc02ad43413","system_transaction_id":"416f7508-6a7c-41af-9b9c-cfe9c1ff68ff","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 17:02:26.185076+00","updated_at":"2025-08-30 17:02:26.185076+00","reconciliation_session_id":null},
  {"idx":12,"id":"f6dea7af-d2e7-41e7-85db-5490371d7d5e","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"c2b10b52-c75a-4c4f-acaf-602430a01b5c","system_transaction_id":"d33a868d-2be0-40be-b674-ffd5985c0bec","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 17:32:27.685119+00","updated_at":"2025-08-30 17:32:27.685119+00","reconciliation_session_id":null},
  {"idx":13,"id":"fc81e33a-be6a-49d4-b9a9-c606a8dc2d12","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"7dcd0cc7-3ec3-475c-8347-5dc02ad43413","system_transaction_id":"d33a868d-2be0-40be-b674-ffd5985c0bec","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência identificada - valor e data corretos","created_at":"2025-08-30 17:21:53.801281+00","updated_at":"2025-08-30 17:21:53.801281+00","reconciliation_session_id":null},
  {"idx":14,"id":"fc82b865-27a4-49ae-95aa-16e7ca6864a0","reconciliation_id":"c110c68e-74dd-4392-bb4e-9bbd0fb751dd","bank_transaction_id":"1f62d3fa-eb6b-40a2-8ed9-bd854b4015d3","system_transaction_id":"416f7508-6a7c-41af-9b9c-cfe9c1ff68ff","match_score":"0.50","match_type":"automatic","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-08-30 14:02:23.457924+00","updated_at":"2025-08-30 14:02:23.457924+00","reconciliation_session_id":null}
];

// Identificar transferências pelos notes
const transfers = reconciliationData.filter(item => 
  item.notes && (
    item.notes.includes('Transferência identificada') ||
    item.notes.includes('transfer_confirmation')
  )
);

console.log('📊 RESULTADO DA ANÁLISE:');
console.log('========================');
console.log(`Total de lançamentos: ${reconciliationData.length}`);
console.log(`Transferências identificadas: ${transfers.length}`);

// Extrair IDs únicos das transações bancárias (OFX)
const uniqueBankTransactionIds = new Set();
const uniqueSystemTransactionIds = new Set();

transfers.forEach(transfer => {
  if (transfer.bank_transaction_id) {
    uniqueBankTransactionIds.add(transfer.bank_transaction_id);
  }
  if (transfer.system_transaction_id) {
    uniqueSystemTransactionIds.add(transfer.system_transaction_id);
  }
});

console.log('\n🏦 TRANSAÇÕES BANCÁRIAS (OFX) QUE SÃO TRANSFERÊNCIAS:');
console.log('===================================================');
uniqueBankTransactionIds.forEach((id, index) => {
  console.log(`${index + 1}. ${id}`);
});
console.log(`\nTotal de transações bancárias (OFX) que são transferências: ${uniqueBankTransactionIds.size}`);

console.log('\n💼 TRANSAÇÕES DO SISTEMA QUE SÃO TRANSFERÊNCIAS:');
console.log('===============================================');
uniqueSystemTransactionIds.forEach((id, index) => {
  console.log(`${index + 1}. ${id}`);
});
console.log(`\nTotal de transações do sistema que são transferências: ${uniqueSystemTransactionIds.size}`);

// Análise detalhada
console.log('\n📋 ANÁLISE DETALHADA:');
console.log('====================');

transfers.forEach((transfer, index) => {
  console.log(`\n${index + 1}. Transferência (idx: ${transfer.idx})`);
  console.log(`   Bank ID: ${transfer.bank_transaction_id}`);
  console.log(`   System ID: ${transfer.system_transaction_id}`);
  console.log(`   Status: ${transfer.status}`);
  console.log(`   Score: ${transfer.match_score}`);
  console.log(`   Notes: ${transfer.notes}`);
});

console.log('\n✅ RESUMO FINAL:');
console.log('================');
console.log(`🔵 Transações OFX que são transferências: ${uniqueBankTransactionIds.size}`);
console.log(`🟢 Transações Sistema que são transferências: ${uniqueSystemTransactionIds.size}`);
console.log(`🔗 Total de pares de transferências: ${transfers.length}`);
