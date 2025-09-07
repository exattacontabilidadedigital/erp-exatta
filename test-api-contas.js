// Teste da API de contas bancárias
const test = async () => {
  try {
    console.log('🧪 Testando API de contas bancárias...');
    
    // Testar sem empresa_id (deve dar erro 400)
    console.log('1. Testando sem empresa_id...');
    const response1 = await fetch('http://localhost:3000/api/contas-bancarias');
    console.log('Status:', response1.status);
    const data1 = await response1.json();
    console.log('Resposta:', data1);
    
    console.log('\n2. Testando com empresa_id...');
    // Testar com empresa_id
    const response2 = await fetch('http://localhost:3000/api/contas-bancarias?empresa_id=test-123');
    console.log('Status:', response2.status);
    const data2 = await response2.json();
    console.log('Resposta:', data2);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

test();
