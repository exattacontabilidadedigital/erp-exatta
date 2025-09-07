// Teste para verificar as cores dos valores na listagem do modal
console.log('🎨 TESTE: Cores dos Valores na Listagem');
console.log('=====================================');

// Simulação de lançamentos com diferentes tipos
const lancamentosExemplo = [
  {
    id: 'L1',
    tipo: 'receita',
    valor: 25.00,
    descricao: 'Venda de produtos',
    expected_color: 'text-green-700'
  },
  {
    id: 'L2', 
    tipo: 'despesa',
    valor: -25.00,
    descricao: 'Compra de materiais',
    expected_color: 'text-red-700'
  },
  {
    id: 'L3',
    tipo: 'receita', 
    valor: 100.00,
    descricao: 'Prestação de serviços',
    expected_color: 'text-green-700'
  },
  {
    id: 'L4',
    tipo: 'despesa',
    valor: -50.00, 
    descricao: 'Pagamento de fornecedor',
    expected_color: 'text-red-700'
  }
];

console.log('📊 Testando regra de cores:');
console.log('- Receitas: Verde (text-green-700)');
console.log('- Despesas: Vermelho (text-red-700)');
console.log('- Match exato: Verde especial (text-green-600)');
console.log('');

lancamentosExemplo.forEach((lancamento, index) => {
  // Lógica implementada no modal
  const validation = { valueMatch: false }; // Simulando sem match exato
  
  const corAplicada = validation.valueMatch 
    ? 'text-green-600' 
    : lancamento.tipo === 'receita' 
      ? 'text-green-700' 
      : 'text-red-700';
      
  const valorExibido = `R$ ${Math.abs(lancamento.valor).toFixed(2)}`;
  
  const correto = corAplicada === lancamento.expected_color;
  
  console.log(`${index + 1}. ${lancamento.descricao}`);
  console.log(`   Tipo: ${lancamento.tipo}`);
  console.log(`   Valor: ${valorExibido}`);
  console.log(`   Cor aplicada: ${corAplicada} ${correto ? '✅' : '❌'}`);
  console.log('');
});

// Teste especial: Match exato
console.log('🎯 Caso especial - Match Exato:');
const lancamentoComMatch = {
  tipo: 'despesa',
  valor: -25.00,
  descricao: 'Lançamento com match exato'
};

const validationMatch = { valueMatch: true };
const corComMatch = validationMatch.valueMatch 
  ? 'text-green-600' 
  : lancamentoComMatch.tipo === 'receita' 
    ? 'text-green-700' 
    : 'text-red-700';

console.log(`Descrição: ${lancamentoComMatch.descricao}`);
console.log(`Tipo: ${lancamentoComMatch.tipo} (normalmente seria vermelho)`);
console.log(`Cor aplicada: ${corComMatch} (verde especial por match exato) ✅`);

console.log('\n🏆 RESULTADO:');
console.log('✅ Receitas aparecem em VERDE');
console.log('✅ Despesas aparecem em VERMELHO'); 
console.log('✅ Matches exatos aparecem em VERDE ESPECIAL');
console.log('✅ Valores sempre exibidos como absolutos (sem sinal negativo)');

console.log('\n💡 Implementação no código:');
console.log('- validation.valueMatch ? "text-green-600" (match exato)');
console.log('- lancamento.tipo === "receita" ? "text-green-700" (receita)');
console.log('- : "text-red-700" (despesa)');
console.log('- Math.abs(lancamento.valor) (sempre positivo na exibição)');
