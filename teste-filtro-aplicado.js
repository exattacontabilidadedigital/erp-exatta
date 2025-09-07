// Teste do filtro inteligente com dados reais do banco

// Simular dados da transação bancária (como viria do OFX)
const transactionData = {
  amount: 25,  // R$ 25,00 - valor exato dos lançamentos que existem
  posted_at: '2025-08-18',  // Data dos lançamentos
  payee: 'tytyty',  // Descrição similar
  memo: 'Teste OFX'
};

// Simular lançamentos reais do banco (baseado nos dados fornecidos)
const lancamentosReais = [
  {
    idx: 10,
    id: "58fdde57-ebba-4019-bdbf-c3eb39c9ef37",
    tipo: "receita",
    numero_documento: "TRANSF-1755723634644-ENTRADA",
    data_lancamento: "2025-08-18",
    descricao: "tytyty",
    valor: "25.00",
    status: "pago",
    conta_bancaria_id: "9e04c843-2057-4e4f-babc-8ef4fba58974"
  },
  {
    idx: 25,
    id: "b5e99ef2-a529-4751-9399-65829162e7e9",
    tipo: "receita",
    numero_documento: "542352",
    data_lancamento: "2025-08-18",
    descricao: "tytyty",
    valor: "25.00",
    status: "pago",
    conta_bancaria_id: "4fd86770-32c4-4927-9d7e-8f3ded7b38fa"
  },
  {
    idx: 35,
    id: "fa839aea-a24a-4f93-a7a5-b073dd7f6b6f",
    tipo: "despesa",
    numero_documento: "TRANSF-1755723634644-SAIDA",
    data_lancamento: "2025-08-18",
    descricao: "tytyty",
    valor: "25.00",
    status: "pago",
    conta_bancaria_id: "4fd86770-32c4-4927-9d7e-8f3ded7b38fa"
  }
];

console.log('🧪 TESTE DO FILTRO INTELIGENTE - APLICAÇÃO REAL');
console.log('=====================================================');
console.log('');

console.log('📊 DADOS DA TRANSAÇÃO BANCÁRIA (OFX):');
console.log(`   💰 Valor: R$ ${transactionData.amount}`);
console.log(`   📅 Data: ${transactionData.posted_at}`);
console.log(`   📝 Descrição: ${transactionData.payee}`);
console.log('');

// Simular a lógica do filtro inteligente
console.log('🎯 APLICANDO FILTRO INTELIGENTE:');
console.log('');

// 1. Filtro de valor exato
const valorTransacao = Math.abs(parseFloat(transactionData.amount));
console.log(`💰 Filtro de Valor:`);
console.log(`   - valorMin: ${valorTransacao.toFixed(2)}`);
console.log(`   - valorMax: ${valorTransacao.toFixed(2)}`);
console.log(`   - buscarValorAbsoluto: true`);
console.log('');

// 2. Filtro de data (±3 dias)
const dataTransacao = new Date(transactionData.posted_at);
const dataInicio = new Date(dataTransacao);
const dataFim = new Date(dataTransacao);
dataInicio.setDate(dataInicio.getDate() - 3);
dataFim.setDate(dataFim.getDate() + 3);

console.log(`📅 Filtro de Data (±3 dias):`);
console.log(`   - dataInicio: ${dataInicio.toISOString().split('T')[0]}`);
console.log(`   - dataFim: ${dataFim.toISOString().split('T')[0]}`);
console.log('');

// 3. Filtro de contas bancárias (todas)
const contasBancarias = [
  '4fd86770-32c4-4927-9d7e-8f3ded7b38fa',
  '9e04c843-2057-4e4f-babc-8ef4fba58974', 
  '177705b9-192c-4603-b223-039b733ee955',
  '8ad0f3fb-88cc-4f39-8d50-f47efb3a5486'
];

console.log(`🏦 Filtro de Contas Bancárias:`);
console.log(`   - Total de contas incluídas: ${contasBancarias.length}`);
console.log(`   - Contas: ${contasBancarias.map(c => c.substring(0, 8)).join(', ')}`);
console.log('');

// 4. Aplicar filtros aos dados reais
console.log('🔍 APLICANDO FILTROS AOS DADOS REAIS:');
console.log('');

const resultadosFiltrados = lancamentosReais.filter(lancamento => {
  // Filtro de valor absoluto
  const valorLancamento = Math.abs(parseFloat(lancamento.valor));
  const valorMatch = valorLancamento === valorTransacao;
  
  // Filtro de data
  const dataLancamento = new Date(lancamento.data_lancamento);
  const dataMatch = dataLancamento >= dataInicio && dataLancamento <= dataFim;
  
  // Filtro de conta bancária (se estiver nas contas incluídas)
  const contaMatch = contasBancarias.includes(lancamento.conta_bancaria_id);
  
  console.log(`   📋 Lançamento ${lancamento.id.substring(0, 8)}:`);
  console.log(`      - Valor: R$ ${lancamento.valor} → ${valorMatch ? '✅' : '❌'} (${valorLancamento} === ${valorTransacao})`);
  console.log(`      - Data: ${lancamento.data_lancamento} → ${dataMatch ? '✅' : '❌'} (${dataInicio.toISOString().split('T')[0]} <= ${dataLancamento.toISOString().split('T')[0]} <= ${dataFim.toISOString().split('T')[0]})`);
  console.log(`      - Conta: ${lancamento.conta_bancaria_id.substring(0, 8)} → ${contaMatch ? '✅' : '❌'}`);
  console.log(`      - Status: ${lancamento.status} → ✅ (sem filtro)`);
  console.log(`      - RESULTADO: ${valorMatch && dataMatch && contaMatch ? '✅ INCLUÍDO' : '❌ EXCLUÍDO'}`);
  console.log('');
  
  return valorMatch && dataMatch && contaMatch;
});

console.log('📊 RESULTADO FINAL:');
console.log(`   🎯 Lançamentos encontrados: ${resultadosFiltrados.length}`);
console.log('');

if (resultadosFiltrados.length > 0) {
  console.log('✅ LANÇAMENTOS CORRESPONDENTES:');
  resultadosFiltrados.forEach((lancamento, index) => {
    console.log(`   ${index + 1}. ${lancamento.id.substring(0, 8)} - R$ ${lancamento.valor} - ${lancamento.data_lancamento} - ${lancamento.status}`);
    console.log(`      📝 ${lancamento.descricao}`);
    console.log(`      🏦 Conta: ${lancamento.conta_bancaria_id.substring(0, 8)}`);
  });
} else {
  console.log('❌ NENHUM LANÇAMENTO ENCONTRADO - VERIFICAR FILTROS');
}

console.log('');
console.log('🔧 SIMULAÇÃO DA URL DA API:');
const params = new URLSearchParams();
params.append('page', '1');
params.append('limit', '20');
contasBancarias.forEach(conta => {
  params.append('contaBancariaId[]', conta);
});
params.append('valorMin', valorTransacao.toFixed(2));
params.append('valorMax', valorTransacao.toFixed(2));
params.append('buscarValorAbsoluto', 'true');
params.append('dataInicio', dataInicio.toISOString().split('T')[0]);
params.append('dataFim', dataFim.toISOString().split('T')[0]);

console.log(`GET /api/conciliacao/buscar-existentes?${params.toString()}`);
console.log('');

console.log('✅ FILTRO INTELIGENTE APLICADO COM SUCESSO!');
console.log(`   - Esperado: 3 lançamentos de R$ 25,00`);
console.log(`   - Encontrado: ${resultadosFiltrados.length} lançamentos`);
console.log(`   - Status: ${resultadosFiltrados.length === 3 ? '✅ SUCESSO' : '⚠️ REVISAR'}`);
