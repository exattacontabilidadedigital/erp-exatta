// TESTE SIMPLIFICADO - Apenas teste da criação de matches
// Execute no console do navegador para testar apenas a API de criação

console.log('🧪 TESTE SIMPLIFICADO - Apenas API de Criação');

async function testeSimplificado() {
  try {
    console.log('\n📤 Testando apenas API CREATE-SUGGESTION...');
    
    // Dados mínimos para teste
    const dadosMinimos = {
      selectedLancamentos: [
        {
          id: 'test-1',
          valor: 100.00,
          descricao: 'Teste 1'
        }
      ],
      primaryLancamentoId: 'test-1',
      bankTransactionId: 'test-bank-1',
      isValidMatch: true,
      totalValue: 100.00,
      matchType: 'exact',  // Usando valor correto
      confidenceLevel: 'high'
    };

    const response = await fetch('/api/conciliacao/create-suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosMinimos)
    });

    console.log('📡 Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API funcionando!', result);
    } else {
      const error = await response.text();
      console.log('❌ Erro na API:', error);
    }
    
  } catch (error) {
    console.log('❌ Erro de rede:', error);
  }
}

testeSimplificado();
