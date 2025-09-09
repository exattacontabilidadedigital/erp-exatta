const API_URL = 'http://localhost:3001/api/reconciliation/conciliate';

async function testCorrectAPI() {
    console.log('🧪 Testando API com valores corretos das constraints...\n');
    
    // Teste 1: Conciliação normal
    console.log('📝 Teste 1: Conciliação com valores corretos');
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bank_transaction_id: 123,
                system_transaction_id: 456,
                confidence_level: 'high',
                rule_applied: 'exact_match'
            })
        });
        
        const result = await response.json();
        console.log(`Status: ${response.status}`);
        console.log('Resposta:', JSON.stringify(result, null, 2));
        
        if (response.status === 200) {
            console.log('✅ API funcionando com valores corretos!');
        } else {
            console.log('❌ Erro na API:', result.error);
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Teste 2: Marcar como sem match
    console.log('📝 Teste 2: Marcando como sem correspondência');
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bank_transaction_id: 124,
                system_transaction_id: null, // Sem correspondência
                confidence_level: 'manual',
                rule_applied: 'no_match'
            })
        });
        
        const result = await response.json();
        console.log(`Status: ${response.status}`);
        console.log('Resposta:', JSON.stringify(result, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Marcação sem match funcionando!');
        } else {
            console.log('❌ Erro na marcação sem match:', result.error);
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
    }
}

testCorrectAPI().catch(console.error);
