// Script para simular múltiplos lançamentos via API da aplicação

async function criarCenarioViaAPI() {
  try {
    console.log('🔧 Criando cenário de múltiplos lançamentos via API...');

    // Primeiro, vamos verificar a estrutura da API de conciliação
    console.log('\n🔍 Verificando API de conciliação...');
    
    const listResponse = await fetch('http://localhost:3000/api/conciliation/list');
    const listData = await listResponse.json();
    
    console.log('Total transações bancárias:', listData.bankTransactions?.length || 0);
    console.log('Total lançamentos:', listData.systemTransactions?.length || 0);

    // Encontrar uma transação bancária sem match
    const transacaoSemMatch = listData.bankTransactions?.find(bt => 
      bt.reconciliation_status === 'sem_match'
    );

    if (!transacaoSemMatch) {
      console.log('❌ Nenhuma transação bancária sem match encontrada');
      return;
    }

    console.log('\n💰 Transação bancária selecionada:');
    console.log('- ID:', transacaoSemMatch.id);
    console.log('- Valor:', transacaoSemMatch.valor || transacaoSemMatch.amount);
    console.log('- Descrição:', transacaoSemMatch.descricao || transacaoSemMatch.memo);

    // Encontrar lançamentos sem match que possam somar o valor da transação bancária
    const valorBanco = Math.abs(transacaoSemMatch.valor || transacaoSemMatch.amount);
    const lancamentosSemMatch = listData.systemTransactions?.filter(st => 
      !st.status_conciliacao || st.status_conciliacao === 'pendente'
    ) || [];

    console.log('\n📋 Lançamentos disponíveis:', lancamentosSemMatch.length);

    // Vamos tentar usar dois lançamentos que somem próximo ao valor da transação bancária
    let lancamentosSelecionados = [];
    let somaAtual = 0;
    
    for (const lancamento of lancamentosSemMatch) {
      if (lancamentosSelecionados.length < 2) {
        lancamentosSelecionados.push(lancamento);
        somaAtual += Math.abs(lancamento.valor);
      }
    }

    if (lancamentosSelecionados.length >= 2) {
      console.log('\n🎯 Simulando múltiplos lançamentos:');
      console.log('Valor no banco:', valorBanco);
      console.log('Lançamentos selecionados:');
      
      lancamentosSelecionados.forEach((lancamento, index) => {
        console.log(`  ${index + 1}. ID: ${lancamento.id}, Valor: R$ ${lancamento.valor}, Descrição: ${lancamento.descricao}`);
      });
      
      console.log('Soma dos lançamentos:', somaAtual);
      console.log('Diferença:', Math.abs(valorBanco - somaAtual));

      // Para simular múltiplos matches, vou criar um objeto de teste que imite a estrutura
      console.log('\n🧪 Simulando dados para teste da interface:');
      
      const dadosSimulados = {
        bankTransaction: {
          id: transacaoSemMatch.id,
          valor: valorBanco,
          descricao: transacaoSemMatch.descricao || transacaoSemMatch.memo,
          reconciliation_status: 'sugerido'
        },
        systemTransactions: lancamentosSelecionados.map(l => ({
          id: l.id,
          valor: l.valor,
          descricao: l.descricao
        })),
        systemTransaction: {
          id: 'multiple',
          valor: somaAtual,
          descricao: `${lancamentosSelecionados.length} lançamentos selecionados`
        }
      };

      console.log('\n📊 Estrutura simulada:');
      console.log(JSON.stringify(dadosSimulados, null, 2));

      console.log('\n✨ Para testar o fix:');
      console.log('1. Acesse http://localhost:3000');
      console.log('2. Procure por cards que mostram múltiplos lançamentos');
      console.log('3. Verifique se o valor exibido é a soma dos lançamentos, não o valor individual');
      console.log('4. Observe os logs no console do navegador com "💰 MÚLTIPLOS LANÇAMENTOS"');

    } else {
      console.log('❌ Não há lançamentos suficientes para criar o cenário de teste');
    }

  } catch (error) {
    console.error('Erro durante simulação:', error);
  }
}

// Executar simulação
criarCenarioViaAPI();
