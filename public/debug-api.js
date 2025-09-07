// Debug simples para testar a API
console.log('🧪 Testando API buscar-existentes...');

// Simulando a chamada que o modal faz
fetch('http://localhost:3000/api/conciliacao/buscar-existentes?page=1&limit=20&status=pendente&valorMin=8.50&valorMax=11.50&buscarValorAbsoluto=true')
  .then(response => {
    console.log('📡 Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📦 Resposta da API:', data);
    console.log('📊 Resumo:', {
      total: data.total,
      lancamentos: data.lancamentos?.length || 0,
      filtroAplicado: data.filtros?.buscarValorAbsoluto
    });
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
