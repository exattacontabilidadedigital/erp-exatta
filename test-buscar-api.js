// Script para testar a API de buscar lançamentos
const testAPI = async () => {
  console.log('🧪 TESTANDO API /api/conciliacao/buscar-existentes');
  
  try {
    // Teste 1: Busca simples (sem filtros de valor)
    console.log('\n📋 TESTE 1: Busca simples (status=pendente)');
    const response1 = await fetch('http://localhost:3001/api/conciliacao/buscar-existentes?page=1&limit=5&status=pendente');
    const data1 = await response1.json();
    console.log('✅ Resultado:', {
      total: data1.total,
      lancamentos: data1.lancamentos?.length || 0,
      valores: data1.lancamentos?.map(l => ({ id: l.id.substring(0, 8), valor: l.valor })) || []
    });

    // Teste 2: Busca com filtro de valor absoluto
    console.log('\n📋 TESTE 2: Busca com valor absoluto (8.50 - 11.50)');
    const response2 = await fetch('http://localhost:3001/api/conciliacao/buscar-existentes?page=1&limit=20&status=pendente&valorMin=8.50&valorMax=11.50&buscarValorAbsoluto=true');
    const data2 = await response2.json();
    console.log('✅ Resultado:', {
      total: data2.total,
      lancamentos: data2.lancamentos?.length || 0,
      valores: data2.lancamentos?.map(l => ({ 
        id: l.id.substring(0, 8), 
        valor: l.valor,
        valorAbs: Math.abs(l.valor)
      })) || []
    });

    // Teste 3: Busca com valor que sabemos que existe
    console.log('\n📋 TESTE 3: Busca com valor que existe (45-55)');
    const response3 = await fetch('http://localhost:3001/api/conciliacao/buscar-existentes?page=1&limit=20&status=pendente&valorMin=45&valorMax=55&buscarValorAbsoluto=true');
    const data3 = await response3.json();
    console.log('✅ Resultado:', {
      total: data3.total,
      lancamentos: data3.lancamentos?.length || 0,
      valores: data3.lancamentos?.map(l => ({ 
        id: l.id.substring(0, 8), 
        valor: l.valor,
        valorAbs: Math.abs(l.valor)
      })) || []
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

testAPI();
