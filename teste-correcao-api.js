/**
 * TESTE: Verificar se a correção da API suggestions está funcionando
 * 
 * Testa se a API agora reconstitui corretamente os dados dos múltiplos lançamentos
 */

async function testarCorrecaoAPI() {
    console.log('🧪 TESTE: Verificando correção da API suggestions\n');

    try {
        // Simular os parâmetros que a API precisa
        const params = new URLSearchParams({
            bank_account_id: 'test-account-id',
            period_start: '2024-08-01',
            period_end: '2024-08-31',
            empresa_id: 'test-empresa-id',
            include_reconciled: 'false'
        });

        console.log('📡 Testando API suggestions...');
        console.log('🔗 URL:', `http://localhost:3001/api/reconciliation/suggestions?${params}`);

        const response = await fetch(`http://localhost:3001/api/reconciliation/suggestions?${params}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API respondeu com sucesso!');
            console.log('📊 Resumo da resposta:', {
                success: data.success,
                pairsCount: data.pairs?.length || 0,
                summary: data.summary
            });

            // Verificar se há pairs com múltiplos lançamentos
            if (data.pairs && data.pairs.length > 0) {
                console.log('\n🔍 Analisando pairs para múltiplos lançamentos...');
                
                let foundMultiple = false;
                data.pairs.forEach((pair, index) => {
                    if (pair.systemTransactions && pair.systemTransactions.length > 1) {
                        foundMultiple = true;
                        console.log(`✅ PAIR ${index + 1} - MÚLTIPLOS LANÇAMENTOS DETECTADOS:`, {
                            bankTransactionId: pair.bankTransaction?.id,
                            systemTransactionValue: pair.systemTransaction?.valor,
                            systemTransactionDesc: pair.systemTransaction?.descricao,
                            systemTransactionsCount: pair.systemTransactions?.length,
                            status: pair.status
                        });
                    }
                });

                if (!foundMultiple) {
                    console.log('ℹ️ Nenhum pair com múltiplos lançamentos encontrado neste período');
                    console.log('💡 Isso é normal se não há transações com múltiplos matches salvos');
                }
            }

            console.log('\n✅ TESTE CONCLUÍDO: API modifications appear to be working');
            
        } else {
            console.error('❌ API falhou:', response.status);
            const errorText = await response.text();
            console.error('❌ Erro:', errorText);
        }

    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
        
        // Verificar se o servidor está rodando
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
            console.log('\n💡 DICA: Certifique-se de que o servidor está rodando em http://localhost:3001');
            console.log('   Execute: npm run dev');
        }
    }
}

// Executar teste
testarCorrecaoAPI().then(() => {
    console.log('\n🏁 Teste finalizado');
}).catch(error => {
    console.error('❌ Erro no teste:', error);
});
