// Teste: Verificar filtro inteligente para valor 25,00
console.log('🧪 Testando filtro inteligente para transação de R$ 25,00...\n');

// Simulação do filtro inteligente
const valorTransacao = 25.00;
const tolerancia = 0.15; // 15%

const valorMin = valorTransacao * (1 - tolerancia);
const valorMax = valorTransacao * (1 + tolerancia);

console.log('📊 Parâmetros do filtro inteligente:');
console.log(`Valor da transação: R$ ${valorTransacao.toFixed(2)}`);
console.log(`Tolerância: ${(tolerancia * 100)}%`);
console.log(`Valor mínimo: R$ ${valorMin.toFixed(2)}`);
console.log(`Valor máximo: R$ ${valorMax.toFixed(2)}`);
console.log(`Faixa de busca: R$ ${valorMin.toFixed(2)} - R$ ${valorMax.toFixed(2)}`);

// Simular alguns valores de lançamentos para teste
const valoresLancamentos = [25.00, -25.00, 24.50, 25.50, 28.75, 21.25, 30.00, 20.00];

console.log('\n🔍 Teste de valores que deveriam ser encontrados:');
valoresLancamentos.forEach(valor => {
  const valorAbsoluto = Math.abs(valor);
  const estaNoIntervalo = valorAbsoluto >= valorMin && valorAbsoluto <= valorMax;
  const resultado = estaNoIntervalo ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO';
  
  console.log(`Valor: R$ ${valor.toFixed(2).padStart(7)} → Abs: R$ ${valorAbsoluto.toFixed(2).padStart(7)} → ${resultado}`);
});

// Testar a API real
async function testarAPI() {
  console.log('\n🌐 Testando API real...');
  
  const params = new URLSearchParams();
  params.append('page', '1');
  params.append('limit', '20');
  params.append('status', 'pendente');
  params.append('valorMin', valorMin.toFixed(2));
  params.append('valorMax', valorMax.toFixed(2));
  params.append('buscarValorAbsoluto', 'true');
  
  const url = `http://localhost:3000/api/conciliacao/buscar-existentes?${params.toString()}`;
  console.log('URL da API:', url);
  
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📊 Resultado da API:');
      console.log(`Total encontrado: ${data.total || 0}`);
      console.log(`Lançamentos retornados: ${data.lancamentos?.length || 0}`);
      
      if (data.lancamentos && data.lancamentos.length > 0) {
        console.log('\n📋 Lançamentos encontrados:');
        data.lancamentos.forEach((lanc, index) => {
          const valor = parseFloat(lanc.valor || 0);
          const valorAbs = Math.abs(valor);
          console.log(`${index + 1}. ID: ${lanc.id.substring(0, 8)}, Valor: R$ ${valor.toFixed(2)}, Abs: R$ ${valorAbs.toFixed(2)}, Descrição: ${lanc.descricao || 'N/A'}`);
        });
      } else {
        console.log('❌ Nenhum lançamento encontrado');
      }
    } else {
      console.log(`❌ Erro na API: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`💥 Erro: ${error.message}`);
  }
}

testarAPI();
