/**
 * Teste do Filtro Inteligente Melhorado
 * Verifica as novas tolerâncias implementadas:
 * - Valor: ±10% para mais e para menos
 * - Data: ±3 dias para mais e para menos
 */

// Simulação dos dados da transação OFX
const transacaoOFX = {
  amount: "25.00",
  posted_at: "2024-12-20"
};

console.log('🧪 TESTE: Filtro Inteligente Melhorado');
console.log('=' .repeat(50));

// Teste 1: Cálculo de tolerância de valor (10%)
const valorTransacao = Math.abs(parseFloat(transacaoOFX.amount));
const toleranciaValor = 0.10; // 10%

const valorMin = valorTransacao * (1 - toleranciaValor);
const valorMax = valorTransacao * (1 + toleranciaValor);

console.log('📊 TOLERÂNCIA DE VALOR (±10%):');
console.log(`   Valor da transação OFX: R$ ${valorTransacao.toFixed(2)}`);
console.log(`   Valor mínimo aceito: R$ ${valorMin.toFixed(2)}`);
console.log(`   Valor máximo aceito: R$ ${valorMax.toFixed(2)}`);
console.log(`   Faixa de busca: R$ ${valorMin.toFixed(2)} - R$ ${valorMax.toFixed(2)}`);

// Teste 2: Cálculo de tolerância de data (±3 dias)
const dataTransacao = new Date(transacaoOFX.posted_at);
const dataInicio = new Date(dataTransacao);
const dataFim = new Date(dataTransacao);

const toleranciaDias = 3;
dataInicio.setDate(dataTransacao.getDate() - toleranciaDias);
dataFim.setDate(dataTransacao.getDate() + toleranciaDias);

console.log('\n📅 TOLERÂNCIA DE DATA (±3 dias):');
console.log(`   Data da transação OFX: ${dataTransacao.toISOString().split('T')[0]}`);
console.log(`   Data início da busca: ${dataInicio.toISOString().split('T')[0]}`);
console.log(`   Data fim da busca: ${dataFim.toISOString().split('T')[0]}`);
console.log(`   Período de busca: ${toleranciaDias * 2 + 1} dias`);

// Teste 3: Simulação de valores que seriam encontrados
const valoresTeste = [22.50, 23.00, 24.00, 25.00, 26.00, 27.00, 27.50, 30.00];
const valorDentroTolerancia = valoresTeste.filter(v => v >= valorMin && v <= valorMax);

console.log('\n🎯 VALORES QUE SERIAM ENCONTRADOS:');
console.log('   Valores de teste:', valoresTeste.map(v => `R$ ${v.toFixed(2)}`).join(', '));
console.log('   Valores na tolerância:', valorDentroTolerancia.map(v => `R$ ${v.toFixed(2)}`).join(', '));
console.log(`   Total de matches esperados: ${valorDentroTolerancia.length} de ${valoresTeste.length}`);

// Teste 4: Simulação de datas que seriam encontradas
const datasTeste = [
  '2024-12-17', // -3 dias
  '2024-12-18', // -2 dias  
  '2024-12-19', // -1 dia
  '2024-12-20', // mesma data
  '2024-12-21', // +1 dia
  '2024-12-22', // +2 dias
  '2024-12-23', // +3 dias
  '2024-12-24'  // +4 dias (fora da tolerância)
];

const datasDentroTolerancia = datasTeste.filter(d => {
  const data = new Date(d);
  return data >= dataInicio && data <= dataFim;
});

console.log('\n📆 DATAS QUE SERIAM ENCONTRADAS:');
console.log('   Datas de teste:', datasTeste.join(', '));
console.log('   Datas na tolerância:', datasDentroTolerancia.join(', '));
console.log(`   Total de matches esperados: ${datasDentroTolerancia.length} de ${datasTeste.length}`);

// Teste 5: Parâmetros que serão enviados para a API
const params = new URLSearchParams();
params.append('valorMin', valorMin.toFixed(2));
params.append('valorMax', valorMax.toFixed(2));
params.append('buscarValorAbsoluto', 'true');
params.append('status', 'pendente');
params.append('dataInicio', dataInicio.toISOString().split('T')[0]);
params.append('dataFim', dataFim.toISOString().split('T')[0]);

console.log('\n🌐 PARÂMETROS PARA API:');
Object.fromEntries(params.entries()).forEach = function() {
  for (const [key, value] of params.entries()) {
    console.log(`   ${key}: ${value}`);
  }
};
for (const [key, value] of params.entries()) {
  console.log(`   ${key}: ${value}`);
}

console.log('\n✅ RESUMO DAS MELHORIAS:');
console.log('   • Tolerância de valor reduzida para ±10% (mais precisa)');
console.log('   • Tolerância de data reduzida para ±3 dias (mais focada)');
console.log('   • Sistema de fallback com tolerâncias progressivas');
console.log('   • Filtro mais inteligente e eficiente');

// Teste 6: Comparação com versão anterior
console.log('\n📈 COMPARAÇÃO COM VERSÃO ANTERIOR:');
console.log('   ANTES: ±50% valor, ±7 dias (muito amplo)');
console.log('   AGORA: ±10% valor, ±3 dias (mais preciso)');
console.log('   FALLBACK 1: ±20% valor, ±7 dias (intermediário)');
console.log('   FALLBACK 2: sem valor, ±14 dias (amplo)');
