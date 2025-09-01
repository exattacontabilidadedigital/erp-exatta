// Teste da API completa com o parâmetro include_reconciled

async function testAPIWithCheckbox() {
  console.log('🧪 Testando API com parâmetro include_reconciled...');
  
  const baseURL = 'http://localhost:3000/api/reconciliation/suggestions';
  const params = {
    bank_account_id: '4fd86770-32c4-4927-9d7e-8f3ded7b38fa',
    period_start: '2025-08-01',
    period_end: '2025-08-31',
    empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d'
  };
  
  // 1. Teste com include_reconciled=false (default)
  console.log('\n1. 📋 Teste com include_reconciled=false:');
  try {
    const url1 = `${baseURL}?${new URLSearchParams({...params, include_reconciled: 'false'}).toString()}`;
    console.log(`   🔗 URL: ${url1}`);
    
    const response1 = await fetch(url1);
    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`   ✅ Sucesso: ${data1.pairs?.length || 0} pares retornados`);
      console.log(`   📊 Summary: ${JSON.stringify(data1.summary)}`);
    } else {
      console.log(`   ❌ Erro ${response1.status}: ${await response1.text()}`);
    }
  } catch (error) {
    console.log(`   💥 Erro de conexão: ${error.message}`);
  }
  
  // 2. Teste com include_reconciled=true
  console.log('\n2. ☑️ Teste com include_reconciled=true:');
  try {
    const url2 = `${baseURL}?${new URLSearchParams({...params, include_reconciled: 'true'}).toString()}`;
    console.log(`   🔗 URL: ${url2}`);
    
    const response2 = await fetch(url2);
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`   ✅ Sucesso: ${data2.pairs?.length || 0} pares retornados`);
      console.log(`   📊 Summary: ${JSON.stringify(data2.summary)}`);
      
      // Verificar se há transações conciliadas
      const reconciledPairs = data2.pairs?.filter(p => 
        p.bankTransaction?.status_conciliacao === 'conciliado' ||
        p.bankTransaction?.reconciliation_status === 'matched'
      );
      console.log(`   🟢 Transações conciliadas: ${reconciledPairs?.length || 0}`);
      
      if (reconciledPairs && reconciledPairs.length > 0) {
        console.log('   📝 Amostra de conciliadas:');
        reconciledPairs.slice(0, 2).forEach((pair, i) => {
          console.log(`      ${i+1}. ID: ${pair.bankTransaction?.id?.slice(0,8)}... | Amount: ${pair.bankTransaction?.amount} | Status: ${pair.bankTransaction?.status_conciliacao}`);
        });
      }
    } else {
      console.log(`   ❌ Erro ${response2.status}: ${await response2.text()}`);
    }
  } catch (error) {
    console.log(`   💥 Erro de conexão: ${error.message}`);
  }
}

testAPIWithCheckbox().catch(console.error);
