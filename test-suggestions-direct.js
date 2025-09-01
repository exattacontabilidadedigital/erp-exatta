// Teste direto da API de sugestões
async function testSuggestionsAPI() {
  const baseUrl = 'http://localhost:3001';
  const accountId = '8ad0f3fb-88cc-4f39-8d50-f47efb3a5486';
  const empresaId = '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d';
  
  console.log('🧪 Testando API de sugestões com dados reais...\n');
  
  const url = `${baseUrl}/api/reconciliation/suggestions?` + 
              `bank_account_id=${accountId}&` +
              `period_start=2025-01-01&` +
              `period_end=2025-01-31&` +
              `empresa_id=${empresaId}&` +
              `include_reconciled=false`;
  
  console.log('📡 URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('📊 Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta:', {
        total: data.suggestions?.length || 0,
        summary: data.summary,
        sampleSuggestion: data.suggestions?.[0]
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Erro:', errorText);
    }
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
}

testSuggestionsAPI().catch(console.error);
