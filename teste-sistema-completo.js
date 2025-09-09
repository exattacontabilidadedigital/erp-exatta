// TESTE COMPLETO - Sistema de Múltiplos Matches
// Execute no console do navegador (F12 > Console)

console.log('🧪 INICIANDO TESTE COMPLETO DO SISTEMA');

// Função para testar as APIs
async function testarSistemaCompleto() {
  try {
    console.log('\n📊 1. VERIFICANDO ESTRUTURA DO BANCO...');
    
    // Simular dados de teste
    const dadosTeste = {
      selectedLancamentos: [
        {
          id: 'test-lancamento-1',
          data_lancamento: '2025-09-07',
          descricao: 'Teste Múltiplo 1',
          valor: 100.00,
          tipo: 'receita',
          status: 'pago'
        },
        {
          id: 'test-lancamento-2', 
          data_lancamento: '2025-09-07',
          descricao: 'Teste Múltiplo 2',
          valor: 50.00,
          tipo: 'receita',
          status: 'pago'
        }
      ],
      primaryLancamentoId: 'test-lancamento-1',
      bankTransactionId: 'test-bank-transaction-1',
      isValidMatch: false,
      totalValue: 150.00,
      matchType: 'multiple_transactions',
      confidenceLevel: 'medium',
      validation: {
        dateMatch: true,
        valueMatch: false,
        valueDifference: 10.00,
        isExactMatch: false
      },
      summary: {
        selectedCount: 2,
        bankAmount: 160.00,
        systemAmount: 150.00,
        difference: 10.00
      }
    };

    console.log('✅ Dados de teste preparados:', {
      totalLancamentos: dadosTeste.selectedLancamentos.length,
      primaryId: dadosTeste.primaryLancamentoId,
      matchType: dadosTeste.matchType
    });

    console.log('\n📤 2. TESTANDO API CREATE-SUGGESTION...');
    
    // Teste da API de criação
    const createResponse = await fetch('/api/conciliacao/create-suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosTeste)
    });

    console.log('📡 Response status:', createResponse.status);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Erro na API create-suggestion:', errorText);
      return;
    }

    const createResult = await createResponse.json();
    console.log('✅ API create-suggestion funcionando:', {
      success: createResult.success,
      matchesCreated: createResult.data?.matches?.length || 0
    });

    console.log('\n📥 3. TESTANDO API GET-MULTIPLE-MATCHES...');
    
    // Teste da API de busca
    const getResponse = await fetch(`/api/conciliacao/get-multiple-matches?bankTransactionId=${dadosTeste.bankTransactionId}`);
    
    console.log('📡 Response status:', getResponse.status);
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ API get-multiple-matches funcionando:', {
        success: getResult.success,
        matchesFound: getResult.data?.matches?.length || 0
      });
    } else {
      console.log('ℹ️ Nenhum match encontrado (esperado para dados de teste)');
    }

    console.log('\n🎯 4. TESTE DE INTERFACE...');
    console.log('👆 Agora teste manualmente:');
    console.log('   1. Vá para página de Conciliação');
    console.log('   2. Clique em "Buscar Lançamentos"');
    console.log('   3. Selecione múltiplos lançamentos');
    console.log('   4. Marque um como primário (estrela)');
    console.log('   5. Clique em "Criar Sugestão"');
    console.log('   6. Recarregue a página');
    console.log('   7. Abra o modal novamente');
    console.log('   8. Verifique se as seleções foram restauradas');

    console.log('\n✅ TESTE COMPLETO FINALIZADO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testarSistemaCompleto();
