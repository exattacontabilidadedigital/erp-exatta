// Verificar se existem lançamentos de valor 25,00 no banco
async function verificarLancamentos25() {
  console.log('🔍 Verificando lançamentos de R$ 25,00...\n');
  
  try {
    // Buscar TODOS os lançamentos sem filtros
    const response = await fetch('http://localhost:3000/api/conciliacao/buscar-existentes?page=1&limit=100');
    
    if (response.ok) {
      const data = await response.json();
      const lancamentos = data.lancamentos || [];
      
      console.log(`📊 Total de lançamentos no banco: ${lancamentos.length}`);
      
      // Filtrar por valores próximos a 25,00
      const valoresProximos25 = lancamentos.filter(l => {
        const valor = Math.abs(parseFloat(l.valor || 0));
        return valor >= 20 && valor <= 30; // Faixa ampla para capturar 25,00
      });
      
      console.log(`\n🎯 Lançamentos entre R$ 20,00 - R$ 30,00: ${valoresProximos25.length}`);
      
      if (valoresProximos25.length > 0) {
        console.log('\n📋 Detalhes dos lançamentos:');
        valoresProximos25.forEach((lanc, index) => {
          const valor = parseFloat(lanc.valor || 0);
          const valorAbs = Math.abs(valor);
          console.log(`${index + 1}. ID: ${lanc.id.substring(0, 8)}, Valor: R$ ${valor.toFixed(2)}, Abs: R$ ${valorAbs.toFixed(2)}, Descrição: ${lanc.descricao || 'N/A'}, Status: ${lanc.status}`);
        });
      } else {
        console.log('❌ Não há lançamentos na faixa de R$ 20,00 - R$ 30,00');
      }
      
      // Verificar especificamente 25,00
      const exatos25 = lancamentos.filter(l => {
        const valor = Math.abs(parseFloat(l.valor || 0));
        return valor === 25.00;
      });
      
      console.log(`\n💡 Lançamentos de exatamente R$ 25,00: ${exatos25.length}`);
      if (exatos25.length > 0) {
        exatos25.forEach((lanc, index) => {
          const valor = parseFloat(lanc.valor || 0);
          console.log(`${index + 1}. ID: ${lanc.id.substring(0, 8)}, Valor: R$ ${valor.toFixed(2)}, Descrição: ${lanc.descricao || 'N/A'}, Status: ${lanc.status}`);
        });
      }
      
    } else {
      console.log(`❌ Erro na API: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`💥 Erro: ${error.message}`);
  }
}

verificarLancamentos25();
