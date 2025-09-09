const API_URL = 'http://localhost:3000/api/reconciliation/suggestions';

async function debugMultipleMatches() {
    console.log('🔍 Debugando múltiplos matches...\n');
    
    try {
        const response = await fetch(`${API_URL}?bank_account_id=4fd86770-32c4-4927-9d7e-8f3ded7b38fa&period_start=2025-08-01&period_end=2025-08-31&empresa_id=3cdbb91a-29cd-4a02-8bf8-f09fa1df439d&include_reconciled=false`);
        
        if (!response.ok) {
            console.log('❌ Erro na API:', response.status, response.statusText);
            return;
        }
        
        const data = await response.json();
        console.log('📦 Total de pairs retornados:', data.pairs?.length || 0);
        
        // Buscar pairs com múltiplos lançamentos
        const pairsWithMultiple = data.pairs?.filter(pair => 
            pair.systemTransactions && pair.systemTransactions.length > 1
        ) || [];
        
        console.log('\n🔍 Pairs com múltiplos lançamentos:', pairsWithMultiple.length);
        
        pairsWithMultiple.forEach((pair, index) => {
            console.log(`\n📋 Pair ${index + 1}:`);
            console.log('  Bank Transaction:');
            console.log(`    ID: ${pair.bankTransaction?.id}`);
            console.log(`    Valor: R$ ${pair.bankTransaction?.amount}`);
            console.log(`    Payee: ${pair.bankTransaction?.payee}`);
            
            console.log('  System Transaction (agregado):');
            console.log(`    Valor: R$ ${pair.systemTransaction?.valor}`);
            console.log(`    Descrição: ${pair.systemTransaction?.descricao}`);
            
            console.log('  System Transactions (individuais):');
            pair.systemTransactions.forEach((tx, txIndex) => {
                console.log(`    ${txIndex + 1}. R$ ${Math.abs(tx.valor)} - ${tx.descricao}`);
            });
            
            const totalCalculado = pair.systemTransactions.reduce((sum, tx) => sum + Math.abs(tx.valor), 0);
            console.log(`  Total calculado: R$ ${totalCalculado}`);
            console.log(`  Valor do systemTransaction: R$ ${pair.systemTransaction?.valor}`);
            console.log(`  ✅ Valores coincidem: ${totalCalculado === pair.systemTransaction?.valor ? 'SIM' : 'NÃO'}`);
        });
        
        // Buscar pairs conciliados
        const conciliatedPairs = data.pairs?.filter(pair => 
            pair.status === 'conciliado' && pair.systemTransaction
        ) || [];
        
        console.log(`\n🎯 Pairs conciliados: ${conciliatedPairs.length}`);
        
        conciliatedPairs.forEach((pair, index) => {
            console.log(`\n✅ Pair conciliado ${index + 1}:`);
            console.log('  Bank Transaction:');
            console.log(`    ID: ${pair.bankTransaction?.id}`);
            console.log(`    Valor: R$ ${pair.bankTransaction?.amount}`);
            console.log(`    Status: ${pair.bankTransaction?.status_conciliacao}`);
            
            console.log('  System Transaction:');
            console.log(`    Valor: R$ ${pair.systemTransaction?.valor}`);
            console.log(`    Descrição: ${pair.systemTransaction?.descricao}`);
            
            if (pair.systemTransactions && pair.systemTransactions.length > 0) {
                console.log('  System Transactions individuais:');
                pair.systemTransactions.forEach((tx, txIndex) => {
                    console.log(`    ${txIndex + 1}. R$ ${Math.abs(tx.valor)} - ${tx.descricao}`);
                });
                
                const totalCalculado = pair.systemTransactions.reduce((sum, tx) => sum + Math.abs(tx.valor), 0);
                console.log(`  Total calculado: R$ ${totalCalculado}`);
                console.log(`  ✅ Múltiplos lançamentos: ${pair.systemTransactions.length > 1 ? 'SIM' : 'NÃO'}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

debugMultipleMatches().catch(console.error);
