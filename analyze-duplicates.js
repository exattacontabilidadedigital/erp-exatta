// Script para executar via SQL - evita problemas com variáveis de ambiente
console.log('📋 SCRIPT SQL PARA LIMPAR MATCHES DUPLICADOS');
console.log('==========================================');
console.log('');
console.log('Execute este SQL no seu banco Supabase:');
console.log('');

const sqlScript = `
-- 1. Analisar situação atual
SELECT 
  '1. ANÁLISE ATUAL' as etapa,
  COUNT(*) as total_matches,
  COUNT(DISTINCT bank_transaction_id) as unique_bank_transactions,
  COUNT(*) - COUNT(DISTINCT bank_transaction_id) as duplicates
FROM transaction_matches;

-- 2. Identificar duplicatas específicas
SELECT 
  '2. DUPLICATAS IDENTIFICADAS' as etapa,
  bank_transaction_id,
  COUNT(*) as match_count
FROM transaction_matches 
GROUP BY bank_transaction_id 
HAVING COUNT(*) > 1
ORDER BY match_count DESC;

-- 3. Mostrar detalhes das duplicatas
SELECT 
  '3. DETALHES DAS DUPLICATAS' as etapa,
  tm.bank_transaction_id,
  tm.id as match_id,
  tm.status,
  tm.created_at,
  tm.match_score,
  tm.notes
FROM transaction_matches tm
WHERE tm.bank_transaction_id IN (
  SELECT bank_transaction_id 
  FROM transaction_matches 
  GROUP BY bank_transaction_id 
  HAVING COUNT(*) > 1
)
ORDER BY tm.bank_transaction_id, tm.created_at DESC;

-- 4. CORREÇÃO: Remover duplicatas mantendo o melhor match de cada transação
WITH duplicates AS (
  SELECT 
    bank_transaction_id,
    array_agg(id ORDER BY 
      CASE WHEN status = 'confirmed' THEN 1 ELSE 2 END,
      created_at DESC
    ) as match_ids
  FROM transaction_matches 
  GROUP BY bank_transaction_id 
  HAVING COUNT(*) > 1
),
matches_to_delete AS (
  SELECT unnest(match_ids[2:]) as id_to_delete
  FROM duplicates
)
DELETE FROM transaction_matches 
WHERE id IN (SELECT id_to_delete FROM matches_to_delete);

-- 5. Atualizar status das transações bancárias
UPDATE bank_transactions 
SET 
  reconciliation_status = CASE 
    WHEN tm.status = 'confirmed' THEN 'conciliado'
    WHEN tm.status = 'suggested' THEN 'sugerido'
    ELSE 'pending'
  END,
  status_conciliacao = CASE 
    WHEN tm.status = 'confirmed' THEN 'conciliado'
    ELSE 'pendente'
  END,
  matched_lancamento_id = CASE 
    WHEN tm.status = 'confirmed' THEN tm.system_transaction_id
    ELSE NULL
  END,
  match_confidence = tm.match_score,
  updated_at = NOW()
FROM transaction_matches tm
WHERE bank_transactions.id = tm.bank_transaction_id;

-- 6. Verificação final
SELECT 
  '6. RESULTADO FINAL' as etapa,
  COUNT(*) as total_matches_final,
  COUNT(DISTINCT bank_transaction_id) as unique_bank_transactions_final,
  COUNT(*) - COUNT(DISTINCT bank_transaction_id) as duplicates_remaining
FROM transaction_matches;

-- 7. Estatísticas por status
SELECT 
  '7. DISTRIBUIÇÃO POR STATUS' as etapa,
  status,
  COUNT(*) as count
FROM transaction_matches 
GROUP BY status
ORDER BY count DESC;

-- 8. Verificar se alguma transação ainda tem duplicatas
SELECT 
  '8. DUPLICATAS RESTANTES' as etapa,
  bank_transaction_id,
  COUNT(*) as match_count
FROM transaction_matches 
GROUP BY bank_transaction_id 
HAVING COUNT(*) > 1;
`;

console.log(sqlScript);
console.log('');
console.log('✅ RESULTADO ESPERADO:');
console.log('- Duplicatas restantes: 0');
console.log('- Total matches ≤ 14 (número de transações OFX)');
console.log('- Cada bank_transaction_id aparece apenas 1 vez');
console.log('');
console.log('🔧 INSTRUÇÕES:');
console.log('1. Copie todo o SQL acima');
console.log('2. Execute no painel SQL do Supabase');
console.log('3. Verifique se os resultados mostram 0 duplicatas');
console.log('4. Execute novamente a funcionalidade de sugestões');

// Análise dos dados fornecidos pelo usuário
console.log('');
console.log('📊 ANÁLISE DOS DADOS FORNECIDOS:');
console.log('');

const jsonData = '[{"idx":0,"id":"154e8a19-061f-46ed-8f88-2ef543377238","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"ba51f5ed-6e2f-4245-9d16-c007fd52c7ab","system_transaction_id":"0e9d53d4-1469-4e28-973b-fc14aa39c972","match_score":"0.95","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Descrição similar (100.0%)","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null},{"idx":1,"id":"1c34b4ed-c727-4f7d-9f51-dce11944861f","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"1675187a-f508-426c-a036-308feaa4b80d","system_transaction_id":"c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc","match_score":"1.00","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":2,"id":"2cf909d7-76c5-4ab7-8e0f-7527ed4433be","reconciliation_id":"3f72cd07-2a2a-4a3b-9b3f-9790dab3a169","bank_transaction_id":"1675187a-f508-426c-a036-308feaa4b80d","system_transaction_id":"243f2e8d-5851-4810-b3db-42a634eaddeb","match_score":"1.00","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null},{"idx":3,"id":"490b59f9-744c-4cd1-9d9e-739d480a3377","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"2edc2b75-b2f0-4369-afa5-bebe74356c4f","system_transaction_id":"fa839aea-a24a-4f93-a7a5-b073dd7f6b6f","match_score":"0.95","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Descrição similar (100.0%)","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":4,"id":"4d86a92d-ed89-4235-8820-89c55fd3baa0","reconciliation_id":"3f72cd07-2a2a-4a3b-9b3f-9790dab3a169","bank_transaction_id":"72af278f-ad04-4486-957a-71429923f80f","system_transaction_id":"c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc","match_score":"0.95","match_type":"suggested","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência válida - descrição com termo + mesma data + valores iguais e opostos","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null},{"idx":5,"id":"55382d1d-3f7b-4588-8317-b73a1d486be5","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"72af278f-ad04-4486-957a-71429923f80f","system_transaction_id":"243f2e8d-5851-4810-b3db-42a634eaddeb","match_score":"0.95","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Transferência válida - descrição com termo + mesma data + valores iguais e opostos","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":6,"id":"560e9281-e4e3-4ae3-a439-188baeaacaa0","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"0f402f71-f05d-4e21-8d26-995b888c0a15","system_transaction_id":"8ef37911-ac98-4ecd-8024-f1d5f18fbd1f","match_score":"0.70","match_type":"automatic","confidence_level":"medium","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Descrição similar (100.0%)","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":7,"id":"56d47afd-d231-48ed-a9fe-c4b2a2254626","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"28950902-6b90-46fb-ba97-fc9660977b22","system_transaction_id":"e8962e1a-d4b5-412a-beb6-725923f34dd1","match_score":"0.70","match_type":"automatic","confidence_level":"medium","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Descrição similar (100.0%)","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":8,"id":"59bf2ed1-7626-44a6-8622-b3411a45d963","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"b4dc4539-9586-486f-a836-60356461670e","system_transaction_id":"8e2fe946-cd77-4686-bb97-835cd281fbd8","match_score":"1.00","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":9,"id":"61005d6e-aa69-4299-8c63-3076224efa2a","reconciliation_id":"3f72cd07-2a2a-4a3b-9b3f-9790dab3a169","bank_transaction_id":"2edc2b75-b2f0-4369-afa5-bebe74356c4f","system_transaction_id":"58fdde57-ebba-4019-bdbf-c3eb39c9ef37","match_score":"0.95","match_type":"suggested","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência válida - descrição com termo + mesma data + valores iguais e opostos","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null},{"idx":10,"id":"6ae7fb38-3b7b-4848-94c1-1dd60abcbc0f","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"bb0f7626-e263-4f45-95c0-ec9ffff97a7a","system_transaction_id":"0e880de2-9566-4db3-8eed-7bc9e17a2c69","match_score":"0.70","match_type":"automatic","confidence_level":"medium","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Descrição similar (100.0%)","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":11,"id":"721b6a8f-ea40-490b-bf3d-07e04dcc668e","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"6cf0d7f2-38ce-4ba7-a3c6-066214d4b8a3","system_transaction_id":"d33a868d-2be0-40be-b674-ffd5985c0bec","match_score":"0.95","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Transferência válida - descrição com termo + mesma data + valores iguais e opostos","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":12,"id":"773cf869-3829-44f9-abe9-91d8df0c7f32","reconciliation_id":"3f72cd07-2a2a-4a3b-9b3f-9790dab3a169","bank_transaction_id":"6cf0d7f2-38ce-4ba7-a3c6-066214d4b8a3","system_transaction_id":"8e2fe946-cd77-4686-bb97-835cd281fbd8","match_score":"0.95","match_type":"suggested","confidence_level":"high","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Transferência válida - descrição com termo + mesma data + valores iguais e opostos","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null},{"idx":13,"id":"86f8d3b8-5366-4bd0-8edf-a9850df92b9e","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"c67314d4-bf70-4170-aa80-56758b928c4a","system_transaction_id":"416f7508-6a7c-41af-9b9c-cfe9c1ff68ff","match_score":"1.00","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null},{"idx":14,"id":"91b02557-eec8-42f9-a556-6a5fda1cee1a","reconciliation_id":"3f72cd07-2a2a-4a3b-9b3f-9790dab3a169","bank_transaction_id":"f267ed8c-f0db-422c-be33-6e2028b9eeab","system_transaction_id":"fa839aea-a24a-4f93-a7a5-b073dd7f6b6f","match_score":"1.00","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null},{"idx":15,"id":"a1a11d15-ed2a-4b5f-943b-45a7f251665e","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"9c8b84df-84c5-440d-94be-3d27cc639198","system_transaction_id":"e5bad3be-b612-4819-a275-1d9dad480d9f","match_score":"1.00","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null},{"idx":16,"id":"a4d0d210-80fa-494e-b945-73f07df28107","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"f267ed8c-f0db-422c-be33-6e2028b9eeab","system_transaction_id":"58fdde57-ebba-4019-bdbf-c3eb39c9ef37","match_score":"1.00","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":17,"id":"aff28ef1-d681-4de7-b6e8-f79fbc3f3bba","reconciliation_id":"50d8aea0-9e9d-4a48-a91c-6a1fdfee128e","bank_transaction_id":"60ec5afc-4e7c-4299-a819-545c7479afd6","system_transaction_id":"4c99d62e-3cdb-437e-a193-3aeeebd7f450","match_score":"0.70","match_type":"automatic","confidence_level":"medium","status":"suggested","matched_by_user_id":null,"matched_at":null,"notes":"Descrição similar (100.0%)","created_at":"2025-09-04 19:53:37.244834+00","updated_at":"2025-09-04 19:53:37.244834+00","reconciliation_session_id":null},{"idx":18,"id":"b64ca73c-fe93-40ae-b9ff-d1b3492e65cd","reconciliation_id":"3f72cd07-2a2a-4a3b-9b3f-9790dab3a169","bank_transaction_id":"b4dc4539-9586-486f-a836-60356461670e","system_transaction_id":"d33a868d-2be0-40be-b674-ffd5985c0bec","match_score":"1.00","match_type":"automatic","confidence_level":"high","status":"confirmed","matched_by_user_id":null,"matched_at":null,"notes":"Valor, data e descrição idênticos","created_at":"2025-09-04 19:53:29.365068+00","updated_at":"2025-09-04 19:53:29.365068+00","reconciliation_session_id":null}]';

try {
  const matches = JSON.parse(jsonData);
  
  // Agrupar por bank_transaction_id
  const grouped = matches.reduce((acc, match) => {
    const bankId = match.bank_transaction_id;
    if (!acc[bankId]) {
      acc[bankId] = [];
    }
    acc[bankId].push(match);
    return acc;
  }, {});
  
  const duplicatedTransactions = Object.entries(grouped)
    .filter(([bankId, matches]) => matches.length > 1);
  
  console.log(`Total de matches: ${matches.length}`);
  console.log(`Transações bancárias únicas: ${Object.keys(grouped).length}`);
  console.log(`Transações com duplicatas: ${duplicatedTransactions.length}`);
  console.log('');
  
  console.log('TRANSAÇÕES COM DUPLICATAS:');
  duplicatedTransactions.forEach(([bankId, bankMatches]) => {
    console.log(`${bankId}: ${bankMatches.length} matches`);
    bankMatches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.id} (${match.status}) - ${match.created_at}`);
    });
  });
  
} catch (error) {
  console.error('Erro ao analisar dados:', error);
}

console.log('');
console.log('🎯 CONCLUSÃO:');
console.log('Você tem 19 matches para provavelmente 14 transações OFX únicos.');
console.log('Execute o SQL acima para corrigir a situação.');
console.log('Após a correção, você terá no máximo 14 matches (1 por transação OFX).');
