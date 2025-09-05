// Teste do tratamento de erro melhorado
console.log('🧪 Testando tratamento de erro melhorado...\n');

// Simulando diferentes cenários de erro HTTP
const testErrorHandling = (status, errorData) => {
  console.log(`📋 Testando erro HTTP ${status}:`);
  
  let userFriendlyMessage = errorData?.error || 'Erro desconhecido';
  
  if (status === 409) {
    userFriendlyMessage = 'Este lançamento já está conciliado com outra transação. Desvinculá-lo primeiro se necessário.';
  } else if (status === 400) {
    userFriendlyMessage = 'Dados inválidos para conciliação. Verifique as informações selecionadas.';
  } else if (status === 404) {
    userFriendlyMessage = 'Transação não encontrada. Ela pode ter sido removida ou modificada.';
  } else if (status === 500) {
    userFriendlyMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.';
  }
  
  console.log('   Mensagem amigável:', userFriendlyMessage);
  console.log('   Dados originais:', errorData);
  console.log('');
};

// Casos de teste
testErrorHandling(409, { 
  error: 'Lançamento do sistema já está conciliado com outra transação',
  existing_matches: ['some-id']
});

testErrorHandling(400, { 
  error: 'Dados de entrada inválidos'
});

testErrorHandling(404, { 
  error: 'Transação não encontrada'
});

testErrorHandling(500, { 
  error: 'Erro interno do servidor'
});

testErrorHandling(422, { 
  error: 'Erro específico não mapeado'
});

console.log('✅ Agora os erros terão mensagens mais amigáveis!');
console.log('🎯 Especialmente o erro 409 (conflito) que estava causando problemas.');
