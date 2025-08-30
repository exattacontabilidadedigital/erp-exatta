// Script para testar se o formulário está funcionando
console.log('🔍 Testando se o formulário está carregando corretamente...')

// Verificar se há erros no console
window.addEventListener('error', (event) => {
  console.error('❌ Erro JavaScript detectado:', event.error)
})

// Verificar se há erros de Promise rejeitada
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rejeitada:', event.reason)
})

// Verificar se o formulário está presente
setTimeout(() => {
  const form = document.querySelector('form')
  if (form) {
    console.log('✅ Formulário encontrado')
    console.log('📋 Campos do formulário:', form.querySelectorAll('input, select, textarea').length)
  } else {
    console.error('❌ Formulário não encontrado')
  }
  
  // Verificar se há botões de salvar
  const saveButton = document.querySelector('button[type="submit"]')
  if (saveButton) {
    console.log('✅ Botão de salvar encontrado')
    console.log('📋 Texto do botão:', saveButton.textContent)
  } else {
    console.error('❌ Botão de salvar não encontrado')
  }
}, 2000)

console.log('🧪 Script de debug carregado. Verifique o console para resultados.')
