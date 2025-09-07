/**
 * DIAGNÓSTICO: Por que o filtro inteligente não está sendo aplicado?
 * Baseado no debug fornecido pelo usuário
 */

console.log('🔍 DIAGNÓSTICO: Análise do Debug do Sistema');
console.log('=' .repeat(55));

// Dados do debug fornecido
const debugInfo = {
  totalLancamentos: 36,
  totalPendentes: 9,
  filtrosAplicados: {
    status: 'pendente',
    dataInicio: '2025-08-11',
    dataFim: '2025-08-25',
    valorMin: '22.50',
    valorMax: '27.50'
  },
  lancamentosEncontrados: [
    { id: '758d207e', valor: 58, valorAbs: 58 },
    { id: 'ea5d6beb', valor: 50, valorAbs: 50 },
    { id: '8a09cc88', valor: 50, valorAbs: 50 }
  ],
  resultadoFinal: 0
};

console.log('📊 DADOS DO DEBUG:');
console.log(`   Total de lançamentos no sistema: ${debugInfo.totalLancamentos}`);
console.log(`   Total com status pendente: ${debugInfo.totalPendentes}`);
console.log(`   Lançamentos na faixa de data: 3`);
console.log(`   Resultado final: ${debugInfo.resultadoFinal}`);

console.log('\n🔍 ANÁLISE DOS FILTROS APLICADOS:');
console.log(`   Status: ${debugInfo.filtrosAplicados.status}`);
console.log(`   Data início: ${debugInfo.filtrosAplicados.dataInicio}`);
console.log(`   Data fim: ${debugInfo.filtrosAplicados.dataFim}`);
console.log(`   Valor mínimo: ${debugInfo.filtrosAplicados.valorMin}`);
console.log(`   Valor máximo: ${debugInfo.filtrosAplicados.valorMax}`);

// Calcular qual seria o valor original da transação
const valorMin = parseFloat(debugInfo.filtrosAplicados.valorMin);
const valorMax = parseFloat(debugInfo.filtrosAplicados.valorMax);
const valorMedio = (valorMin + valorMax) / 2;
const tolerancia = ((valorMax - valorMin) / 2) / valorMedio;

console.log('\n🧮 CÁLCULOS REVERSOS:');
console.log(`   Valor médio (provável valor original): R$ ${valorMedio.toFixed(2)}`);
console.log(`   Tolerância aplicada: ${(tolerancia * 100).toFixed(1)}%`);

// Verificar que tipo de filtro foi aplicado
let tipoFiltro = 'Desconhecido';
if (Math.abs(tolerancia - 0.10) < 0.01) {
  tipoFiltro = 'Fallback 2 (±10%)';
} else if (Math.abs(tolerancia - 0.05) < 0.01) {
  tipoFiltro = 'Fallback 1 (±5%)';
} else if (valorMin === valorMax) {
  tipoFiltro = 'Filtro Principal (valor exato)';
}

console.log(`   Tipo de filtro detectado: ${tipoFiltro}`);

// Analisar o intervalo de data
const dataInicio = new Date(debugInfo.filtrosAplicados.dataInicio);
const dataFim = new Date(debugInfo.filtrosAplicados.dataFim);
const diasTotais = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
const diasTolerancia = (diasTotais - 1) / 2;

console.log('\n📅 ANÁLISE DO INTERVALO DE DATA:');
console.log(`   Dias totais: ${diasTotais}`);
console.log(`   Tolerância em dias: ±${diasTolerancia}`);

let tipoToleranciaData = 'Desconhecida';
if (diasTolerancia === 3) {
  tipoToleranciaData = 'Filtro Principal (±3 dias)';
} else if (diasTolerancia === 7) {
  tipoToleranciaData = 'Fallback 1 (±7 dias)';
} else if (diasTolerancia === 14) {
  tipoToleranciaData = 'Fallback 2 (±14 dias)';
}

console.log(`   Tipo de tolerância de data: ${tipoToleranciaData}`);

console.log('\n❌ PROBLEMAS IDENTIFICADOS:');

if (tipoFiltro.includes('Fallback')) {
  console.log('   1. FILTRO PRINCIPAL NÃO FOI APLICADO');
  console.log('      - Sistema executou fallback em vez do filtro principal');
  console.log('      - Indica que condições do filtro inteligente não foram atendidas');
}

console.log('\n🔍 VALORES ENCONTRADOS vs FILTRO:');
debugInfo.lancamentosEncontrados.forEach((lanc, index) => {
  const dentroFaixa = lanc.valorAbs >= valorMin && lanc.valorAbs <= valorMax;
  console.log(`   ${index + 1}. R$ ${lanc.valor.toFixed(2)} - ${dentroFaixa ? '✅ Dentro da faixa' : '❌ Fora da faixa'}`);
});

console.log('\n💡 POSSÍVEIS CAUSAS:');
console.log('   1. Filtros manuais estão sendo aplicados inadvertidamente');
console.log('   2. Dados da transação não estão sendo passados corretamente');
console.log('   3. Estado dos filtros contém valores residuais');
console.log('   4. Condição de página não está sendo atendida');

console.log('\n🔧 CORREÇÕES SUGERIDAS:');
console.log('   1. Adicionar logs detalhados para identificar o motivo');
console.log('   2. Verificar se transactionData está sendo passado');
console.log('   3. Limpar estado dos filtros ao abrir o modal');
console.log('   4. Verificar condições do filtro inteligente');

console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('   1. Executar código com logs adicionais');
console.log('   2. Verificar console do navegador');
console.log('   3. Confirmar dados da transação');
console.log('   4. Validar estado dos filtros');

console.log('\n🎯 EXPECTATIVA:');
console.log('   Para uma transação de R$ 25,00:');
console.log('   - Filtro principal: valorMin=25.00, valorMax=25.00');
console.log('   - Data: ±3 dias da transação');
console.log('   - Sem fallbacks se houver lançamentos de R$ 25,00');
