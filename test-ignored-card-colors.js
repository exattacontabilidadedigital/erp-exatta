// Script para testar as cores dos cards ignorados
// Execute no console do navegador para verificar se as cores estão corretas

console.log('🧪 Teste das Cores dos Cards Ignorados');

// IDs das transações ignoradas baseadas nos dados fornecidos
const ignoredTransactionIds = [
    '4c38254d-a7f2-4b3f-a649-3ffd1b428979', // fdasfa -58.00
    'feecbc12-fc56-4233-8756-fbe219113f2c'  // [TRANSFER NCIA SA DA] fdd -10.00
];

function testIgnoredCardColors() {
    console.log('🎨 Verificando cores dos cards ignorados...');
    
    // Buscar todos os cards na página
    const cards = document.querySelectorAll('[class*="border-2"]');
    console.log(`📊 Total de cards encontrados: ${cards.length}`);
    
    let ignoredCardsFound = 0;
    let correctColors = 0;
    
    cards.forEach((card, index) => {
        const classes = card.className;
        
        // Verificar se é um card ignorado (cor cinza escuro)
        const isIgnoredColor = classes.includes('bg-gray-200') && 
                              classes.includes('border-gray-400') && 
                              classes.includes('opacity-60');
        
        // Verificar se é um card com cor errada (cinza claro)
        const isWrongColor = classes.includes('bg-gray-50') && 
                             classes.includes('border-gray-300');
        
        if (isIgnoredColor) {
            ignoredCardsFound++;
            correctColors++;
            console.log(`✅ Card ${index + 1}: Cor CORRETA (ignorado - cinza escuro)`);
        } else if (isWrongColor) {
            console.log(`❌ Card ${index + 1}: Cor INCORRETA (deveria ser ignorado mas está como sem match)`);
            console.log(`   Classes: ${classes}`);
        }
    });
    
    console.log('\n📋 Resumo:');
    console.log(`- Cards ignorados esperados: 2`);
    console.log(`- Cards ignorados encontrados: ${ignoredCardsFound}`);
    console.log(`- Cards com cor correta: ${correctColors}`);
    
    if (ignoredCardsFound === 2 && correctColors === 2) {
        console.log('🎉 TESTE PASSOU: Todas as cores estão corretas!');
    } else {
        console.log('⚠️ TESTE FALHOU: Algumas cores estão incorretas');
        console.log('💡 Verifique os logs do console para detalhes sobre getCardBackgroundColor');
    }
}

// Função para verificar dados específicos de uma transação
function checkTransactionData(transactionId) {
    console.log(`🔍 Verificando dados da transação: ${transactionId}`);
    
    // Esta função deve ser chamada dentro do contexto do React
    // para acessar os dados dos pairs
    console.log('ℹ️ Para dados detalhados, verifique os logs do console do componente');
}

// Executar teste
testIgnoredCardColors();

console.log('\n📝 Instruções:');
console.log('1. Recarregue a página da conciliação');
console.log('2. Execute: testIgnoredCardColors()');
console.log('3. Verifique os logs do console para "🎨 Determinando cor do card"');
console.log('4. Ambos os cards ignorados devem ter: bg-gray-200 border-gray-400 opacity-60');

// Exportar funções para uso
window.testIgnoredCardColors = testIgnoredCardColors;
window.checkTransactionData = checkTransactionData;
