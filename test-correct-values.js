const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bddolekybquguzazahdt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZG9sZWt5YnF1Z3V6YXphaGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4OTM0MzEsImV4cCI6MjAzODQ2OTQzMX0.yO3Ny3iR7I-Jd-xkG8xoJUUokmWpQE0K8xQn6F8-CWo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorrectValues() {
    console.log('🧪 Testando valores corretos para as colunas...\n');
    
    // Testar reconciliation_status
    console.log('📊 Testando valores para reconciliation_status:');
    
    const validReconciliationStatus = ['sugerido', 'transferencia', 'sem_match'];
    
    for (const status of validReconciliationStatus) {
        try {
            const { data, error } = await supabase
                .from('bank_transactions')
                .select('id')
                .eq('reconciliation_status', status)
                .limit(1);
                
            if (error) {
                console.log(`❌ ${status}: ${error.message}`);
            } else {
                console.log(`✅ ${status}: OK (${data.length} registros)`);
            }
        } catch (err) {
            console.log(`❌ ${status}: ${err.message}`);
        }
    }
    
    console.log('\n📊 Testando valores para status_conciliacao:');
    
    const validStatusConciliacao = ['conciliado', 'ignorado', 'pendente'];
    
    for (const status of validStatusConciliacao) {
        try {
            const { data, error } = await supabase
                .from('bank_transactions')
                .select('id')
                .eq('status_conciliacao', status)
                .limit(1);
                
            if (error) {
                console.log(`❌ ${status}: ${error.message}`);
            } else {
                console.log(`✅ ${status}: OK (${data.length} registros)`);
            }
        } catch (err) {
            console.log(`❌ ${status}: ${err.message}`);
        }
    }
    
    // Teste de update real
    console.log('\n🔧 Testando update com valores corretos...');
    
    try {
        const { data: testTransaction } = await supabase
            .from('bank_transactions')
            .select('id, reconciliation_status, status_conciliacao')
            .limit(1);
            
        if (testTransaction && testTransaction.length > 0) {
            const originalId = testTransaction[0].id;
            const originalReconciliation = testTransaction[0].reconciliation_status;
            const originalStatus = testTransaction[0].status_conciliacao;
            
            console.log(`📝 Testando com transação ID: ${originalId}`);
            console.log(`   Original: reconciliation_status='${originalReconciliation}', status_conciliacao='${originalStatus}'`);
            
            // Teste 1: Update para conciliado
            const { error: updateError1 } = await supabase
                .from('bank_transactions')
                .update({
                    reconciliation_status: 'sugerido',
                    status_conciliacao: 'conciliado'
                })
                .eq('id', originalId);
                
            if (updateError1) {
                console.log(`❌ Erro ao atualizar para conciliado: ${updateError1.message}`);
            } else {
                console.log('✅ Update para conciliado: OK');
            }
            
            // Reverter para valores originais
            await supabase
                .from('bank_transactions')
                .update({
                    reconciliation_status: originalReconciliation,
                    status_conciliacao: originalStatus
                })
                .eq('id', originalId);
                
            console.log('🔄 Valores originais restaurados');
        }
    } catch (err) {
        console.log(`❌ Erro no teste: ${err.message}`);
    }
    
    console.log('\n✅ Teste de valores corretos concluído!');
}

testCorrectValues().catch(console.error);
