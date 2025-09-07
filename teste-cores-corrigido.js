// 🎨 TESTE DE VERIFICAÇÃO DE CORES TRANSFERÊNCIAS - APÓS CORREÇÃO
// Execute este script no console do navegador após abrir o modal

console.log('🎨 ===== VERIFICANDO CORES DAS TRANSFERÊNCIAS - VERSÃO CORRIGIDA =====');

// Encontrar a tabela do modal
const modalTable = document.querySelector('[role="dialog"] table tbody');
if (!modalTable) {
  console.log('❌ Modal ou tabela não encontrados');
} else {
  console.log('✅ Tabela encontrada');
  
  // Verificar cada linha de lançamento
  const rows = modalTable.querySelectorAll('tr');
  console.log(`📊 Total de linhas: ${rows.length}`);
  
  rows.forEach((row, index) => {
    console.log(`\n🔍 === LINHA ${index + 1} ===`);
    
    // Encontrar a célula do valor (última célula)
    const cells = row.querySelectorAll('td');
    const valorCell = cells[cells.length - 1]; // Última célula (valor)
    
    if (valorCell) {
      const valorSpan = valorCell.querySelector('span');
      if (valorSpan) {
        const classes = valorSpan.className;
        const valor = valorSpan.textContent;
        const computedColor = getComputedStyle(valorSpan).color;
        
        console.log('💰 Valor:', valor);
        console.log('🎨 Classes CSS:', classes);
        console.log('🎨 Cor computada:', computedColor);
        
        // Identificar tipo de cor
        if (classes.includes('text-red-700')) {
          console.log('🔴 COR: VERMELHO (Despesa/Transferência Saída)');
        } else if (classes.includes('text-green-700')) {
          console.log('🟢 COR: VERDE ESCURO (Receita/Transferência Entrada)');
        } else if (classes.includes('text-green-600')) {
          console.log('🟢 COR: VERDE CLARO (Match Exato)');
        } else {
          console.log('⚪ COR: OUTRA -', classes);
        }
        
        // Detectar transferência pela estrutura da linha
        const allText = row.textContent;
        if (allText.includes('TRANSF-')) {
          if (allText.includes('ENTRADA')) {
            console.log('📥 TIPO: Transferência ENTRADA → Deveria ser VERDE');
          } else if (allText.includes('SAIDA')) {
            console.log('📤 TIPO: Transferência SAÍDA → Deveria ser VERMELHO');
          } else {
            console.log('🔄 TIPO: Transferência (tipo indefinido)');
          }
        } else {
          console.log('💼 TIPO: Lançamento normal');
        }
        
      } else {
        console.log('❌ Span do valor não encontrado');
      }
    } else {
      console.log('❌ Célula do valor não encontrada');
    }
  });
}

console.log('\n🎯 ===== VERIFICAÇÃO COMPLETA =====');
console.log('✅ Execute este script após a correção para verificar se:');
console.log('   1. Transferências ENTRADA estão em VERDE');
console.log('   2. Transferências SAÍDA estão em VERMELHO');
console.log('   3. Lançamentos normais mantêm suas cores');
