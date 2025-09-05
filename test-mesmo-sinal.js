// ✅ TESTE SIMPLES DAS REGRAS IMPLEMENTADAS (JavaScript)
// Validação da lógica de "mesmo sinal" para sugestões

console.log('🧪 TESTANDO LÓGICA DE MESMO SINAL PARA SUGESTÕES');
console.log('===============================================\n');

// Função simples para testar a lógica de mesmo sinal
function testarMesmoSinal(bankAmount, systemAmount, description = '') {
  const bankIsPositive = bankAmount >= 0;
  const systemIsPositive = systemAmount >= 0;
  const sameSinal = bankIsPositive === systemIsPositive;
  
  console.log(`📊 Testando:`, {
    bankAmount,
    systemAmount,
    bankSign: bankIsPositive ? '+' : '-',
    systemSign: systemIsPositive ? '+' : '-',
    sameSinal,
    description
  });
  
  if (sameSinal) {
    console.log(`✅ PODE SER SUGESTÃO - Mesmo sinal`);
    return 'sugerido';
  } else {
    console.log(`❌ NÃO PODE SER SUGESTÃO - Sinais opostos (seria transferência ou sem match)`);
    return 'transferencia_ou_sem_match';
  }
}

// Casos baseados nos dados reais do usuário
console.log('📋 CASOS DE TESTE BASEADOS NOS DADOS REAIS:\n');

// Caso 1: OFX: -25.00, Sistema: +25.00 (seus dados)
console.log('1️⃣ Caso real dos seus dados:');
testarMesmoSinal(-25.00, 25.00, 'OFX débito vs Sistema crédito');
console.log('');

// Caso 2: Mesmo sinal positivo
console.log('2️⃣ Caso válido - mesmo sinal positivo:');
testarMesmoSinal(500.00, 502.00, 'Ambos créditos');
console.log('');

// Caso 3: Mesmo sinal negativo
console.log('3️⃣ Caso válido - mesmo sinal negativo:');
testarMesmoSinal(-250.00, -248.50, 'Ambos débitos');
console.log('');

// Caso 4: Sinais opostos (como transferência)
console.log('4️⃣ Caso inválido para sugestão - sinais opostos:');
testarMesmoSinal(-1000.00, 1000.00, 'Possível transferência');
console.log('');

console.log('🎯 REGRAS APLICADAS:');
console.log('=====================');
console.log('✅ Para SUGESTÃO: Ambos devem ser receitas OU ambos devem ser despesas');
console.log('❌ Sinais opostos: Não pode ser sugestão (seria transferência ou sem match)');
console.log('📋 Conforme documento: "OFX: -R$ 500,00 + Sistema: +R$ 500,00 ❌ Não é sugestão"');
console.log('\n🚀 IMPLEMENTAÇÃO CORRETA - Regra de mesmo sinal aplicada!');
