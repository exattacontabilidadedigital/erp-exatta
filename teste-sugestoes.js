// TESTE ESPECÍFICO PARA VERIFICAR SISTEMA DE SUGESTÕES
// Testando se a sistemática de sugestões está funcionando

const { MatchingEngine } = require('./lib/matching-engine.ts');

// Dados bancários que devem gerar SUGESTÕES
const transacoesBancarias = [
  // Caso 1: Valor ligeiramente diferente (deve ser SUGESTÃO)
  {
    id: "bank-1",
    fit_id: "TXN001",
    memo: "Pagamento Energia Elétrica",
    amount: -250.50,
    posted_at: "2025-01-15",
    transaction_type: "DEBIT"
  },
  
  // Caso 2: Data diferente (deve ser SUGESTÃO)
  {
    id: "bank-2", 
    fit_id: "TXN002",
    memo: "Supermercado ABC",
    amount: -150.00,
    posted_at: "2025-01-18", // 2 dias de diferença
    transaction_type: "DEBIT"
  },
  
  // Caso 3: Descrição similar mas não idêntica (deve ser SUGESTÃO)
  {
    id: "bank-3",
    fit_id: "TXN003",
    memo: "Pagto Fornecedor XYZ Ltda",
    amount: -500.00,
    posted_at: "2025-01-20",
    transaction_type: "DEBIT"
  },
  
  // Caso 4: Match exato (deve ser CONCILIADO)
  {
    id: "bank-4",
    fit_id: "TXN004", 
    memo: "Taxa de Manutenção",
    amount: -35.00,
    posted_at: "2025-01-22",
    transaction_type: "DEBIT"
  }
];

const lancamentosSistema = [
  // Para bank-1: valor um pouco diferente
  {
    id: "sys-1",
    descricao: "Pagamento Energia Elétrica",
    valor: -250.00, // R$ 0,50 de diferença (0.2%)
    data_lancamento: "2025-01-15",
    tipo: "despesa"
  },
  
  // Para bank-2: data diferente
  {
    id: "sys-2",
    descricao: "Supermercado ABC", 
    valor: -150.00,
    data_lancamento: "2025-01-16", // 2 dias de diferença
    tipo: "despesa"
  },
  
  // Para bank-3: descrição similar
  {
    id: "sys-3",
    descricao: "Pagamento Fornecedor XYZ",
    valor: -500.00,
    data_lancamento: "2025-01-20",
    tipo: "despesa"
  },
  
  // Para bank-4: match exato
  {
    id: "sys-4",
    descricao: "Taxa de Manutenção",
    valor: -35.00,
    data_lancamento: "2025-01-22", 
    tipo: "despesa"
  }
];

// Regras que permitem sugestões
const regrasParaSugestoes = [
  {
    id: "rule-1",
    nome: "Valor e Data com Tolerância",
    tipo: "valor_data",
    parametros: {
      tolerancia_valor: 2, // 2% de tolerância
      tolerancia_dias: 3   // 3 dias de tolerância
    },
    peso: 8,
    ativa: true
  },
  {
    id: "rule-2", 
    nome: "Similaridade de Descrição",
    tipo: "descricao",
    parametros: {
      similaridade_minima: 75 // 75% de similaridade
    },
    peso: 7,
    ativa: true
  }
];

async function testarSistemaSugestoes() {
  console.log('🧪 TESTANDO SISTEMA DE SUGESTÕES');
  console.log('=======================================\n');
  
  const matchingEngine = new MatchingEngine(regrasParaSugestoes);
  
  try {
    const resultados = await matchingEngine.processMatching(
      transacoesBancarias,
      lancamentosSistema,
      regrasParaSugestoes
    );
    
    console.log('📊 RESULTADOS DO TESTE:\n');
    
    let contadores = {
      conciliado: 0,
      sugerido: 0,
      transferencia: 0,
      sem_match: 0
    };
    
    resultados.forEach((resultado, index) => {
      const emoji = {
        'conciliado': '✅',
        'sugerido': '🟡',
        'transferencia': '🔵', 
        'sem_match': '⚪'
      }[resultado.status];
      
      console.log(`${index + 1}. ${emoji} Status: ${resultado.status.toUpperCase()}`);
      console.log(`   Banco: ${resultado.bankTransaction.memo} - R$ ${Math.abs(resultado.bankTransaction.amount).toFixed(2)}`);
      
      if (resultado.systemTransaction) {
        console.log(`   Sistema: ${resultado.systemTransaction.descricao} - R$ ${Math.abs(resultado.systemTransaction.valor).toFixed(2)}`);
        console.log(`   Score: ${resultado.matchScore}%`);
        console.log(`   Motivo: ${resultado.matchReason}`);
      } else {
        console.log(`   ❌ Sem correspondência`);
      }
      
      console.log(`   Confiança: ${resultado.confidenceLevel}\n`);
      
      contadores[resultado.status]++;
    });
    
    console.log('📈 RESUMO:');
    console.log(`✅ Conciliados: ${contadores.conciliado}`);
    console.log(`🟡 Sugeridos: ${contadores.sugerido}`); 
    console.log(`🔵 Transferências: ${contadores.transferencia}`);
    console.log(`⚪ Sem Match: ${contadores.sem_match}`);
    
    // Verificar se está funcionando
    if (contadores.sugerido > 0) {
      console.log('\n🎉 SISTEMA DE SUGESTÕES FUNCIONANDO!');
    } else {
      console.log('\n⚠️ SISTEMA DE SUGESTÕES NÃO ESTÁ GERANDO SUGESTÕES');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testarSistemaSugestoes();
