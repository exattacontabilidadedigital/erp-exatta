// Script para testar se as cores estão sendo aplicadas corretamente
// Cole este código no console do navegador (F12)

console.log('🔍 TESTE DE CORES - Iniciando verificação...');

// 1. Verificar se existem elementos com as classes de cor
const elementosVerde = document.querySelectorAll('.text-green-700, .text-green-600');
const elementosVermelho = document.querySelectorAll('.text-red-700');

console.log('✅ Elementos com cor VERDE encontrados:', elementosVerde.length);
console.log('✅ Elementos com cor VERMELHA encontrados:', elementosVermelho.length);

// 2. Verificar cada elemento verde
elementosVerde.forEach((el, index) => {
  console.log(`🟢 Elemento verde ${index + 1}:`, {
    texto: el.textContent.trim(),
    classes: el.className,
    computedColor: window.getComputedStyle(el).color
  });
});

// 3. Verificar cada elemento vermelho
elementosVermelho.forEach((el, index) => {
  console.log(`🔴 Elemento vermelho ${index + 1}:`, {
    texto: el.textContent.trim(), 
    classes: el.className,
    computedColor: window.getComputedStyle(el).color
  });
});

// 4. Verificar especificamente na tabela do modal
const modal = document.querySelector('[data-state="open"]');
if (modal) {
  console.log('🔍 Modal encontrado - verificando valores na tabela...');
  const valores = modal.querySelectorAll('td:last-child');
  valores.forEach((valor, index) => {
    const texto = valor.textContent.trim();
    if (texto.includes('R$')) {
      console.log(`💰 Valor ${index + 1}:`, {
        texto,
        classes: valor.className,
        color: window.getComputedStyle(valor).color,
        parent: valor.parentElement.textContent.trim()
      });
    }
  });
} else {
  console.log('⚠️ Modal não encontrado - pode estar fechado');
}

console.log('🔍 TESTE DE CORES - Concluído!');
