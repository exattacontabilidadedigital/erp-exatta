/**
 * Teste Realista: Filtro com Valor Exato + Intervalo de Data
 * Usando dados reais da transação OFX:
 * - Valor: R$ 25,00 (exato)
 * - Data: 17/08/2025 (data real do lançamento OFX)
 */

// Dados REAIS da transação OFX
const transacaoOFX = {
  amount: "25.00",
  posted_at: "2025-08-17" // Data real do lançamento OFX
};

console.log('🧪 TESTE REALISTA: Filtro com Dados do Lançamento OFX');
console.log('=' .repeat(65));
console.log(`📋 TRANSAÇÃO OFX: R$ ${transacaoOFX.amount} em ${transacaoOFX.posted_at}`);

// Teste 1: Valor EXATO (pegando do lançamento OFX)
const valorTransacao = Math.abs(parseFloat(transacaoOFX.amount));

console.log('\n💰 VALOR EXATO (do lançamento OFX):');
console.log(`   Valor da transação OFX: R$ ${valorTransacao.toFixed(2)}`);
console.log(`   Valor mínimo aceito: R$ ${valorTransacao.toFixed(2)}`);
console.log(`   Valor máximo aceito: R$ ${valorTransacao.toFixed(2)}`);
console.log(`   Tolerância: 0% (valor exato do OFX)`);
console.log(`   ✅ Aceita APENAS: R$ ${valorTransacao.toFixed(2)}`);

// Teste 2: Intervalo de data (±3 dias a partir da data do OFX)
const dataTransacao = new Date(transacaoOFX.posted_at);
const dataInicio = new Date(dataTransacao);
const dataFim = new Date(dataTransacao);

const toleranciaDias = 3;
dataInicio.setDate(dataTransacao.getDate() - toleranciaDias);
dataFim.setDate(dataTransacao.getDate() + toleranciaDias);

console.log('\n📅 INTERVALO DE DATA (±3 dias da data do OFX):');
console.log(`   Data da transação OFX: ${dataTransacao.toISOString().split('T')[0]}`);
console.log(`   Data início da busca: ${dataInicio.toISOString().split('T')[0]}`);
console.log(`   Data fim da busca: ${dataFim.toISOString().split('T')[0]}`);
console.log(`   Período de busca: ${toleranciaDias * 2 + 1} dias`);

// Teste 3: Lançamentos que seriam encontrados (cenário realista)
const lancamentosRealistasTeste = [
  { valor: 24.99, data: '2025-08-17', descricao: 'Pagamento próximo', match: false }, // Valor quase igual
  { valor: 25.00, data: '2025-08-13', descricao: 'Fora do intervalo (-4 dias)', match: false }, // Data muito anterior
  { valor: 25.00, data: '2025-08-14', descricao: 'No limite inferior (-3 dias)', match: true },  // ✅ Limite inferior
  { valor: 25.00, data: '2025-08-15', descricao: 'Dentro do intervalo (-2 dias)', match: true }, // ✅ Dentro
  { valor: 25.00, data: '2025-08-16', descricao: 'Véspera da transação', match: true },         // ✅ Véspera
  { valor: 25.00, data: '2025-08-17', descricao: 'MATCH PERFEITO - Mesma data!', match: true }, // ✅ PERFEITO
  { valor: 25.00, data: '2025-08-18', descricao: 'Dia seguinte', match: true },                 // ✅ Seguinte
  { valor: 25.00, data: '2025-08-19', descricao: 'Dentro do intervalo (+2 dias)', match: true }, // ✅ Dentro
  { valor: 25.00, data: '2025-08-20', descricao: 'No limite superior (+3 dias)', match: true },  // ✅ Limite superior
  { valor: 25.00, data: '2025-08-21', descricao: 'Fora do intervalo (+4 dias)', match: false }, // Data muito posterior
  { valor: 25.01, data: '2025-08-17', descricao: 'Valor ligeiramente diferente', match: false }, // Valor diferente
];

const matchesEncontrados = lancamentosRealistasTeste.filter(l => {
  const valorMatch = parseFloat(l.valor.toString()) === valorTransacao;
  const dataLanc = new Date(l.data);
  const dataMatch = dataLanc >= dataInicio && dataLanc <= dataFim;
  l.match = valorMatch && dataMatch;
  return l.match;
});

console.log('\n🎯 SIMULAÇÃO REALISTA DE MATCHES:');
console.log('   Lançamentos disponíveis no sistema:');
lancamentosRealistasTeste.forEach((l, i) => {
  const status = l.match ? '✅' : '❌';
  const motivo = l.match ? 'MATCH ENCONTRADO' : 
    (parseFloat(l.valor.toString()) !== valorTransacao ? 'valor diferente' : 'data fora do intervalo');
  console.log(`   ${i + 1}. ${status} R$ ${l.valor.toFixed(2)} em ${l.data} - ${l.descricao}`);
  console.log(`       ${motivo}`);
});

console.log(`\n   📊 RESULTADO: ${matchesEncontrados.length} matches de ${lancamentosRealistasTeste.length} lançamentos`);

// Teste 4: Parâmetros que serão enviados para a API
const params = new URLSearchParams();
params.append('valorMin', valorTransacao.toFixed(2));
params.append('valorMax', valorTransacao.toFixed(2));
params.append('buscarValorAbsoluto', 'true');
params.append('status', 'pendente');
params.append('dataInicio', dataInicio.toISOString().split('T')[0]);
params.append('dataFim', dataFim.toISOString().split('T')[0]);

console.log('\n🌐 PARÂMETROS REAIS PARA API:');
for (const [key, value] of params.entries()) {
  console.log(`   ${key}: ${value}`);
}

// Teste 5: Sistema de Fallback com dados reais
console.log('\n🔄 SISTEMA DE FALLBACK (caso não encontre matches):');

// Fallback 1: ±5% valor + ±3 dias
const fallback1Tolerancia = 0.05;
const fallback1Min = valorTransacao * (1 - fallback1Tolerancia);
const fallback1Max = valorTransacao * (1 + fallback1Tolerancia);

console.log(`   FALLBACK 1: ±5% valor + ±3 dias`);
console.log(`   - Valor: R$ ${fallback1Min.toFixed(2)} - R$ ${fallback1Max.toFixed(2)}`);
console.log(`   - Data: ${dataInicio.toISOString().split('T')[0]} - ${dataFim.toISOString().split('T')[0]}`);

// Fallback 2: ±10% valor + ±7 dias
const fallback2Tolerancia = 0.10;
const fallback2Min = valorTransacao * (1 - fallback2Tolerancia);
const fallback2Max = valorTransacao * (1 + fallback2Tolerancia);

const dataInicio2 = new Date(dataTransacao);
const dataFim2 = new Date(dataTransacao);
dataInicio2.setDate(dataTransacao.getDate() - 7);
dataFim2.setDate(dataTransacao.getDate() + 7);

console.log(`   FALLBACK 2: ±10% valor + ±7 dias`);
console.log(`   - Valor: R$ ${fallback2Min.toFixed(2)} - R$ ${fallback2Max.toFixed(2)}`);
console.log(`   - Data: ${dataInicio2.toISOString().split('T')[0]} - ${dataFim2.toISOString().split('T')[0]}`);

console.log('\n✅ RESUMO DO FUNCIONAMENTO:');
console.log(`   1. Pega valor EXATO do OFX: R$ ${valorTransacao.toFixed(2)}`);
console.log(`   2. Pega data do OFX: ${dataTransacao.toISOString().split('T')[0]}`);
console.log(`   3. Busca lançamentos com valor exato ±3 dias da data`);
console.log(`   4. Se não encontrar, aplica fallbacks com tolerâncias progressivas`);
console.log(`   5. Garante sempre encontrar resultados relevantes`);

console.log('\n🎯 CENÁRIO TÍPICO DE USO:');
console.log('   • Usuário seleciona transação bancária de R$ 25,00 em 17/08/2025');
console.log('   • Sistema busca lançamentos com valor exato de R$ 25,00');
console.log('   • Período de busca: 14/08/2025 a 20/08/2025 (7 dias)');
console.log('   • Mostra apenas lançamentos que realmente correspondem à transação');
console.log('   • Máxima precisão para conciliação bancária automática');
