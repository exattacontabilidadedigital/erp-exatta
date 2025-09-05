// Teste para verificar se o botão "Ignorar" está funcionando
// Execute este comando no console do navegador após clicar em "Ignorar"

console.log('🧪 Teste do Botão Ignorar');

// 1. Verificar se a API foi chamada corretamente
// (Verificar no Network tab se foi feita a requisição para /api/reconciliation/ignore)

// 2. Verificar se o banco foi atualizado
// (Executar no Supabase ou verificar logs da API)

// 3. Verificar se o frontend foi atualizado
// (Verificar se o card desapareceu ou mudou de cor)

// Função para testar uma transação ignorada
async function testIgnoreTransaction(bankTransactionId) {
    try {
        console.log('🚫 Testando ignorar transação:', bankTransactionId);
        
        const response = await fetch('/api/reconciliation/ignore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bank_transaction_id: bankTransactionId,
                reason: 'teste_manual'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Erro na API:', error);
            return;
        }
        
        const result = await response.json();
        console.log('✅ Transação ignorada com sucesso:', result);
        
        // Verificar se foi realmente atualizada no banco
        console.log('📊 Verifique no banco se foi atualizada:');
        console.log('  - reconciliation_status = "ignored"');
        console.log('  - status_conciliacao = "ignorado"');
        console.log('  - matched_lancamento_id = null');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Para usar: testIgnoreTransaction('seu-bank-transaction-id-aqui')
console.log('Para testar, execute: testIgnoreTransaction("bank-transaction-id")');
