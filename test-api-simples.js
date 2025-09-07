// Teste simples da API check-lancamento-usage
const testSimpleAPI = async () => {
  try {
    console.log('🧪 Teste SIMPLES da API check-lancamento-usage\n');
    
    // Teste básico - apenas ver se a API responde
    const testId = 'test-id-123';
    const url = `http://localhost:3000/api/reconciliation/check-lancamento-usage/${testId}`;
    
    console.log(`📡 Fazendo requisição para: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);
    console.log(`📊 OK: ${response.ok}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Dados retornados:', JSON.stringify(data, null, 2));
      
      if (data.isInUse === false) {
        console.log('✅ API funcionando - lançamento não está em uso (esperado para ID de teste)');
      } else {
        console.log('🔍 API funcionando - lançamento em uso encontrado');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na API:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
};

// Aguardar um pouco para garantir que o servidor esteja pronto
setTimeout(testSimpleAPI, 2000);
