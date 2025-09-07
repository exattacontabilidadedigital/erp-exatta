// Script para testar API check-lancamento-usage corrigida
const testLancamentos = [
  '758d207e-2f80-4d51-b9c5-de47dac831aa',
  'ea5d6beb-2769-46e4-903d-79b3baf1166c',
  '8a09cc88-aa76-4175-9246-3611b0da4833'
];

async function testAPI() {
  console.log('🧪 Testando API check-lancamento-usage corrigida...\n');
  
  for (const lancamentoId of testLancamentos) {
    try {
      console.log(`📋 Testando lançamento: ${lancamentoId.substring(0, 8)}...`);
      
      const response = await fetch(`http://localhost:3000/api/reconciliation/check-lancamento-usage/${lancamentoId}`);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Sucesso:`, {
          isInUse: data.isInUse,
          status: data.status,
          statusConciliacao: data.statusConciliacao,
          message: data.message
        });
      } else {
        const error = await response.text();
        console.log(`   ❌ Erro:`, error.substring(0, 200));
      }
      
      console.log(''); // Linha em branco
      
    } catch (error) {
      console.log(`   💥 Exceção:`, error.message);
      console.log('');
    }
    
    // Pequena pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Teste completo!');
}

// Executar teste se chamado via node
if (typeof window === 'undefined') {
  testAPI();
}

// Exportar para uso em browser
if (typeof window !== 'undefined') {
  window.testAPI = testAPI;
}
