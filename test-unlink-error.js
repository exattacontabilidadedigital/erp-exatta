// Teste específico para validar o tratamento de erro no unlink

async function testUnlinkErrors() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testando diferentes cenários de erro no unlink...\n');
  
  // Teste 1: ID inexistente (404)
  console.log('📝 Teste 1: ID de transação inexistente');
  try {
    const response = await fetch(`${baseUrl}/api/reconciliation/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: '550e8400-e29b-41d4-a716-446655440001' // ID inexistente
      })
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('💥 Resposta de erro:', errorData);
    } else {
      const result = await response.json();
      console.log('✅ Sucesso:', result);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 2: ID válido existente
  console.log('📝 Teste 2: ID de transação válida existente');
  try {
    const response = await fetch(`${baseUrl}/api/reconciliation/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: 'd157b8a0-4e26-4cc7-81fe-90f6b53bcf7a' // ID real
      })
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('💥 Resposta de erro:', errorData);
    } else {
      const result = await response.json();
      console.log('✅ Sucesso:', result);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 3: Requisição malformada (400)
  console.log('📝 Teste 3: Requisição sem bank_transaction_id');
  try {
    const response = await fetch(`${baseUrl}/api/reconciliation/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Sem o campo obrigatório
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('💥 Resposta de erro:', errorData);
    } else {
      const result = await response.json();
      console.log('✅ Sucesso:', result);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testUnlinkErrors().catch(console.error);
