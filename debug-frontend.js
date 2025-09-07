// Debug script para verificar dados no frontend
console.log('🔍 Script de debug iniciado...');

// Aguardar 2 segundos para garantir que a página carregou
setTimeout(() => {
  try {
    // Procurar por elementos do React no console
    const reactRoot = document.querySelector('#__next');
    if (reactRoot) {
      console.log('✅ React app encontrado');
      
      // Verificar se há dados no localStorage ou sessionStorage
      console.log('📦 LocalStorage keys:', Object.keys(localStorage));
      console.log('📦 SessionStorage keys:', Object.keys(sessionStorage));
      
      // Tentar encontrar dados de transações na página
      const cards = document.querySelectorAll('[class*="border"]');
      console.log(`🃏 Encontrados ${cards.length} elementos com border`);
      
      // Verificar se há logs do console da aplicação
      console.log('🔍 Verifique no Network tab se as APIs estão retornando dados corretos');
      console.log('🔍 Verifique se há erros no console');
      
      // Tentar interceptar chamadas fetch
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        console.log('🌐 Fetch interceptado:', args[0]);
        return originalFetch.apply(this, arguments).then(response => {
          if (args[0]?.includes('reconciliation')) {
            console.log('📡 Response da API de reconciliação:', response.status);
          }
          return response;
        });
      };
      
    } else {
      console.log('❌ React app não encontrado');
    }
  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}, 2000);
