// Script para forçar atualização dos status de transferências existentes
// Execute este script para corrigir transações que já estão no banco

console.log('🔧 FORÇANDO ATUALIZAÇÃO DE STATUS DAS TRANSFERÊNCIAS');
console.log('==================================================');

// Lista das transações que devem ser transferências (baseado nos dados fornecidos)
const transferenciasParaCorrigir = [
  {
    id: "0c85405d-b8e0-4f00-af67-83c68271ae1f",
    fit_id: "TRANSF-1755722099059-SAIDA",
    payee: "[TRANSFER NCIA SA DA] fdd",
    status_atual: "pending",
    status_correto: "transferencia"
  },
  {
    id: "3385ce05-ffc2-4f3e-bf66-4c4f8161ca77",
    fit_id: "TRANSF-1755718714650-ENTRADA", 
    payee: "[TRANSFER NCIA ENTRADA] teste",
    status_atual: "pending",
    status_correto: "transferencia"
  },
  {
    id: "493c38f8-667f-464c-a4ea-2b54b3fa5eb3",
    fit_id: "TRANSF-175572343105726-ENTRADA",
    payee: "teste",
    status_atual: "pending", 
    status_correto: "transferencia"
  },
  {
    id: "4d891e34-4e1c-4444-83c7-74ec1efacee7",
    fit_id: "TRANSF-1755718714650-SAIDA",
    payee: "[TRANSFER NCIA SA DA] teste", 
    status_atual: "pending",
    status_correto: "transferencia"
  },
  {
    id: "7879d5de-d181-4553-b838-c3baf904e721",
    fit_id: "TRANSF-1755723105726-SAIDA",
    payee: "teste",
    status_atual: "pending",
    status_correto: "transferencia" 
  },
  {
    id: "8a4d304c-7ea9-4ccd-8bd3-e32c84d490e1",
    fit_id: "TRANSF-175573923634644-ENTRADA",
    payee: "tytyty",
    status_atual: "pending",
    status_correto: "transferencia"
  },
  {
    id: "99fc5c41-6bcc-47e8-87f2-99f9c8ed8bbb", 
    fit_id: "TRANSF-17557252099059-ENTRADA",
    payee: "[TRANSFER NCIA ENTRADA] fdd",
    status_atual: "pending",
    status_correto: "transferencia"
  }
];

// Gerar SQL para atualização
console.log('📋 SQL PARA CORREÇÃO:');
console.log('====================\n');

const sqlUpdates = transferenciasParaCorrigir.map(t => {
  return `-- ${t.fit_id} (${t.payee})
UPDATE bank_transactions 
SET 
  reconciliation_status = '${t.status_correto}',
  status_conciliacao = 'transferencia',
  updated_at = NOW()
WHERE id = '${t.id}';`;
}).join('\n\n');

console.log(sqlUpdates);

console.log('\n\n📊 VERIFICAÇÃO APÓS CORREÇÃO:');
console.log('============================\n');

console.log(`-- Verificar se as correções foram aplicadas
SELECT 
  fit_id,
  payee,
  reconciliation_status,
  status_conciliacao,
  amount,
  updated_at
FROM bank_transactions 
WHERE id IN (${transferenciasParaCorrigir.map(t => `'${t.id}'`).join(', ')})
ORDER BY fit_id;

-- Contagem por status após correção
SELECT 
  reconciliation_status,
  COUNT(*) as quantidade
FROM bank_transactions
WHERE bank_account_id = '4fd86770-32c4-4927-9d7e-8f3ded7b38fa'
GROUP BY reconciliation_status
ORDER BY quantidade DESC;

-- Verificar se todas as transferências foram detectadas
SELECT 
  COUNT(*) as total_transferencias_detectadas
FROM bank_transactions 
WHERE reconciliation_status = 'transferencia'
  AND bank_account_id = '4fd86770-32c4-4927-9d7e-8f3ded7b38fa';`);

console.log('\n✅ RESULTADO ESPERADO APÓS EXECUÇÃO:');
console.log('- 7 transações com reconciliation_status = "transferencia"');
console.log('- Todas as transferências identificadas por TRANSF- ou [TRANSFER NCIA]');
console.log('- Outras transações continuam como "pending" até serem processadas');

console.log('\n🔧 PARA PREVENIR FUTURO:');
console.log('1. Execute a API /api/reconciliation/suggestions novamente');  
console.log('2. O matching engine agora detectará transferências automaticamente');
console.log('3. Novas transações OFX serão classificadas corretamente');
