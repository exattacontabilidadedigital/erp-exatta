// IDs que vimos nos logs anteriores
const testIds = [
  'd33a868d-2be0-40be-b674-ffd5985c0bec',
  '416f7508-6a7c-41af-9b9c-cfe9c1ff68ff', 
  'c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc',
  '8e2fe946-cd77-4686-bb97-835cd281fbd8',
  '243f2e8d-5851-4810-b3db-42a634eaddeb'
];

async function testAPI() {
  console.log('🧪 Testando API check-lancamento-usage com IDs conhecidos...\n');
  
  for (const id of testIds) {
    console.log(`🔍 Testando ID: ${id}`);
    
    try {
      const response = await fetch(`http://localhost:3000/api/reconciliation/check-lancamento-usage/${id}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Resultado:`, JSON.stringify(result, null, 2));
        
        // Detalhar o resultado
        if (result.isUsed) {
          console.log(`   🟡 USADO - Status: ${result.usageDetails?.status}`);
          console.log(`   💳 Transação bancária: ${result.usageDetails?.bankTransactionId}`);
          console.log(`   ⭐ Cor da estrela: ${result.starColor}`);
        } else {
          console.log(`   🟢 LIVRE - Pode ser usado`);
          console.log(`   ⭐ Cor da estrela: ${result.starColor}`);
        }
      } else {
        const error = await response.text();
        console.log(`❌ Erro ${response.status}:`, error);
      }
      
    } catch (error) {
      console.log(`❌ Erro de rede:`, error.message);
    }
    
    console.log(''); // Linha em branco
  }
}

testAPI();
