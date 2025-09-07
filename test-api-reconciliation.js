// Teste direto da API de reconciliation
const testIds = [
  '5febd97c-5aa3-4f89-883a-1d4f3be4215e',
  '53563374-4cca-48b3-a262-7b462baeb62b',
  '82844b7a-e5d1-4e56-ba25-695795be3393'
];

async function testAPI() {
  console.log('🧪 Testando API /api/reconciliation/check-lancamento-usage...\n');
  
  for (const id of testIds) {
    try {
      console.log(`🔍 Testando ID: ${id}`);
      
      const response = await fetch(`http://localhost:3000/api/reconciliation/check-lancamento-usage/${id}`);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Dados:`, data);
      } else {
        const errorText = await response.text();
        console.log(`❌ Erro:`, errorText);
      }
      
      console.log('---');
    } catch (error) {
      console.error(`💥 Erro de fetch para ${id}:`, error.message);
      console.log('---');
    }
  }
}

testAPI();
