import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testConciliateAPI() {
  console.log('🧪 Testando API de conciliação...');
  
  const bankTransactionId = '7dcd0cc7-3ec3-475c-8347-5dc02ad43413';
  const systemTransactionId = 'c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc';
  
  try {
    console.log('📤 Enviando requisição para API...');
    const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: bankTransactionId,
        system_transaction_id: systemTransactionId,
        confidence_level: 'high',
        rule_applied: 'test_fix'
      })
    });

    console.log(`📋 Status da resposta: ${response.status}`);
    
    const result = await response.json();
    console.log('📊 Resultado:', result);
    
    if (response.ok) {
      console.log('✅ API funcionou corretamente!');
    } else {
      console.log('❌ Erro na API:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
}

testConciliateAPI().catch(console.error);
