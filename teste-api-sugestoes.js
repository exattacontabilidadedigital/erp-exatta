// TESTE ESPECÍFICO - Verificar se Sistema de Sugestões está Funcionando
// Teste direto com a API de sugestões

const testUrl = 'http://localhost:3000/api/reconciliation/suggestions';

const testParams = new URLSearchParams({
  empresaId: 'test-empresa',
  contaId: 'test-conta'
});

console.log('🧪 TESTANDO SISTEMA DE SUGESTÕES NA API REAL');
console.log('=============================================\n');

console.log('🔗 URL de Teste:', `${testUrl}?${testParams}`);
console.log('📋 Parâmetros:', {
  empresaId: 'test-empresa',
  contaId: 'test-conta'
});

console.log('\n🎯 EXPECTATIVAS:');
console.log('✅ Deve aplicar regras padrão quando não há regras no banco');
console.log('🟡 Deve gerar SUGESTÕES para transações similares');
console.log('📊 Deve mostrar logs das regras aplicadas');

console.log('\n💡 COMO TESTAR:');
console.log('1. Certifique-se que o servidor está rodando (npm run dev)');
console.log('2. Acesse a URL acima no navegador ou Postman');
console.log('3. Verifique os logs no terminal do servidor');
console.log('4. Procure por logs como:');
console.log('   - "🎯 Regras de matching aplicadas: 2"');
console.log('   - "🎯 Fase 2: Matching por Regras..."');
console.log('   - "✅ Match por regra valor+data encontrado!"');

console.log('\n🔍 LOGS ESPERADOS:');
console.log(`
Expected logs:
🎯 Regras de matching aplicadas: 2
   - Valor e Data com Tolerância (valor_data) - Peso: 8
   - Similaridade de Descrição (descricao) - Peso: 7
🎯 Fase 2: Matching por Regras...
🎯 Aplicando regra valor+data para transação...
✅ Match por regra valor+data encontrado!
Status: sugerido
`);

console.log('\n📈 RESULTADOS ESPERADOS:');
console.log('- Matches exatos: status "conciliado"');
console.log('- Matches com pequenas diferenças: status "sugerido"');
console.log('- Score entre 60-79 para sugestões');
console.log('- Confidence "medium" para sugestões');

console.log('\n🚀 TESTE CONCLUÍDO - Vá para a interface e teste!');
