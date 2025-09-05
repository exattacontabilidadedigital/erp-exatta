/*
  DEBUG: Investigar problema na API de conciliação
*/

console.log(`
🔍 INVESTIGANDO ERRO NA API DE CONCILIAÇÃO

❌ ERRO ATUAL:
"Erro na API de conciliação: {}"

🎯 POSSÍVEIS CAUSAS:
1. API /api/reconciliation/conciliate não existe ou está mal configurada
2. IDs das transações não são válidos (não são UUIDs)
3. Headers ou payload da requisição incorretos
4. Constraint de banco bloqueando a operação
5. Transação já conciliada ou em uso

🔧 AÇÕES DE DEBUG:
1. Verificar se a API existe
2. Verificar logs detalhados da requisição
3. Testar payload específico
4. Verificar status das transações no banco

📋 PRÓXIMOS PASSOS:
- Criar debug detalhado da função handleAutoConciliate
- Adicionar logs mais específicos para identificar o problema exato
- Testar API isoladamente
`);

// Função de teste da API de conciliação
async function testConciliationAPI() {
  console.log('\n🧪 TESTANDO API DE CONCILIAÇÃO...');
  
  try {
    // 1. Testar se a API existe
    console.log('1️⃣ Testando se API existe...');
    const response = await fetch('/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: 'test-id',
        system_transaction_id: 'test-id-2',
        confidence_level: 'test',
        rule_applied: 'test'
      })
    });
    
    console.log('📡 Resposta da API:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.status === 404) {
      console.error('❌ API NÃO ENCONTRADA - /api/reconciliation/conciliate não existe');
      console.log('🔧 SOLUÇÃO: Verificar se o arquivo app/api/reconciliation/conciliate/route.ts existe');
      return;
    }
    
    const text = await response.text();
    console.log('📄 Resposta completa:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('📦 JSON parseado:', json);
    } catch (parseError) {
      console.log('⚠️ Resposta não é JSON válido');
    }
    
  } catch (error) {
    console.error('💥 Erro no teste da API:', error);
  }
}

// Executar teste se estivermos no browser
if (typeof window !== 'undefined') {
  testConciliationAPI();
}
