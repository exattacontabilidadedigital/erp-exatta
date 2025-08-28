// Teste da API de buscar lançamentos existentes
// Executar no console do navegador em http://localhost:3001

async function testarAPI() {
  console.log('🧪 TESTE DA API - Buscar Lançamentos Existentes');
  console.log('='.repeat(50));
  
  try {
    // Teste 1: Busca simples sem filtros
    console.log('\n📋 TESTE 1: Busca básica sem filtros');
    const response1 = await fetch('/api/conciliacao/buscar-existentes?page=1&limit=10');
    const data1 = await response1.json();
    
    console.log('✅ Resposta recebida:', {
      status: response1.status,
      total: data1.total,
      lancamentos: data1.lancamentos?.length,
      hasMore: data1.hasMore
    });
    
    if (data1.lancamentos && data1.lancamentos.length > 0) {
      console.log('📝 Primeiro lançamento:', data1.lancamentos[0]);
    }
    
    // Teste 2: Busca com status pendente
    console.log('\n📋 TESTE 2: Busca com status=pendente');
    const response2 = await fetch('/api/conciliacao/buscar-existentes?page=1&limit=10&status=pendente');
    const data2 = await response2.json();
    
    console.log('✅ Resposta com filtro pendente:', {
      status: response2.status,
      total: data2.total,
      lancamentos: data2.lancamentos?.length,
      hasMore: data2.hasMore
    });
    
    // Teste 3: Verificar estrutura dos dados
    if (data2.lancamentos && data2.lancamentos.length > 0) {
      console.log('\n🔍 ANÁLISE DA ESTRUTURA DOS DADOS:');
      const primeiro = data2.lancamentos[0];
      console.log('📊 Campos disponíveis:', Object.keys(primeiro));
      console.log('📄 Exemplo completo:', primeiro);
    }
    
    // Teste 4: Busca com limite maior
    console.log('\n📋 TESTE 3: Busca com limite=20');
    const response3 = await fetch('/api/conciliacao/buscar-existentes?page=1&limit=20&status=pendente');
    const data3 = await response3.json();
    
    console.log('✅ Resposta com limite 20:', {
      status: response3.status,
      total: data3.total,
      lancamentos: data3.lancamentos?.length,
      hasMore: data3.hasMore
    });
    
    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`🔢 Total de lançamentos na base: ${data1.total || 'N/A'}`);
    console.log(`✅ API funcionando: ${response1.ok ? 'SIM' : 'NÃO'}`);
    console.log(`📋 Dados estruturados: ${data1.lancamentos ? 'SIM' : 'NÃO'}`);
    console.log(`🔄 Paginação funcionando: ${data1.hasMore !== undefined ? 'SIM' : 'NÃO'}`);
    
    return {
      apiOK: response1.ok,
      totalLancamentos: data1.total,
      primeiraPagina: data1.lancamentos?.length,
      estruturaOK: data1.lancamentos && data1.lancamentos.length > 0
    };
    
  } catch (error) {
    console.error('❌ Erro no teste da API:', error);
    return { erro: error.message };
  }
}

// Executar o teste
console.log('🚀 Iniciando teste da API...');
testarAPI().then(resultado => {
  console.log('\n🎯 RESULTADO FINAL:', resultado);
});

// Função para testar problema específico dos 3 lançamentos
async function testarProblema3Lancamentos() {
  console.log('\n🔍 TESTE ESPECÍFICO: Problema dos 3 lançamentos');
  console.log('='.repeat(50));
  
  try {
    // Simular a requisição exata que está sendo feita pelo modal
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '20');
    params.append('status', 'pendente');
    
    const url = `/api/conciliacao/buscar-existentes?${params.toString()}`;
    console.log('🌐 URL testada:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 Resposta da API:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    console.log('📦 Dados recebidos:', {
      total: data.total,
      page: data.page,
      limit: data.limit,
      lancamentos: data.lancamentos?.length,
      hasMore: data.hasMore,
      tiposDados: data.lancamentos?.map(l => typeof l)
    });
    
    if (data.lancamentos) {
      console.log('📋 Lista completa de IDs:', data.lancamentos.map(l => l.id));
      console.log('💰 Lista de valores:', data.lancamentos.map(l => l.valor));
      console.log('📅 Lista de datas:', data.lancamentos.map(l => l.data_lancamento));
    }
    
    // Verificar se há inconsistência entre total reportado e itens retornados
    if (data.total && data.lancamentos) {
      const totalReportado = data.total;
      const itensRetornados = data.lancamentos.length;
      
      console.log(`\n🔍 ANÁLISE DE INCONSISTÊNCIA:`);
      console.log(`📊 Total reportado pela API: ${totalReportado}`);
      console.log(`📦 Itens retornados: ${itensRetornados}`);
      console.log(`🎯 Consistente: ${totalReportado >= itensRetornados ? 'SIM' : 'NÃO'}`);
      
      if (totalReportado > itensRetornados) {
        console.log(`⚠️ POSSÍVEL PROBLEMA: API reporta ${totalReportado} mas retorna apenas ${itensRetornados}`);
      }
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro no teste específico:', error);
    return { erro: error.message };
  }
}

// Executar teste específico
testarProblema3Lancamentos();
