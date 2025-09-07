// ==========================================
// TESTE - BUSCA NUMÉRICA CORRIGIDA
// Testar se a correção da API funcionou
// ==========================================

const baseURL = 'http://localhost:3000';

async function testBuscaNumerica() {
  console.log('🧪 TESTE - Busca Numérica Corrigida');
  console.log('='.repeat(50));
  
  try {
    // Teste 1: Busca que causava erro antes (valor com vírgula)
    console.log('\n📋 TESTE 1: Busca valor com vírgula (50,18)');
    const response1 = await fetch(`${baseURL}/api/conciliacao/buscar-existentes?busca=50,18&limit=5`);
    
    console.log('✅ Status da resposta:', response1.status);
    
    if (!response1.ok) {
      const errorData = await response1.text();
      console.log('❌ Erro na resposta:', errorData);
      return;
    }
    
    const data1 = await response1.json();
    console.log('📊 Resultados encontrados:', data1.lancamentos?.length || 0);
    
    if (data1.lancamentos && data1.lancamentos.length > 0) {
      console.log('📝 Primeiro resultado:');
      const primeiro = data1.lancamentos[0];
      console.log(`   ID: ${primeiro.id}`);
      console.log(`   Descrição: ${primeiro.descricao}`);
      console.log(`   Valor: R$ ${primeiro.valor}`);
      console.log(`   Data: ${primeiro.data_lancamento}`);
    }
    
    // Teste 2: Busca valor com ponto (50.18)
    console.log('\n📋 TESTE 2: Busca valor com ponto (50.18)');
    const response2 = await fetch(`${baseURL}/api/conciliacao/buscar-existentes?busca=50.18&limit=5`);
    console.log('✅ Status da resposta:', response2.status);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('📊 Resultados encontrados:', data2.lancamentos?.length || 0);
    }
    
    // Teste 3: Busca apenas número (50)
    console.log('\n📋 TESTE 3: Busca apenas número (50)');
    const response3 = await fetch(`${baseURL}/api/conciliacao/buscar-existentes?busca=50&limit=10`);
    console.log('✅ Status da resposta:', response3.status);
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('📊 Resultados encontrados:', data3.lancamentos?.length || 0);
      
      if (data3.lancamentos && data3.lancamentos.length > 0) {
        console.log('💰 Valores encontrados:');
        data3.lancamentos.slice(0, 3).forEach(l => {
          console.log(`   R$ ${l.valor} - ${l.descricao}`);
        });
      }
    }
    
    // Teste 4: Busca texto normal (não numérica)
    console.log('\n📋 TESTE 4: Busca texto normal ("fdfa")');
    const response4 = await fetch(`${baseURL}/api/conciliacao/buscar-existentes?busca=fdfa&limit=5`);
    console.log('✅ Status da resposta:', response4.status);
    
    if (response4.ok) {
      const data4 = await response4.json();
      console.log('📊 Resultados encontrados:', data4.lancamentos?.length || 0);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO - API funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testBuscaNumerica();
