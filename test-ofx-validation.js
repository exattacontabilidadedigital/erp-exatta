// =====================================
// TESTE VALIDAÇÃO OFX BANCO DO BRASIL
// =====================================

// Simular validação de banco melhorada
function testBankValidation() {
  console.log('🧪 TESTANDO VALIDAÇÃO DE BANCO - BANCO DO BRASIL');
  console.log('=' .repeat(60));
  
  // Mapeamento de códigos do Banco do Brasil
  const bancoBrasilCodes = ['001', '01', '1', '004', '04', '4'];
  
  function validateBank(ofxBankId, systemBankCode, systemBankName) {
    const bankMatches = 
      // Comparação direta
      systemBankCode === ofxBankId || 
      systemBankCode.padStart(3, '0') === ofxBankId.padStart(3, '0') ||
      // Banco do Brasil - aceitar qualquer código válido
      (bancoBrasilCodes.includes(systemBankCode) && bancoBrasilCodes.includes(ofxBankId)) ||
      // Verificação pelo nome do banco
      (systemBankName?.toLowerCase().includes('banco do brasil') && 
       bancoBrasilCodes.includes(ofxBankId));
       
    return bankMatches;
  }
  
  const testCases = [
    {
      name: 'OFX 001 vs Sistema 04 (Banco do Brasil)',
      ofxBankId: '001',
      systemBankCode: '04',
      systemBankName: 'Banco do Brasil',
      expected: true
    },
    {
      name: 'OFX 001 vs Sistema 001 (Banco do Brasil)',
      ofxBankId: '001',
      systemBankCode: '001',
      systemBankName: 'Banco do Brasil',
      expected: true
    },
    {
      name: 'OFX 001 vs Sistema 237 (Bradesco)',
      ofxBankId: '001',
      systemBankCode: '237',
      systemBankName: 'Bradesco',
      expected: false
    },
    {
      name: 'OFX 341 vs Sistema 04 (Banco do Brasil)',
      ofxBankId: '341',
      systemBankCode: '04',
      systemBankName: 'Banco do Brasil',
      expected: false
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(testCase => {
    const result = validateBank(
      testCase.ofxBankId, 
      testCase.systemBankCode, 
      testCase.systemBankName
    );
    
    const success = result === testCase.expected;
    
    if (success) {
      console.log(`✅ ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ ${testCase.name} - Resultado: ${result}, Esperado: ${testCase.expected}`);
      failed++;
    }
  });
  
  console.log(`\nResultado: ${passed} passou, ${failed} falhou`);
  return { passed, failed };
}

// Testar validação de conta
function testAccountValidation() {
  console.log('\n🧪 TESTANDO VALIDAÇÃO DE CONTA');
  console.log('=' .repeat(60));
  
  function validateAccount(ofxAccountId, systemConta, systemDigito) {
    const systemAccount = systemConta + (systemDigito ? systemDigito : '');
    const systemAccountOnly = systemConta;
    
    const accountMatches = 
      systemAccount === ofxAccountId || 
      systemAccountOnly === ofxAccountId ||
      systemAccount.replace(/[^0-9]/g, '') === ofxAccountId.replace(/[^0-9]/g, '') ||
      // Comparação mais flexível removendo zeros à esquerda
      parseInt(systemAccount, 10) === parseInt(ofxAccountId, 10) ||
      parseInt(systemAccountOnly, 10) === parseInt(ofxAccountId, 10);
      
    return accountMatches;
  }
  
  const testCases = [
    {
      name: 'OFX 39188 vs Sistema 39188-3',
      ofxAccountId: '39188',
      systemConta: '39188',
      systemDigito: '3',
      expected: true
    },
    {
      name: 'OFX 391883 vs Sistema 39188-3',
      ofxAccountId: '391883',
      systemConta: '39188',
      systemDigito: '3',
      expected: true
    },
    {
      name: 'OFX 39188 vs Sistema 39189-3',
      ofxAccountId: '39188',
      systemConta: '39189',
      systemDigito: '3',
      expected: false
    },
    {
      name: 'OFX 00039188 vs Sistema 39188-3',
      ofxAccountId: '00039188',
      systemConta: '39188',
      systemDigito: '3',
      expected: true
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(testCase => {
    const result = validateAccount(
      testCase.ofxAccountId, 
      testCase.systemConta, 
      testCase.systemDigito
    );
    
    const success = result === testCase.expected;
    
    if (success) {
      console.log(`✅ ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ ${testCase.name} - Resultado: ${result}, Esperado: ${testCase.expected}`);
      failed++;
    }
  });
  
  console.log(`\nResultado: ${passed} passou, ${failed} falhou`);
  return { passed, failed };
}

// Executar testes
async function runValidationTests() {
  console.log('🚀 INICIANDO TESTES DE VALIDAÇÃO OFX');
  console.log('=' .repeat(60));
  
  const bankResults = testBankValidation();
  const accountResults = testAccountValidation();
  
  const totalPassed = bankResults.passed + accountResults.passed;
  const totalFailed = bankResults.failed + accountResults.failed;
  const totalTests = totalPassed + totalFailed;
  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADOS FINAIS - VALIDAÇÃO OFX');
  console.log('='.repeat(60));
  console.log(`✅ Testes aprovados: ${totalPassed}`);
  console.log(`❌ Testes falharam: ${totalFailed}`);
  console.log(`📈 Taxa de sucesso: ${successRate}%`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 VALIDAÇÃO OFX FUNCIONANDO PERFEITAMENTE!');
    console.log('✅ Banco do Brasil será aceito com códigos 001 ou 04');
    console.log('✅ Contas serão validadas com flexibilidade para dígitos');
  } else {
    console.log('\n⚠️  Alguns testes falharam - verificar implementação.');
  }
}

runValidationTests();
