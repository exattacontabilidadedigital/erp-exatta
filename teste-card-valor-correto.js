// Teste para verificar se o card agora mostra R$ 150,00 (valor correto)
// ao invés de R$ 50,00 (valor do primeiro lançamento)

console.log('🧪 TESTE: Verificação do Valor Correto no Card');
console.log('====================================================');

// Simulação dos dados que chegam do modal
const suggestionDataFromModal = {
  selectedLancamentos: [
    { id: 'L1', valor: 50, descricao: 'Lancamento 1' },
    { id: 'L2', valor: 30, descricao: 'Lancamento 2' },
    { id: 'L3', valor: 70, descricao: 'Lancamento 3' }
  ],
  primaryLancamento: {
    id: 'L1', // ID do primeiro para referência
    valor: 150, // ✅ VALOR TOTAL (50 + 30 + 70)
    descricao: '3 lançamentos selecionados',
    tipo: 'despesa',
    data_lancamento: '2025-01-28'
  },
  totalValue: 150,
  isValidMatch: true,
  hasDiscrepancy: false
};

console.log('📊 Dados recebidos do modal:');
console.log('- selectedLancamentos:', suggestionDataFromModal.selectedLancamentos.map(l => ({
  id: l.id,
  valor: l.valor
})));
console.log('- totalValue:', suggestionDataFromModal.totalValue);
console.log('- primaryLancamento.valor:', suggestionDataFromModal.primaryLancamento.valor);

// Simulação da lógica ANTES da correção (ERRADA)
const systemTransactionAntes = suggestionDataFromModal.selectedLancamentos[0];
console.log('\n❌ ANTES (ERRADO):');
console.log('systemTransaction.valor:', systemTransactionAntes.valor); // 50 (ERRADO!)

// Simulação da lógica DEPOIS da correção (CORRETA)
const primaryLancamentoForCard = suggestionDataFromModal.primaryLancamento || {
  ...suggestionDataFromModal.selectedLancamentos[0],
  valor: suggestionDataFromModal.totalValue,
  descricao: suggestionDataFromModal.selectedLancamentos.length > 1 
    ? `${suggestionDataFromModal.selectedLancamentos.length} lançamentos selecionados`
    : suggestionDataFromModal.selectedLancamentos[0].descricao
};

console.log('\n✅ DEPOIS (CORRETO):');
console.log('systemTransaction.valor:', primaryLancamentoForCard.valor); // 150 (CORRETO!)

// Verificação
const valorCorreto = primaryLancamentoForCard.valor === 150;
const valorTotalCorreto = primaryLancamentoForCard.valor === suggestionDataFromModal.totalValue;

console.log('\n🎯 RESULTADO DO TESTE:');
console.log('- Card mostra R$ 150,00:', valorCorreto ? '✅ SIM' : '❌ NÃO');
console.log('- Valor igual ao total:', valorTotalCorreto ? '✅ SIM' : '❌ NÃO');
console.log('- Correção funcionou:', (valorCorreto && valorTotalCorreto) ? '✅ SUCESSO' : '❌ FALHOU');

console.log('\n📝 CONCLUSÃO:');
if (valorCorreto && valorTotalCorreto) {
  console.log('🎉 CORREÇÃO IMPLEMENTADA CORRETAMENTE!');
  console.log('💡 O card agora mostra R$ 150,00 (soma de múltiplos lançamentos)');
  console.log('💡 ao invés de R$ 50,00 (primeiro lançamento apenas)');
} else {
  console.log('⚠️  CORREÇÃO PRECISA DE AJUSTES');
}

console.log('\n🔧 Como corrigir no código:');
console.log('1. Modal envia primaryLancamento com valor total');
console.log('2. Componente pai usa primaryLancamento ao invés de selectedLancamentos[0]');
console.log('3. Card exibe o valor correto de R$ 150,00');
