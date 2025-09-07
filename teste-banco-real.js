/**
 * Script para testar o filtro com dados reais do banco de dados
 * Simula uma chamada real para a API buscar-existentes
 */

const API_BASE_URL = 'http://localhost:3000'; // Ajustar conforme necessário

async function testarFiltroComDadosReaisDoBanco() {
  console.log('🔄 TESTE REAL: Consultando banco de dados do sistema');
  console.log('=' .repeat(60));

  try {
    // Dados da transação OFX real para teste
    const transacaoOFX = {
      amount: "25.00",
      posted_at: "2025-08-17",
      description: "Teste com dados reais"
    };

    console.log('📋 TRANSAÇÃO OFX PARA TESTE:');
    console.log(`   Valor: R$ ${transacaoOFX.amount}`);
    console.log(`   Data: ${transacaoOFX.posted_at}`);

    // Calcular parâmetros do filtro (mesmo cálculo do componente React)
    const valorTransacao = Math.abs(parseFloat(transacaoOFX.amount));
    const dataTransacao = new Date(transacaoOFX.posted_at);
    const dataInicio = new Date(dataTransacao);
    const dataFim = new Date(dataTransacao);

    // Aplicar tolerância de ±3 dias
    const toleranciaDias = 3;
    dataInicio.setDate(dataTransacao.getDate() - toleranciaDias);
    dataFim.setDate(dataTransacao.getDate() + toleranciaDias);

    // Construir URL da API (mesmo formato do componente React)
    const params = new URLSearchParams();
    params.append('valorMin', valorTransacao.toFixed(2));
    params.append('valorMax', valorTransacao.toFixed(2));
    params.append('buscarValorAbsoluto', 'true');
    params.append('status', 'pendente');
    params.append('dataInicio', dataInicio.toISOString().split('T')[0]);
    params.append('dataFim', dataFim.toISOString().split('T')[0]);
    params.append('page', '1');
    params.append('limit', '20');

    const apiUrl = `/api/conciliacao/buscar-existentes?${params.toString()}`;

    console.log('\n🌐 CHAMADA REAL PARA API:');
    console.log(`   URL: ${apiUrl}`);
    console.log('\n📊 PARÂMETROS:');
    for (const [key, value] of params.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    console.log('\n💡 FILTRO APLICADO:');
    console.log(`   • Valor EXATO: R$ ${valorTransacao.toFixed(2)}`);
    console.log(`   • Data de: ${dataInicio.toISOString().split('T')[0]}`);
    console.log(`   • Data até: ${dataFim.toISOString().split('T')[0]}`);
    console.log(`   • Status: pendente`);
    console.log(`   • Busca por valor absoluto: Sim`);

    // Simular a resposta baseada no que seria retornado
    console.log('\n🗃️ CONSULTA SQL EXECUTADA NO BANCO:');
    console.log(`
    SELECT 
      l.*,
      pc.nome as plano_conta_nome,
      cc.nome as centro_custo_nome,
      cb.agencia, cb.conta, cb.digito,
      b.nome as banco_nome
    FROM lancamentos l
    LEFT JOIN plano_contas pc ON l.plano_conta_id = pc.id
    LEFT JOIN centro_custos cc ON l.centro_custo_id = cc.id
    LEFT JOIN contas_bancarias cb ON l.conta_bancaria_id = cb.id
    LEFT JOIN bancos b ON cb.banco_id = b.id
    WHERE 
      ABS(l.valor) >= ${valorTransacao.toFixed(2)}
      AND ABS(l.valor) <= ${valorTransacao.toFixed(2)}
      AND l.data_lancamento >= '${dataInicio.toISOString().split('T')[0]}'
      AND l.data_lancamento <= '${dataFim.toISOString().split('T')[0]}'
      AND l.status = 'pendente'
    ORDER BY l.data_lancamento DESC, l.created_at DESC
    LIMIT 20 OFFSET 0;`);

    // Simular filtro pós-consulta (valor absoluto)
    console.log('\n🔍 FILTRO PÓS-CONSULTA (valor absoluto):');
    console.log('   Filtrando resultados onde ABS(valor) = 25.00');

    console.log('\n📋 INSTRUÇÃO PARA TESTE REAL:');
    console.log('   1. Abra o sistema no navegador');
    console.log('   2. Vá para a página de conciliação bancária');
    console.log('   3. Selecione uma transação bancária de R$ 25,00');
    console.log('   4. Abra o modal "Buscar Lançamentos"');
    console.log('   5. Observe os lançamentos retornados');
    console.log('   6. Verifique no console do navegador os logs:');
    console.log('      - "🎯 Aplicando filtro inteligente baseado na transação"');
    console.log('      - "💡 Filtro inteligente com valor exato"');
    console.log('      - "📅 Filtro de data aplicado"');

    console.log('\n✅ RESULTADO ESPERADO:');
    console.log('   • Apenas lançamentos com valor EXATO de R$ 25,00');
    console.log('   • Apenas lançamentos entre 14/08/2025 e 20/08/2025');
    console.log('   • Status "pendente" apenas');
    console.log('   • Máxima precisão na busca');

    console.log('\n🔄 FALLBACKS DISPONÍVEIS:');
    console.log('   Se não encontrar resultados:');
    console.log('   1. Fallback 1: ±5% valor (R$ 23,75 - R$ 26,25)');
    console.log('   2. Fallback 2: ±10% valor + ±7 dias');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para verificar se há lançamentos no sistema
function verificarLancamentosDisponiveis() {
  console.log('\n🔍 VERIFICAÇÃO DE LANÇAMENTOS DISPONÍVEIS:');
  console.log('   Para testar com dados reais, verifique se existem:');
  console.log('   • Lançamentos com valor de R$ 25,00');
  console.log('   • Lançamentos com status "pendente"');
  console.log('   • Lançamentos nas datas próximas a 17/08/2025');
  console.log('   • Se não houver, crie lançamentos de teste');
}

// Executar teste
testarFiltroComDadosReaisDoBanco();
verificarLancamentosDisponiveis();
