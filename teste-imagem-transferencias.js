// Teste baseado na imagem anexa - Filtro Inteligente com Transferências
console.log('🔍 TESTE: Cenário da Imagem Anexa');
console.log('=================================');

console.log('📋 Dados da imagem:');
console.log('- 3 lançamentos encontrados');
console.log('- Todos com valor R$ 25,00');
console.log('- Documentos: 542352, TRANSF-*-ENTRADA, TRANSF-*-SAIDA');
console.log('');

// Simulação dos lançamentos exatos da imagem
const lancamentosDaImagem = [
  {
    id: 'L1',
    tipo: 'despesa', // Pode ser que o tipo não seja 'transferencia' no banco
    valor: 25.00,
    descricao: 'tytyty',
    numero_documento: '542352',
    plano_contas: 'Caixa e Equivalentes de Caixa'
  },
  {
    id: 'L2',
    tipo: 'receita', // Pode ser que o tipo não seja 'transferencia' no banco
    valor: 25.00,
    descricao: 'tytyty',
    numero_documento: 'TRANSF-175572363464-ENTRADA',
    plano_contas: 'TRANSFERÊNCIA'
  },
  {
    id: 'L3',
    tipo: 'despesa', // Pode ser que o tipo não seja 'transferencia' no banco
    valor: 25.00,
    descricao: 'tytyty',
    numero_documento: 'TRANSF-175572363464-SAIDA',
    plano_contas: 'TRANSFERÊNCIA'
  }
];

console.log('🎨 Testando lógica CORRIGIDA para identificar transferências:');
console.log('');

lancamentosDaImagem.forEach((lancamento, index) => {
  const validation = { valueMatch: false }; // Sem match exato
  
  // Lógica CORRIGIDA implementada no modal
  const isTransferencia = lancamento.tipo === 'transferencia' || 
                         lancamento.numero_documento?.includes('TRANSF-') ||
                         lancamento.descricao?.includes('TRANSFERÊNCIA');
  
  let corClasse = '';
  let explicacao = '';
  
  if (validation.valueMatch) {
    corClasse = 'text-green-600';
    explicacao = 'Match exato (verde especial)';
  } else if (isTransferencia) {
    // ✅ TRANSFERÊNCIA: verificar se é entrada ou saída pelo DOCUMENTO
    const isEntrada = lancamento.numero_documento?.includes('-ENTRADA');
    const isSaida = lancamento.numero_documento?.includes('-SAIDA');
    
    if (isEntrada) {
      corClasse = 'text-green-700';
      explicacao = 'Transferência ENTRADA (verde)';
    } else if (isSaida) {
      corClasse = 'text-red-700';
      explicacao = 'Transferência SAÍDA (vermelho)';
    } else {
      corClasse = lancamento.valor > 0 ? 'text-green-700' : 'text-red-700';
      explicacao = `Transferência por valor ${lancamento.valor > 0 ? 'positivo (verde)' : 'negativo (vermelho)'}`;
    }
  } else if (lancamento.tipo === 'receita') {
    corClasse = 'text-green-700';
    explicacao = 'Receita (verde)';
  } else {
    corClasse = 'text-red-700';
    explicacao = 'Despesa (vermelho)';
  }
  
  console.log(`${index + 1}. Documento: ${lancamento.numero_documento}`);
  console.log(`   Tipo BD: ${lancamento.tipo}`);
  console.log(`   É transferência: ${isTransferencia ? 'SIM' : 'NÃO'}`);
  console.log(`   Cor aplicada: ${corClasse}`);
  console.log(`   Explicação: ${explicacao}`);
  console.log('');
});

console.log('🎯 RESULTADO ESPERADO após correção:');
console.log('1. 542352: ❤️ VERMELHO (despesa normal)');
console.log('2. TRANSF-*-ENTRADA: 💚 VERDE (transferência entrada)');
console.log('3. TRANSF-*-SAIDA: ❤️ VERMELHO (transferência saída)');

console.log('\n🔧 CORREÇÃO APLICADA:');
console.log('- Detecta transferência por documento TRANSF-*');
console.log('- ENTRADA: verde (como receber dinheiro)');
console.log('- SAIDA: vermelho (como enviar dinheiro)');
console.log('- Não depende apenas do campo tipo do banco');

console.log('\n📝 PROBLEMA ANTERIOR:');
console.log('- Só considerava lancamento.tipo === "transferencia"');
console.log('- Banco pode ter tipos diferentes para transferências');
console.log('- Agora usa numero_documento para identificar');
