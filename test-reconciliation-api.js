// Script para testar a API de conciliação diretamente
const testReconciliationAPI = async () => {
  console.log('🧪 TESTE: Verificando API de conciliação...');
  
  try {
    // 1. Primeiro, obter algumas transações para teste
    console.log('1️⃣ Buscando transações para teste...');
    
    const response = await fetch('http://localhost:3003/api/reconciliation/suggestions?bank_account_id=test&period_start=2024-01-01&period_end=2024-12-31&empresa_id=test');
    
    if (!response.ok) {
      console.error('❌ Erro ao buscar transações:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📊 Dados obtidos:', {
      pairsCount: data.pairs?.length || 0,
      firstPair: data.pairs?.[0]
    });
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log('ℹ️ Nenhuma transação encontrada para teste');
      return;
    }
    
    // 2. Selecionar uma transação que tenha match sugerido
    const suggestedPair = data.pairs.find(pair => 
      pair.bankTransaction && 
      pair.systemTransaction && 
      pair.status === 'sugerido'
    );
    
    if (!suggestedPair) {
      console.log('ℹ️ Nenhuma transação com sugestão encontrada');
      console.log('📋 Status disponíveis:', data.pairs.map(p => p.status));
      return;
    }
    
    console.log('🎯 Transação selecionada para teste:', {
      bankId: suggestedPair.bankTransaction.id,
      systemId: suggestedPair.systemTransaction.id,
      bankStatus: suggestedPair.bankTransaction.status_conciliacao,
      reconciliationStatus: suggestedPair.bankTransaction.reconciliation_status
    });
    
    // 3. Verificar status ANTES da conciliação
    console.log('3️⃣ Verificando status ANTES da conciliação...');
    const statusBeforeResponse = await fetch(`http://localhost:3003/api/reconciliation/status/${suggestedPair.bankTransaction.id}`);
    const statusBefore = statusBeforeResponse.ok ? await statusBeforeResponse.json() : null;
    console.log('📊 Status ANTES:', statusBefore?.status_conciliacao || 'não verificado');
    
    // 4. Chamar API de conciliação
    console.log('4️⃣ Chamando API de conciliação...');
    const conciliateResponse = await fetch('http://localhost:3003/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: suggestedPair.bankTransaction.id,
        system_transaction_id: suggestedPair.systemTransaction.id,
        confidence_level: 'high',
        rule_applied: 'teste_manual'
      })
    });
    
    console.log('📡 Resposta da conciliação:', {
      status: conciliateResponse.status,
      statusText: conciliateResponse.statusText,
      ok: conciliateResponse.ok
    });
    
    if (!conciliateResponse.ok) {
      const errorData = await conciliateResponse.text();
      console.error('❌ Erro na conciliação:', errorData);
      return;
    }
    
    const conciliateResult = await conciliateResponse.json();
    console.log('✅ Resultado da conciliação:', conciliateResult);
    
    // 5. Verificar status DEPOIS da conciliação
    console.log('5️⃣ Verificando status DEPOIS da conciliação...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
    
    const statusAfterResponse = await fetch(`http://localhost:3003/api/reconciliation/status/${suggestedPair.bankTransaction.id}`);
    const statusAfter = statusAfterResponse.ok ? await statusAfterResponse.json() : null;
    console.log('📊 Status DEPOIS:', statusAfter?.status_conciliacao || 'não verificado');
    
    // 6. Resultado do teste
    const statusMudou = statusBefore?.status_conciliacao !== statusAfter?.status_conciliacao;
    const ficouConciliado = statusAfter?.status_conciliacao === 'conciliado';
    
    console.log('🎯 RESULTADO DO TESTE:', {
      statusAntes: statusBefore?.status_conciliacao,
      statusDepois: statusAfter?.status_conciliacao,
      statusMudou,
      ficouConciliado,
      apiEstaFuncionando: statusMudou && ficouConciliado ? '✅ SIM' : '❌ NÃO'
    });
    
    if (!statusMudou) {
      console.error('❌ PROBLEMA: Status não mudou após conciliação');
    } else if (!ficouConciliado) {
      console.warn('⚠️ PROBLEMA: Status mudou mas não ficou "conciliado"');
    } else {
      console.log('🎉 SUCESSO: API está funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
};

// Executar o teste
testReconciliationAPI();
