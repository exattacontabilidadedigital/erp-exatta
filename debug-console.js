// SCRIPT DE DEBUG PARA CONCILIAÇÃO
// Cole este código no console do navegador (F12 -> Console) e execute: startDebugMode()

window.conciliationDebug = {
  originalFetch: window.fetch,
  logs: [],
  isActive: false
};

function startDebugMode() {
  console.clear();
  console.log('🔧 MODO DEBUG ATIVADO PARA CONCILIAÇÃO');
  console.log('========================================');
  
  if (window.conciliationDebug.isActive) {
    console.log('⚠️ Debug já está ativo');
    return;
  }
  
  window.conciliationDebug.isActive = true;
  window.conciliationDebug.logs = [];
  
  // Interceptar todas as chamadas fetch relacionadas à conciliação
  window.fetch = async (...args) => {
    const url = args[0];
    const options = args[1];
    
    if (typeof url === 'string' && url.includes('/api/reconciliation/')) {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = {
        timestamp,
        url,
        method: options?.method || 'GET',
        body: options?.body
      };
      
      console.log(`🌐 [${timestamp}] REQUEST:`, {
        url,
        method: options?.method || 'GET',
        body: options?.body ? JSON.parse(options.body) : null
      });
      
      const response = await window.conciliationDebug.originalFetch(...args);
      
      const responseClone = response.clone();
      const responseData = await responseClone.json().catch(() => 'Não é JSON');
      
      console.log(`📡 [${timestamp}] RESPONSE:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: responseData
      });
      
      logEntry.response = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: responseData
      };
      
      window.conciliationDebug.logs.push(logEntry);
      
      return response;
    }
    
    return window.conciliationDebug.originalFetch(...args);
  };
  
  console.log('✅ Debug ativo! Agora clique em "Conciliar" em uma transação sugerida');
  console.log('📋 Para ver logs: showDebugLogs()');
  console.log('🛑 Para parar: stopDebugMode()');
}

function stopDebugMode() {
  if (!window.conciliationDebug.isActive) {
    console.log('⚠️ Debug não está ativo');
    return;
  }
  
  window.fetch = window.conciliationDebug.originalFetch;
  window.conciliationDebug.isActive = false;
  
  console.log('🛑 MODO DEBUG DESATIVADO');
  console.log('📊 Total de chamadas interceptadas:', window.conciliationDebug.logs.length);
}

function showDebugLogs() {
  console.log('📊 LOGS DE DEBUG DA CONCILIAÇÃO');
  console.log('===============================');
  
  if (window.conciliationDebug.logs.length === 0) {
    console.log('📭 Nenhum log encontrado');
    return;
  }
  
  window.conciliationDebug.logs.forEach((log, index) => {
    console.log(`\n[${index + 1}] ${log.timestamp} - ${log.method} ${log.url}`);
    if (log.body) {
      console.log('   REQUEST BODY:', JSON.parse(log.body));
    }
    if (log.response) {
      console.log('   RESPONSE:', log.response);
    }
  });
}

function testConciliationDirectly() {
  console.log('🧪 TESTE DIRETO DA API DE CONCILIAÇÃO');
  console.log('====================================');
  
  const testData = {
    bank_transaction_id: 'test-bank-id',
    system_transaction_id: 'test-system-id',
    confidence_level: 'high',
    rule_applied: 'teste_console'
  };
  
  fetch('/api/reconciliation/conciliate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  })
  .then(response => {
    console.log('📡 Status da resposta:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('📦 Dados da resposta:', data);
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
  });
}

function findConciliarButtons() {
  const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Conciliar')
  );
  
  console.log('🔍 BOTÕES "CONCILIAR" ENCONTRADOS:', buttons.length);
  
  if (buttons.length === 0) {
    console.log('❌ Nenhum botão "Conciliar" encontrado na página');
    console.log('💡 Certifique-se de estar na página de conciliação com transações sugeridas');
    return;
  }
  
  buttons.forEach((btn, index) => {
    console.log(`[${index + 1}]`, btn);
    console.log('   Texto:', btn.textContent);
    console.log('   Classes:', btn.className);
  });
  
  console.log('\n💡 Para testar um botão específico: buttons[0].click()');
  
  // Tornar os botões acessíveis globalmente para teste
  window.conciliarButtons = buttons;
  
  return buttons;
}

// Carregar automaticamente
console.log('🚀 DEBUG SCRIPTS CARREGADOS!');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('   startDebugMode()      - Ativar interceptação de requests');
console.log('   stopDebugMode()       - Desativar interceptação');
console.log('   showDebugLogs()       - Mostrar logs capturados');
console.log('   testConciliationDirectly() - Testar API diretamente');
console.log('   findConciliarButtons() - Encontrar botões na página');
console.log('');
console.log('💡 FLUXO RECOMENDADO:');
console.log('1. Execute: startDebugMode()');
console.log('2. Execute: findConciliarButtons()');
console.log('3. Clique em um botão "Conciliar" ou use: conciliarButtons[0].click()');
console.log('4. Execute: showDebugLogs() para ver o que aconteceu');
console.log('5. Execute: stopDebugMode() quando terminar');
