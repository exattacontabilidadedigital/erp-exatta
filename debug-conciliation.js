// Script para debug da conciliação no console do navegador
// Cole este código no console do navegador (F12 -> Console)

async function debugConciliation() {
  console.log('🔍 INICIANDO DEBUG DA CONCILIAÇÃO...');
  
  try {
    // 1. Verificar se existe alguma transação sugerida na página
    console.log('1️⃣ Verificando transações na página...');
    
    // Buscar botões de "Conciliar" na página
    const conciliarButtons = document.querySelectorAll('button');
    const conciliarButton = Array.from(conciliarButtons).find(btn => 
      btn.textContent?.includes('Conciliar')
    );
    
    if (!conciliarButton) {
      console.log('❌ Nenhum botão "Conciliar" encontrado na página');
      console.log('💡 Navegue até uma página com transações sugeridas');
      return;
    }
    
    console.log('✅ Botão "Conciliar" encontrado:', conciliarButton);
    
    // 2. Simular clique no botão para ver se há erros
    console.log('2️⃣ Simulando clique no botão...');
    
    // Adicionar listener para erros
    const originalError = console.error;
    const errors = [];
    console.error = (...args) => {
      errors.push(args);
      originalError.apply(console, args);
    };
    
    // Simular clique
    conciliarButton.click();
    
    // Aguardar um pouco para ver se há erros
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Restaurar console.error
    console.error = originalError;
    
    console.log('3️⃣ Erros capturados durante o clique:', errors);
    
    if (errors.length === 0) {
      console.log('✅ Nenhum erro detectado no frontend');
    } else {
      console.log('❌ Erros encontrados:', errors);
    }
    
    // 3. Testar API diretamente
    console.log('4️⃣ Testando API de conciliação diretamente...');
    
    const testResponse = await fetch('/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: 'test-id',
        system_transaction_id: 'test-id',
        confidence_level: 'high',
        rule_applied: 'teste_debug'
      })
    });
    
    console.log('📡 Resposta da API:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok
    });
    
    const responseText = await testResponse.text();
    console.log('📄 Conteúdo da resposta:', responseText);
    
  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}

// Função para monitorar network requests
function monitorNetworkRequests() {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0];
    const options = args[1];
    
    if (typeof url === 'string' && url.includes('/api/reconciliation/')) {
      console.log('🌐 REQUEST:', {
        url,
        method: options?.method || 'GET',
        body: options?.body
      });
      
      const response = await originalFetch(...args);
      
      console.log('📡 RESPONSE:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      return response;
    }
    
    return originalFetch(...args);
  };
  
  console.log('👁️ Monitor de requests ativado para /api/reconciliation/*');
}

console.log('🚀 Scripts de debug carregados!');
console.log('📋 Comandos disponíveis:');
console.log('   debugConciliation() - Testar conciliação');
console.log('   monitorNetworkRequests() - Monitorar chamadas da API');
console.log('');
console.log('💡 Execute: monitorNetworkRequests() e depois clique em "Conciliar"');
console.log('💡 Para debug completo: debugConciliation()');
