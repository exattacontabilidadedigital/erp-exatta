// ✅ VALORES CORRETOS PARA AS CONSTRAINTS DO BANCO

// reconciliation_status aceita:
const VALID_RECONCILIATION_STATUS = [
  'pending',
  'transferencia', 
  'sugerido',
  'sem_match'
];

// status_conciliacao aceita:
const VALID_STATUS_CONCILIACAO = [
  'pendente',
  'conciliado', 
  'ignorado'
];

console.log('📋 VALORES CORRETOS PARA AS CONSTRAINTS:');
console.log('\n🔸 reconciliation_status:');
VALID_RECONCILIATION_STATUS.forEach(status => console.log(`  - '${status}'`));

console.log('\n🔸 status_conciliacao:');
VALID_STATUS_CONCILIACAO.forEach(status => console.log(`  - '${status}'`));

console.log('\n✅ API corrigida para usar:');
console.log('  - reconciliation_status: "pending" (para conciliado)');
console.log('  - status_conciliacao: "conciliado" (para conciliado)');
console.log('  - reconciliation_status: "sem_match" (para sem match)');
console.log('  - status_conciliacao: "pendente" (para sem match)');

module.exports = {
  VALID_RECONCILIATION_STATUS,
  VALID_STATUS_CONCILIACAO
};
