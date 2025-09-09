/**
 * DEBUG ESPECÍFICO: Card verde sem dados após conciliação
 * 
 * Vai investigar especificamente uma transação que está conciliada
 * para ver se tem systemTransaction preenchido
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcpgfkxwdezshqczmbkr.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcGdma3h3ZGV6c2hxY3ptYmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NTkwMzQsImV4cCI6MjA1MjAzNTAzNH0.zokPwm6l4nrwZhMRBR0-2NXMZjKqrP0lWUW2NNk0U1k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCardSemDados() {
    console.log('🔍 DEBUG: Card verde sem dados após conciliação\n');

    try {
        // 1. Buscar transações que estão marcadas como conciliadas
        console.log('1. BUSCANDO TRANSAÇÕES CONCILIADAS...');
        const { data: conciliadasTransactions, error: conciliadasError } = await supabase
            .from('bank_transactions')
            .select('*')
            .eq('status_conciliacao', 'conciliado')
            .limit(5)
            .order('created_at', { ascending: false });

        if (conciliadasError) {
            console.error('❌ Erro ao buscar transações conciliadas:', conciliadasError);
            return;
        }

        console.log(`✅ Encontradas ${conciliadasTransactions.length} transações conciliadas`);

        if (conciliadasTransactions.length === 0) {
            console.log('ℹ️ Nenhuma transação conciliada encontrada. Vou buscar pendentes com matches...');
            
            // Buscar transações pendentes que têm matches (podem estar sendo exibidas como verdes)
            const { data: pendentesComMatches, error: pendentesError } = await supabase
                .from('bank_transactions')
                .select('*')
                .eq('status_conciliacao', 'pendente')
                .not('reconciliation_status', 'eq', 'sem_match')
                .limit(3);

            if (!pendentesError && pendentesComMatches.length > 0) {
                console.log(`📋 Encontradas ${pendentesComMatches.length} transações pendentes com matches:`);
                pendentesComMatches.forEach(txn => {
                    console.log(`   - ${txn.id}: ${txn.reconciliation_status} (${txn.memo})`);
                });
                
                // Usar essas para debug
                await debugTransacao(pendentesComMatches[0]);
            }
            return;
        }

        // 2. Para primeira transação conciliada, verificar matches
        await debugTransacao(conciliadasTransactions[0]);

    } catch (error) {
        console.error('❌ Erro durante debug:', error);
    }
}

async function debugTransacao(bankTxn) {
    console.log(`\n2. ANALISANDO TRANSAÇÃO: ${bankTxn.id}`);
    console.log('📊 Dados da transação bancária:', {
        id: bankTxn.id,
        amount: bankTxn.amount,
        memo: bankTxn.memo,
        status_conciliacao: bankTxn.status_conciliacao,
        reconciliation_status: bankTxn.reconciliation_status,
        match_count: bankTxn.match_count,
        primary_lancamento_id: bankTxn.primary_lancamento_id
    });

    // 3. Buscar matches desta transação
    const { data: matches, error: matchError } = await supabase
        .from('transaction_matches')
        .select(`
            *,
            lancamentos:system_transaction_id (
                id, data_lancamento, descricao, valor, tipo
            )
        `)
        .eq('bank_transaction_id', bankTxn.id);

    if (matchError) {
        console.error('❌ Erro ao buscar matches:', matchError);
        return;
    }

    console.log(`📋 Matches encontrados: ${matches?.length || 0}`);
    
    if (matches && matches.length > 0) {
        console.log('🎯 DETALHES DOS MATCHES:');
        matches.forEach((match, idx) => {
            console.log(`   ${idx + 1}. Match: ${match.id}`);
            console.log(`      - Status: ${match.status}`);
            console.log(`      - É primário: ${match.is_primary}`);
            console.log(`      - Lançamento:`, match.lancamentos);
        });

        // 4. Simular como a API suggestions processaria isso
        console.log('\n3. SIMULANDO PROCESSAMENTO DA API SUGGESTIONS...');
        
        // Encontrar match primário
        const primaryMatch = matches.find(m => m.is_primary) || matches[0];
        const allMatchedLancamentos = matches
            .filter(m => m.lancamentos)
            .map(m => m.lancamentos)
            .sort((a, b) => new Date(b.data_lancamento).getTime() - new Date(a.data_lancamento).getTime());

        if (allMatchedLancamentos.length > 0) {
            const totalValue = allMatchedLancamentos.reduce((sum, lanc) => sum + Math.abs(lanc.valor), 0);
            const primaryLancamento = allMatchedLancamentos.find(l => l.id === primaryMatch.system_transaction_id) || allMatchedLancamentos[0];

            const systemTransactionAgregado = {
                ...primaryLancamento,
                valor: totalValue,
                descricao: allMatchedLancamentos.length > 1 
                    ? `${allMatchedLancamentos.length} lançamentos selecionados`
                    : primaryLancamento.descricao
            };

            console.log('✅ SYSTEMTRANSACTION QUE DEVERIA SER CRIADO:', systemTransactionAgregado);
            console.log('✅ SYSTEMTRANSACTIONS ARRAY:', allMatchedLancamentos.map(l => ({
                id: l.id,
                descricao: l.descricao,
                valor: l.valor
            })));

            // 5. Verificar status que seria aplicado
            const matchStatus = primaryMatch.status || 'suggested';
            let finalStatus = 'sem_match';
            
            if (bankTxn.status_conciliacao === 'conciliado') {
                finalStatus = 'conciliado';
            } else if (bankTxn.status_conciliacao === 'pendente') {
                switch (bankTxn.reconciliation_status) {
                    case 'transferencia':
                        finalStatus = 'transferencia';
                        break;
                    case 'sugerido':
                        finalStatus = 'sugerido';
                        break;
                    default:
                        finalStatus = 'sem_match';
                        break;
                }
            }

            console.log('🎯 STATUS FINAL QUE SERIA APLICADO:', {
                bankStatus: bankTxn.status_conciliacao,
                reconciliationStatus: bankTxn.reconciliation_status,
                finalStatus,
                shouldShowData: finalStatus !== 'sem_match'
            });

            console.log('\n4. DIAGNÓSTICO:');
            if (finalStatus === 'conciliado' && systemTransactionAgregado) {
                console.log('✅ TUDO CORRETO: Status conciliado com systemTransaction preenchido');
                console.log('❌ PROBLEMA: Alguma coisa no frontend não está processando isso corretamente');
                console.log('💡 VERIFICAR: Se a API suggestions está realmente retornando esses dados');
            } else {
                console.log('❌ PROBLEMA IDENTIFICADO: Status ou systemTransaction incorretos');
            }

        } else {
            console.log('❌ PROBLEMA: Nenhum lançamento válido encontrado nos matches');
        }

    } else {
        console.log('❌ PROBLEMA: Transação marcada como conciliada mas sem matches na tabela transaction_matches');
    }
}

// Executar debug
debugCardSemDados().then(() => {
    console.log('\n✅ Debug específico concluído');
    process.exit(0);
}).catch(error => {
    console.error('❌ Erro no debug específico:', error);
    process.exit(1);
});
