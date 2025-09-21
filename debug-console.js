// Utilitário para debug de erros do Supabase
// Cole este código no console do browser para ver o último erro

function checkLastSupabaseError() {
  try {
    const lastError = localStorage.getItem('lastSupabaseError');
    const lastTimestamp = localStorage.getItem('lastSupabaseErrorTimestamp');
    
    if (lastError) {
      console.log('🕐 Último erro capturado em:', lastTimestamp);
      console.log('🔧 Erro completo:', JSON.parse(lastError));
      
      const errorObj = JSON.parse(lastError);
      
      if (errorObj.message) {
        console.log('📧 Mensagem:', errorObj.message);
      }
      
      if (errorObj.details) {
        console.log('📋 Detalhes:', errorObj.details);
      }
      
      if (errorObj.code) {
        console.log('🔢 Código:', errorObj.code);
      }
      
      if (errorObj.hint) {
        console.log('💡 Dica:', errorObj.hint);
      }
      
      console.log('🗂️ Todas as propriedades:', errorObj.errorKeys);
      
    } else {
      console.log('ℹ️ Nenhum erro encontrado no localStorage');
    }
  } catch (e) {
    console.error('Erro ao verificar localStorage:', e);
  }
}

// Função para limpar o histórico
function clearSupabaseErrorHistory() {
  localStorage.removeItem('lastSupabaseError');
  localStorage.removeItem('lastSupabaseErrorTimestamp');
  console.log('🗑️ Histórico de erros limpo');
}

console.log('🛠️ Utilitário de debug carregado!');
console.log('📞 Use: checkLastSupabaseError() para ver o último erro');
console.log('🗑️ Use: clearSupabaseErrorHistory() para limpar o histórico');

// Executar automaticamente
checkLastSupabaseError();