async function debugMultipleTransactions() {
    try {
        console.log('=== DEBUG: Verificando transações com múltiplos matches ===');
        
        const response = await fetch('http://localhost:3000/api/conciliation/list');
        const data = await response.json();
        
        console.log('Total de transações bancárias:', data.bankTransactions?.length || 0);
        console.log('Total de transações do sistema:', data.systemTransactions?.length || 0);
        
        // Verificar transações bancárias com múltiplos matches
        if (data.bankTransactions) {
            const multipleMatches = data.bankTransactions.filter(bt => 
                bt.systemTransactions && bt.systemTransactions.length > 1
            );
            
            console.log('\n=== Transações bancárias com múltiplos matches ===');
            console.log('Quantidade:', multipleMatches.length);
            
            multipleMatches.forEach((bt, index) => {
                console.log(`\nTransação bancária ${index + 1}:`);
                console.log('- ID:', bt.id);
                console.log('- Valor:', bt.valor);
                console.log('- Descrição:', bt.descricao);
                console.log('- Status de Reconciliação:', bt.reconciliation_status);
                console.log('- Múltiplas transações do sistema:', bt.systemTransactions.length);
                
                let somaTransacoesSistema = 0;
                bt.systemTransactions.forEach((st, stIndex) => {
                    console.log(`  Transação ${stIndex + 1}: ${st.valor} - ${st.descricao}`);
                    somaTransacoesSistema += parseFloat(st.valor);
                });
                
                console.log('- Soma das transações do sistema:', somaTransacoesSistema);
                console.log('- Diferença com valor bancário:', Math.abs(bt.valor - somaTransacoesSistema));
            });
        }
        
        // Se não temos múltiplos matches, vamos criar um cenário de teste
        if (!data.bankTransactions || 
            !data.bankTransactions.some(bt => bt.systemTransactions && bt.systemTransactions.length > 1)) {
            console.log('\n=== Não foram encontradas transações com múltiplos matches ===');
            console.log('Vamos verificar transações disponíveis para criar um cenário de teste...');
            
            // Procurar transações bancárias sem match
            const semMatch = data.bankTransactions?.filter(bt => 
                bt.reconciliation_status === 'sem_match'
            ) || [];
            
            // Procurar transações do sistema sem match
            const sistemasSemMatch = data.systemTransactions?.filter(st => 
                !st.status_conciliacao || st.status_conciliacao === 'pendente'
            ) || [];
            
            console.log('\nTransações bancárias sem match:', semMatch.length);
            console.log('Transações do sistema pendentes:', sistemasSemMatch.length);
            
            if (semMatch.length > 0 && sistemasSemMatch.length > 1) {
                console.log('\n=== Cenário para teste de múltiplos matches ===');
                console.log('Transação bancária disponível:');
                console.log('- ID:', semMatch[0].id);
                console.log('- Valor:', semMatch[0].valor);
                console.log('- Descrição:', semMatch[0].descricao);
                
                console.log('\nPrimeiras transações do sistema disponíveis:');
                sistemasSemMatch.slice(0, 3).forEach((st, index) => {
                    console.log(`- ${index + 1}: ${st.valor} - ${st.descricao} (ID: ${st.id})`);
                });
            }
        }
        
    } catch (error) {
        console.error('Erro ao debugar múltiplas transações:', error);
    }
}

// Executar o debug
debugMultipleTransactions();
