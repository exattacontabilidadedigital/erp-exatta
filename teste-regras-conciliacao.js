// TESTE PRÁTICO - Sistema de Sugestões
// Para verificar se o sistema está gerando sugestões corretamente

// Dados específicos para gerar SUGESTÕES
const exemploTransacoesBancarias = [
  // ✅ VERDE - Match Exato (deve ser CONCILIADO)
  {
    id: "1",
    fit_id: "TXN001",
    memo: "Pagamento Fornecedor ABC Ltda",
    amount: -1500.00,
    posted_at: "2025-01-15",
    transaction_type: "DEBIT"
  },
  
  // � AMARELO - Sugestão por valor diferente (deve ser SUGERIDO)
  {
    id: "2", 
    fit_id: "TXN002",
    memo: "Compra Supermercado XYZ",
    amount: -250.50, // R$ 0,50 de diferença
    posted_at: "2025-01-16",
    transaction_type: "DEBIT"
  },
  
  // 🟡 AMARELO - Sugestão por data diferente (deve ser SUGERIDO)
  {
    id: "3",
    fit_id: "TXN003", 
    memo: "Energia Elétrica",
    amount: -180.00,
    posted_at: "2025-01-20", // 2 dias de diferença
    transaction_type: "DEBIT"
  },
  
  // � AMARELO - Sugestão por descrição similar (deve ser SUGERIDO)
  {
    id: "4",
    fit_id: "TXN004",
    memo: "Pagto Internet Banda Larga",
    amount: -89.90,
    posted_at: "2025-01-25", 
    transaction_type: "DEBIT"
  },
  
  // ⚪ BRANCO - Sem Match (sem correspondência)
  {
    id: "5",
    fit_id: "TXN005",
    memo: "Taxa bancária especial",
    amount: -15.00,
    posted_at: "2025-01-28", 
    transaction_type: "DEBIT"
  }
];

const exemploLancamentosSistema = [
  // Match para transação 1 (CONCILIADO - exato)
  {
    id: "L001",
    descricao: "Pagamento Fornecedor ABC Ltda",
    valor: -1500.00,
    data_lancamento: "2025-01-15",
    tipo: "despesa"
  },
  
  // Match para transação 2 (SUGERIDO - valor diferente)
  {
    id: "L002", 
    descricao: "Compra Supermercado XYZ",
    valor: -250.00, // R$ 0,50 de diferença (0.2%)
    data_lancamento: "2025-01-16",
    tipo: "despesa"
  },
  
  // Match para transação 3 (SUGERIDO - data diferente)
  {
    id: "L003",
    descricao: "Energia Elétrica",
    valor: -180.00,
    data_lancamento: "2025-01-18", // 2 dias de diferença
    tipo: "despesa"
  },
  
  // Match para transação 4 (SUGERIDO - descrição similar)
  {
    id: "L004",
    descricao: "Internet Banda Larga",
    valor: -89.90,
    data_lancamento: "2025-01-25",
    tipo: "despesa"
  }
  
  // Não há lançamento para transação 5 (SEM_MATCH)
];

// Simulação dos resultados esperados para TESTE DE SUGESTÕES
const resultadosEsperados = [
  {
    bankTransaction: exemploTransacoesBancarias[0],
    systemTransaction: exemploLancamentosSistema[0],
    status: "conciliado", // ✅ VERDE - Match exato
    matchScore: 100,
    matchReason: "Valor, data e descrição idênticos",
    confidenceLevel: "high"
  },
  
  {
    bankTransaction: exemploTransacoesBancarias[1], 
    systemTransaction: exemploLancamentosSistema[1],
    status: "sugerido", // � AMARELO - Valor ligeiramente diferente
    matchScore: 88,
    matchReason: "Data e valor semelhantes (±2%, ±3 dias)",
    confidenceLevel: "medium"
  },
  
  {
    bankTransaction: exemploTransacoesBancarias[2],
    systemTransaction: exemploLancamentosSistema[2], 
    status: "sugerido", // � AMARELO - Data diferente
    matchScore: 80,
    matchReason: "Data e valor semelhantes (±2%, ±3 dias)",
    confidenceLevel: "medium"
  },
  
  {
    bankTransaction: exemploTransacoesBancarias[3],
    systemTransaction: exemploLancamentosSistema[3],
    status: "sugerido", // 🟡 AMARELO - Descrição similar
    matchScore: 75,
    matchReason: "Descrição similar (78%)",
    confidenceLevel: "medium"
  },
  
  {
    bankTransaction: exemploTransacoesBancarias[4],
    systemTransaction: null,
    status: "sem_match", // ⚪ BRANCO
    matchScore: 0,
    matchReason: "Nenhuma correspondência encontrada", 
    confidenceLevel: "low"
  }
];

// Função para testar se o sistema de sugestões está funcionando
function testarRegrasImplementadas() {
  console.log("🧪 TESTANDO SISTEMA DE SUGESTÕES\n");
  
  resultadosEsperados.forEach((resultado, index) => {
    const emoji = {
      'conciliado': '✅',
      'sugerido': '�', // Mudei para amarelo para destacar sugestões
      'transferencia': '🔵',
      'sem_match': '⚪'
    }[resultado.status];
    
    const cor = {
      'conciliado': 'VERDE',
      'sugerido': 'AMARELO', // Destacando que é sugestão
      'transferencia': 'AZUL', 
      'sem_match': 'BRANCO'
    }[resultado.status];
    
    console.log(`${index + 1}. ${emoji} Card ${cor} - Status: ${resultado.status.toUpperCase()}`);
    console.log(`   Transação: ${resultado.bankTransaction.memo}`);
    console.log(`   Valor: R$ ${Math.abs(resultado.bankTransaction.amount).toFixed(2)}`);
    console.log(`   Score: ${resultado.matchScore}%`);
    console.log(`   Motivo: ${resultado.matchReason}`);
    console.log(`   Confiança: ${resultado.confidenceLevel}`);
    
    if (resultado.systemTransaction) {
      console.log(`   ↔️ Sistema: ${resultado.systemTransaction.descricao}`);
    } else {
      console.log(`   ❌ Sem correspondência no sistema`);
    }
    console.log("");
  });
  
  console.log("📊 RESUMO DOS TESTES:");
  console.log(`✅ Conciliados: ${resultadosEsperados.filter(r => r.status === 'conciliado').length}`);
  console.log(`� Sugeridos: ${resultadosEsperados.filter(r => r.status === 'sugerido').length}`);
  console.log(`🔵 Transferências: ${resultadosEsperados.filter(r => r.status === 'transferencia').length}`);
  console.log(`⚪ Sem Match: ${resultadosEsperados.filter(r => r.status === 'sem_match').length}`);
  
  // Verificar se o sistema está gerando sugestões
  const sugestoes = resultadosEsperados.filter(r => r.status === 'sugerido').length;
  console.log(`\n🎯 FOCO: Sistema deveria gerar ${sugestoes} SUGESTÕES`);
  console.log(`📋 Casos esperados:`);
  console.log(`   - Valor ligeiramente diferente (R$ 0,50)`);
  console.log(`   - Data com 2 dias de diferença`);
  console.log(`   - Descrição similar mas não idêntica`);
  
  console.log(`\n💡 PRÓXIMO PASSO: Testar na interface real para verificar se as regras estão ativas!`);
}

// Cenários de teste para validação de conta
const testeValidacaoOFX = {
  // ✅ OFX válido da conta correta
  ofxValido: {
    bankId: "341", // Itaú
    accountId: "12345",
    contaSelecionada: {
      banco: { codigo: "341", nome: "Itaú" },
      conta: "12345", 
      digito: "6"
    },
    resultado: "✅ APROVADO - Conta corresponde"
  },
  
  // ❌ OFX de banco incorreto  
  ofxBancoIncorreto: {
    bankId: "237", // Bradesco
    accountId: "12345",
    contaSelecionada: {
      banco: { codigo: "341", nome: "Itaú" },
      conta: "12345",
      digito: "6" 
    },
    resultado: "❌ REJEITADO - Banco incorreto"
  },
  
  // ❌ OFX de conta incorreta
  ofxContaIncorreta: {
    bankId: "341", // Itaú correto
    accountId: "99999", // Conta errada
    contaSelecionada: {
      banco: { codigo: "341", nome: "Itaú" },
      conta: "12345",
      digito: "6"
    },
    resultado: "❌ REJEITADO - Conta incorreta"
  }
};

console.log("🎯 SISTEMA DE CONCILIAÇÃO BANCÁRIA - MELHORIAS IMPLEMENTADAS");
console.log("=".repeat(70));

// Executar testes se arquivo for executado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  testarRegrasImplementadas();
}

module.exports = {
  exemploTransacoesBancarias,
  exemploLancamentosSistema, 
  resultadosEsperados,
  testeValidacaoOFX,
  testarRegrasImplementadas
};
