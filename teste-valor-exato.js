/**
 * Teste do Filtro com Valor Exato + Intervalo de Data
 * Verifica a nova configuração:
 * - Valor: EXATO da transação OFX (sem tolerância)
 * - Data: ±3 dias para mais e para menos
 */

// Simulação dos dados da transação OFX
const transacaoOFX = {
  amount: "25.00",
  posted_at: "2024-12-20"
};

console.log('🧪 TESTE: Filtro com Valor Exato + Intervalo de Data');
console.log('=' .repeat(60));

// Teste 1: Valor EXATO (sem tolerância)
const valorTransacao = Math.abs(parseFloat(transacaoOFX.amount));

console.log('💰 VALOR EXATO (0% tolerância):');
console.log(`   Valor da transação OFX: R$ ${valorTransacao.toFixed(2)}`);
console.log(`   Valor mínimo aceito: R$ ${valorTransacao.toFixed(2)}`);
console.log(`   Valor máximo aceito: R$ ${valorTransacao.toFixed(2)}`);
console.log(`   Tolerância: 0% (valor exato)`);
console.log(`   ✅ Aceita APENAS: R$ ${valorTransacao.toFixed(2)}`);

// Teste 2: Intervalo de data (±3 dias)
const dataTransacao = new Date(transacaoOFX.posted_at);
const dataInicio = new Date(dataTransacao);
const dataFim = new Date(dataTransacao);

const toleranciaDias = 3;
dataInicio.setDate(dataTransacao.getDate() - toleranciaDias);
dataFim.setDate(dataTransacao.getDate() + toleranciaDias);

console.log('\n📅 INTERVALO DE DATA (±3 dias):');
console.log(`   Data da transação OFX: ${dataTransacao.toISOString().split('T')[0]}`);
console.log(`   Data início da busca: ${dataInicio.toISOString().split('T')[0]}`);
console.log(`   Data fim da busca: ${dataFim.toISOString().split('T')[0]}`);
console.log(`   Período de busca: ${toleranciaDias * 2 + 1} dias`);

// Teste 3: Simulação de lançamentos que seriam encontrados
const lancamentosTeste = [
  { valor: 24.50, data: '2024-12-20', match: false }, // Valor diferente
  { valor: 25.00, data: '2024-12-16', match: false }, // Data fora do intervalo
  { valor: 25.00, data: '2024-12-17', match: true },  // ✅ Match perfeito
  { valor: 25.00, data: '2024-12-20', match: true },  // ✅ Match perfeito
  { valor: 25.00, data: '2024-12-23', match: true },  // ✅ Match perfeito
  { valor: 25.00, data: '2024-12-24', match: false }, // Data fora do intervalo
  { valor: 25.50, data: '2024-12-20', match: false }, // Valor diferente
];

const matchesEncontrados = lancamentosTeste.filter(l => {
  const valorMatch = parseFloat(l.valor.toString()) === valorTransacao;
  const dataLanc = new Date(l.data);
  const dataMatch = dataLanc >= dataInicio && dataLanc <= dataFim;
  l.match = valorMatch && dataMatch;
  return l.match;
});

console.log('\n🎯 SIMULAÇÃO DE MATCHES:');
console.log('   Lançamentos de teste:');
lancamentosTeste.forEach((l, i) => {
  const status = l.match ? '✅' : '❌';
  const motivo = l.match ? 'MATCH' : 
    (parseFloat(l.valor.toString()) !== valorTransacao ? 'valor diferente' : 'data fora do intervalo');
  console.log(`   ${i + 1}. ${status} R$ ${l.valor.toFixed(2)} em ${l.data} (${motivo})`);
});

console.log(`\n   Total de matches encontrados: ${matchesEncontrados.length} de ${lancamentosTeste.length}`);

// Teste 4: Sistema de Fallback
console.log('\n🔄 SISTEMA DE FALLBACK:');
console.log('   FILTRO PRINCIPAL: Valor exato + ±3 dias');
console.log('   ↓');
console.log('   FALLBACK 1: ±5% valor + ±3 dias');
console.log('   ↓');
console.log('   FALLBACK 2: ±10% valor + ±7 dias');

// Simulação dos fallbacks
const fallback1Tolerancia = 0.05; // 5%
const fallback1Min = valorTransacao * (1 - fallback1Tolerancia);
const fallback1Max = valorTransacao * (1 + fallback1Tolerancia);

const fallback2Tolerancia = 0.10; // 10%
const fallback2Min = valorTransacao * (1 - fallback2Tolerancia);
const fallback2Max = valorTransacao * (1 + fallback2Tolerancia);

console.log('\n📊 TOLERÂNCIAS DE FALLBACK:');
console.log(`   Fallback 1 (±5%): R$ ${fallback1Min.toFixed(2)} - R$ ${fallback1Max.toFixed(2)}`);
console.log(`   Fallback 2 (±10%): R$ ${fallback2Min.toFixed(2)} - R$ ${fallback2Max.toFixed(2)}`);

// Teste 5: Parâmetros para API
const params = new URLSearchParams();
params.append('valorMin', valorTransacao.toFixed(2));
params.append('valorMax', valorTransacao.toFixed(2));
params.append('buscarValorAbsoluto', 'true');
params.append('status', 'pendente');
params.append('dataInicio', dataInicio.toISOString().split('T')[0]);
params.append('dataFim', dataFim.toISOString().split('T')[0]);

console.log('\n🌐 PARÂMETROS PARA API:');
for (const [key, value] of params.entries()) {
  console.log(`   ${key}: ${value}`);
}

console.log('\n✅ VANTAGENS DO VALOR EXATO:');
console.log('   • Precisão máxima: encontra apenas lançamentos com valor idêntico');
console.log('   • Reduz drasticamente falsos positivos');
console.log('   • Ideal para conciliação bancária automática');
console.log('   • Sistema de fallback garante flexibilidade quando necessário');

console.log('\n🎯 CASOS DE USO IDEAIS:');
console.log('   • Transferências bancárias (valores exatos)');
console.log('   • Pagamentos de boletos (valores precisos)');
console.log('   • Depósitos e saques (valores específicos)');
console.log('   • Débitos automáticos (valores padronizados)');
