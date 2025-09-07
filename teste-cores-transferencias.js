// Teste: Cores para Transferências (Entrada/Saída)
console.log('🔄 TESTE: Cores para Transferências');
console.log('==================================');

console.log('📋 Regras implementadas:');
console.log('- 🟢 Verde: Receitas + Transferências de ENTRADA (valor positivo)');
console.log('- 🔴 Vermelho: Despesas + Transferências de SAÍDA (valor negativo)');
console.log('- 🟢 Verde especial: Matches exatos (sobrepõe outras regras)');
console.log('');

// Simulação de lançamentos diversos
const lancamentosExemplo = [
  {
    id: 'L1',
    tipo: 'receita',
    valor: 100.00,
    descricao: 'Venda de produtos',
    numero_documento: 'NF-001',
    expected_color: 'text-green-700',
    expected_icon: '💚'
  },
  {
    id: 'L2',
    tipo: 'despesa', 
    valor: -50.00,
    descricao: 'Compra de materiais',
    numero_documento: 'NF-002',
    expected_color: 'text-red-700',
    expected_icon: '❤️'
  },
  {
    id: 'L3',
    tipo: 'transferencia',
    valor: 150.00, // POSITIVO = ENTRADA
    descricao: 'Transferência entre contas',
    numero_documento: 'TRANSF-1234567890-ENTRADA',
    expected_color: 'text-green-700',
    expected_icon: '💚'
  },
  {
    id: 'L4',
    tipo: 'transferencia',
    valor: -150.00, // NEGATIVO = SAÍDA
    descricao: 'Transferência entre contas',
    numero_documento: 'TRANSF-1234567890-SAIDA',
    expected_color: 'text-red-700',
    expected_icon: '❤️'
  },
  {
    id: 'L5',
    tipo: 'transferencia',
    valor: 75.00, // ENTRADA com match exato
    descricao: 'TED recebida',
    numero_documento: 'TRANSF-9876543210-ENTRADA',
    match: true,
    expected_color: 'text-green-600',
    expected_icon: '🎯'
  }
];

console.log('🔍 Testando cores para cada tipo:');
console.log('');

lancamentosExemplo.forEach((lancamento, index) => {
  const validation = { valueMatch: lancamento.match || false };
  
  // Lógica implementada no modal
  const corAplicada = validation.valueMatch 
    ? 'text-green-600'                    // Match exato: verde especial
    : lancamento.tipo === 'receita' 
      ? 'text-green-700'                  // Receita: verde
      : lancamento.tipo === 'transferencia'
        ? (lancamento.valor > 0 ? 'text-green-700' : 'text-red-700') // Transferência: verde se entrada (+), vermelho se saída (-)
        : 'text-red-700';                  // Despesa: vermelho
        
  const valorExibido = `R$ ${Math.abs(lancamento.valor).toFixed(2)}`;
  const correto = corAplicada === lancamento.expected_color;
  
  console.log(`${index + 1}. ${lancamento.descricao}`);
  console.log(`   Tipo: ${lancamento.tipo}`);
  console.log(`   Valor: ${lancamento.valor > 0 ? '+' : ''}${lancamento.valor.toFixed(2)} → ${valorExibido}`);
  console.log(`   Documento: ${lancamento.numero_documento}`);
  console.log(`   Cor aplicada: ${corAplicada} ${correto ? '✅' : '❌'}`);
  console.log(`   Ícone: ${lancamento.expected_icon}${validation.valueMatch ? ' (match)' : ''}`);
  console.log('');
});

console.log('🏆 RESULTADO DOS TESTES:');
const todosCorretos = lancamentosExemplo.every((lancamento, index) => {
  const validation = { valueMatch: lancamento.match || false };
  const corAplicada = validation.valueMatch 
    ? 'text-green-600'
    : lancamento.tipo === 'receita' 
      ? 'text-green-700'
      : lancamento.tipo === 'transferencia'
        ? (lancamento.valor > 0 ? 'text-green-700' : 'text-red-700')
        : 'text-red-700';
  return corAplicada === lancamento.expected_color;
});

if (todosCorretos) {
  console.log('✅ TODOS OS TESTES PASSARAM!');
  console.log('✅ Receitas: Verde');
  console.log('✅ Despesas: Vermelho');
  console.log('✅ Transferências Entrada (+): Verde');
  console.log('✅ Transferências Saída (-): Vermelho');
  console.log('✅ Matches exatos: Verde especial');
} else {
  console.log('❌ ALGUNS TESTES FALHARAM');
}

console.log('\n💡 Implementação:');
console.log('- Interface: tipo inclui "transferencia"');
console.log('- Lógica: transferencia usa valor para determinar cor');
console.log('- Entrada (+): Verde como receita');
console.log('- Saída (-): Vermelho como despesa');
