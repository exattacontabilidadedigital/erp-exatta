// Script para executar no console do navegador
console.log('🔍 Verificando múltiplas transações...');

// Aguardar um pouco para garantir que os dados carregaram
setTimeout(() => {
    // Tentar encontrar elementos que mostram valores múltiplos
    const valorElements = document.querySelectorAll('[class*="font-medium"], [class*="text-sm"]');
    
    console.log('Total de elementos de valor encontrados:', valorElements.length);
    
    // Procurar por elementos que contenham valores monetários
    const monetaryElements = Array.from(valorElements).filter(el => 
        el.textContent && el.textContent.includes('R$')
    );
    
    console.log('Elementos monetários encontrados:', monetaryElements.length);
    
    monetaryElements.forEach((el, index) => {
        console.log(`Valor ${index + 1}:`, el.textContent);
    });
    
    // Verificar se há logs de múltiplos lançamentos no console
    console.log('🔍 Procure por logs "💰 MÚLTIPLOS LANÇAMENTOS" acima...');
    
}, 3000);

console.log('✅ Script executado. Aguardando 3 segundos para verificar...');
