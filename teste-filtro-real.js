// Teste do filtro inteligente com dados reais do banco

const transactionData = {
  amount: 50,  // R$ 50,00 - existem lançamentos pendentes com esse valor
  posted_at: '2025-08-19',  // Data dos lançamentos pendentes
  payee: 'teste filtro',
  memo: 'Teste do filtro inteligente'
};

console.log('🧪 TESTE DO FILTRO INTELIGENTE COM DADOS REAIS');
console.log('================================================');
console.log('');

console.log('📊 Dados da transação bancária:');
console.log(`   - Valor: R$ ${transactionData.amount}`);
console.log(`   - Data: ${transactionData.posted_at}`);
console.log(`   - Descrição: ${transactionData.payee}`);
console.log('');

console.log('📋 Lançamentos pendentes encontrados no banco com valor R$ 50:');
console.log('   1. ID: 758d207e-2f80-4d51-b9c5-de47dac831aa');
console.log('      - Valor: R$ 58,00 (próximo)');
console.log('      - Data: 2025-08-19');
console.log('      - Status: pendente');
console.log('      - Conta: 4fd86770-32c4-4927-9d7e-8f3ded7b38fa');
console.log('');
console.log('   2. ID: 8a09cc88-aa76-4175-9246-3611b0da4833');
console.log('      - Valor: R$ 50,00 (exato!)');
console.log('      - Data: 2025-08-19');
console.log('      - Status: pendente');
console.log('      - Conta: 8ad0f3fb-88cc-4f39-8d50-f47efb3a5486');
console.log('');
console.log('   3. ID: ea5d6beb-2769-46e4-903d-79b3baf1166c');
console.log('      - Valor: R$ 50,00 (exato!)');
console.log('      - Data: 2025-08-19');
console.log('      - Status: pendente');
console.log('      - Conta: 4fd86770-32c4-4927-9d7e-8f3ded7b38fa');
console.log('');

console.log('🎯 EXPECTATIVA DO FILTRO INTELIGENTE:');
console.log('');
console.log('✅ FILTRO PRIMÁRIO (deve ser aplicado):');
console.log('   - Valor exato: R$ 50,00 (valorMin=50, valorMax=50)');
console.log('   - Data: ±3 dias (2025-08-16 a 2025-08-22)');
console.log('   - Contas: todas as 4 contas bancárias incluídas');
console.log('   - Status: pendente');
console.log('');
console.log('📈 RESULTADO ESPERADO:');
console.log('   - Deve encontrar 2 lançamentos exatos de R$ 50,00');
console.log('   - IDs: 8a09cc88 e ea5d6beb');
console.log('');

console.log('🚨 PROBLEMA IDENTIFICADO:');
console.log('   - O sistema estava aplicando Fallback 2 (±10%, ±14 dias)');
console.log('   - Precisa aplicar o Filtro Primário (valor exato, ±3 dias)');
console.log('');

console.log('🔧 PRÓXIMOS PASSOS:');
console.log('   1. Verificar por que as condições do filtro inteligente não estão sendo atendidas');
console.log('   2. Garantir que transactionData está sendo passado corretamente');
console.log('   3. Validar detecção de filtro manual vs automático');
console.log('   4. Testar com valor R$ 50,00 em vez de R$ 25,00');
