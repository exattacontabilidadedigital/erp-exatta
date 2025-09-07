// Script para testar estrutura das tabelas
const testTables = async () => {
  console.log('🔍 Testando estrutura das tabelas...');
  
  try {
    // Testar transaction_matches
    console.log('1️⃣ Testando transaction_matches...');
    const matchesResponse = await fetch('/api/test-table-structure?table=transaction_matches');
    const matchesData = await matchesResponse.json();
    console.log('📊 transaction_matches:', matchesData);
    
    // Testar bank_transactions
    console.log('2️⃣ Testando bank_transactions...');
    const bankResponse = await fetch('/api/test-table-structure?table=bank_transactions');
    const bankData = await bankResponse.json();
    console.log('📊 bank_transactions:', bankData);
    
    // Testar JOIN
    console.log('3️⃣ Testando JOIN...');
    const joinResponse = await fetch('/api/test-table-structure?test=join');
    const joinData = await joinResponse.json();
    console.log('🔗 JOIN test:', joinData);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Testar a API atual
const testCurrentAPI = async () => {
  console.log('🧪 Testando API atual...');
  
  try {
    // Usar um ID qualquer para teste
    const testId = 'test-id-123';
    const response = await fetch(`/api/reconciliation/check-lancamento-usage/${testId}`);
    const data = await response.json();
    
    console.log('📡 Resposta da API:', {
      status: response.status,
      ok: response.ok,
      data
    });
    
  } catch (error) {
    console.error('❌ Erro no teste da API:', error);
  }
};

console.log('🚀 Scripts de teste carregados!');
console.log('📋 Execute:');
console.log('  testTables() - Para testar estrutura das tabelas');
console.log('  testCurrentAPI() - Para testar API atual');
