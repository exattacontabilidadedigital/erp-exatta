// Teste: Verificar quais lançamentos de 50,00 realmente estão em uso
const testLancamentos = [
  '0f4bb9ea-9cd2-45d1-a60d-3ee2dcfe1208',
  '9c9cb2fa-cb79-41cc-af58-ad5d6b157448',
  '4c99d62e-3cdb-437e-a193-3aeeebd7f450',
  '34eea0d0-fa68-4969-a009-4a09cc8d6a0c',
  '5febd97c-5aa3-4f89-883a-1d4f3be4215e',
  '53563374-4cca-48b3-a262-7b462baeb62b',
  '82844b7a-e5d1-4e56-ba25-695795be3393',
  '688888a6-6271-47b3-88c0-e3bca98093ca',
  'ea5d6beb-2769-46e4-903d-79b3baf1166c',
  '8a09cc88-aa76-4175-9246-3611b0da4833',
  '8ef37911-ac98-4ecd-8024-f1d5f18fbd1f'
];

// Baseado nos dados que você forneceu, apenas estes deveriam ter estrelas:
const realmente_em_uso = [
  '0e9d53d4-1469-4e28-973b-fc14aa39c972', // conciliado
  'e5bad3be-b612-4819-a275-1d9dad480d9f', // conciliado
  '0f4bb9ea-9cd2-45d1-a60d-3ee2dcfe1208'  // conciliado
];

async function testarAPI() {
  console.log('🧪 Testando API real para lançamentos de 50,00...\n');
  
  for (const id of testLancamentos) {
    try {
      const response = await fetch(`http://localhost:3000/api/check-lancamento-usage/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        const deveEstarEmUso = realmente_em_uso.includes(id);
        const status = data.inUse ? '✅ EM USO' : '❌ LIVRE';
        const correto = data.inUse === deveEstarEmUso ? '✅ CORRETO' : '❌ INCORRETO';
        
        console.log(`${id}: ${status} - ${correto}`);
        if (data.inUse) {
          console.log(`   Status: ${data.status}, Cor: ${data.starColor}`);
        }
      } else {
        console.log(`${id}: ❌ ERRO ${response.status}`);
      }
    } catch (error) {
      console.log(`${id}: 💥 ERRO: ${error.message}`);
    }
  }
  
  console.log('\n📊 Resumo:');
  console.log(`Lançamentos testados: ${testLancamentos.length}`);
  console.log(`Deveriam estar em uso: ${realmente_em_uso.length}`);
}

testarAPI();
