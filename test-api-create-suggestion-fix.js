// Teste da API create-suggestion após correção
// Executar no console do navegador para testar

async function testarAPICreateSuggestion() {
  console.log('🧪 Testando API /api/reconciliation/create-suggestion...');
  
  try {
    const response = await fetch('/api/reconciliation/create-suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bank_transaction_id: '8e2fe946-cd77-4686-bb97-835cd281fbd8', // ID de exemplo
        system_transaction_ids: ['test-id-1'], // IDs de exemplo
        reconciliation_status: 'sugestao',
        has_discrepancy: false,
        total_value: 100.50,
        closeModal: true
      })
    });

    console.log('📡 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API funcionando corretamente:', data);
      return data;
    } else {
      const errorData = await response.json();
      console.error('❌ Erro na API:', errorData);
      return errorData;
    }
  } catch (error) {
    console.error('💥 Erro de rede:', error);
    return null;
  }
}

// Executar teste
testarAPICreateSuggestion();
