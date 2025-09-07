// Script para testar a API create-suggestion
console.log('🧪 Testando API create-suggestion...');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/reconciliation/create-suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bank_transaction_id: 'test-123',
        selected_transactions: [
          { id: 1, valor: 100, data_lancamento: '2024-01-01' }
        ],
        validation_details: {
          match_type: 'exact_match',
          confidence_level: 'high',
          is_value_compatible: true
        }
      })
    });

    console.log('Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Erro response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Sucesso:', data);
    
  } catch (error) {
    console.error('❌ Erro de rede:', error.message);
  }
}

testAPI();
