/**
 * DEBUG: Investigar problema do card perdendo dados após conciliação/reload
 * 
 * O problema reportado:
 * 1. ANTES de clicar conciliar: Card exibe dados corretamente (data, valor, "3 lançamentos selecionados", ícone olho)
 * 2. APÓS clicar conciliar: Card fica verde mas perde todos os dados
 * 3. APÓS reload sem conciliar: Perde cor laranja e dados
 * 
 * Hipóteses:
 * 1. API /reconciliation/suggestions não está retornando dados completos para múltiplos matches
 * 2. Lógica do frontend não está reconstituindo corretamente os dados dos múltiplos lançamentos
 * 3. Status reconciliation_status não está sendo atualizado corretamente no banco
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcpgfkxwdezshqczmbkr.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcGdma3h3ZGV6c2hxY3ptYmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NTkwMzQsImV4cCI6MjA1MjAzNTAzNH0.zokPwm6l4nrwZhMRBR0-2NXMZjKqrP0lWUW2NNk0U1k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCardDisplayIssue() {
    console.log('🔍 DEBUG: Investigando problema do card perdendo dados\n');

    try {
        // 1. Buscar uma transação bancária que deveria ter múltiplos matches
        console.log('1. BUSCANDO TRANSAÇÕES BANCÁRIAS COM MÚLTIPLOS MATCHES...');
        const { data: bankTransactions, error: bankError } = await supabase
            .from('bank_transactions')
            .select('*')
            .eq('reconciliation_status', 'sugerido')
            .limit(10)
            .order('created_at', { ascending: false });

        if (bankError) {
            console.error('❌ Erro ao buscar transações bancárias:', bankError);
            return;
        }

        console.log(`✅ Encontradas ${bankTransactions.length} transações com status 'sugerido'`);
        
        if (bankTransactions.length === 0) {
            console.log('ℹ️ Nenhuma transação com status sugerido encontrada. Verificando todas...');
            
            const { data: allBankTxns } = await supabase
                .from('bank_transactions')
                .select('id, reconciliation_status, status_conciliacao, memo, amount')
                .limit(5);
                
            console.log('📊 Sample de transações bancárias:', allBankTxns);
            return;
        }

        // 2. Para cada transação, verificar se tem matches múltiplos
        for (let i = 0; i < Math.min(3, bankTransactions.length); i++) {
            const bankTxn = bankTransactions[i];
            console.log(`\n2.${i+1} ANALISANDO TRANSAÇÃO BANCÁRIA: ${bankTxn.id}`);
            console.log('📊 Dados da transação:', {
                id: bankTxn.id,
                amount: bankTxn.amount,
                memo: bankTxn.memo,
                posted_at: bankTxn.posted_at,
                reconciliation_status: bankTxn.reconciliation_status,
                status_conciliacao: bankTxn.status_conciliacao,
                match_count: bankTxn.match_count,
                primary_lancamento_id: bankTxn.primary_lancamento_id
            });

            // Buscar matches desta transação
            const { data: matches, error: matchError } = await supabase
                .from('transaction_matches')
                .select(`
                    *,
                    lancamentos:system_transaction_id (
                        id,
                        data_lancamento,
                        descricao,
                        valor,
                        tipo
                    )
                `)
                .eq('bank_transaction_id', bankTxn.id)
                .order('match_order', { ascending: true });

            if (matchError) {
                console.error(`❌ Erro ao buscar matches:`, matchError);
                continue;
            }

            console.log(`📋 Matches encontrados: ${matches?.length || 0}`);
            
            if (matches && matches.length > 0) {
                console.log('🎯 MÚLTIPLOS MATCHES ENCONTRADOS:');
                matches.forEach((match, idx) => {
                    console.log(`   ${idx + 1}. Match ID: ${match.id}`);
                    console.log(`      - Lançamento: ${match.system_transaction_id}`);
                    console.log(`      - É primário: ${match.is_primary}`);
                    console.log(`      - Ordem: ${match.match_order}`);
                    console.log(`      - Valor: ${match.system_amount}`);
                    console.log(`      - Lançamento dados:`, match.lancamentos);
                });

                // 3. Simular chamada da API get-multiple-matches
                console.log('\n3. SIMULANDO CHAMADA GET-MULTIPLE-MATCHES...');
                const response = await fetch(`http://localhost:3000/api/conciliacao/get-multiple-matches?bankTransactionId=${bankTxn.id}`);
                
                if (response.ok) {
                    const apiResult = await response.json();
                    console.log('✅ API get-multiple-matches respondeu:', {
                        success: apiResult.success,
                        matchesCount: apiResult.data?.matches?.length || 0,
                        hasMultipleMatches: apiResult.data?.hasMultipleMatches,
                        totalAmount: apiResult.data?.totalAmount,
                        primaryLancamento: apiResult.data?.organized?.primaryLancamento?.id
                    });

                    if (apiResult.data?.organized?.allLancamentos) {
                        console.log('📦 Lançamentos organizados pela API:');
                        apiResult.data.organized.allLancamentos.forEach((lanc, idx) => {
                            console.log(`   ${idx + 1}. ${lanc.id} - ${lanc.descricao} - R$ ${lanc.valor}`);
                        });
                    }
                } else {
                    console.error('❌ API get-multiple-matches falhou:', response.status, await response.text());
                }

                // 4. Simular como os dados apareceriam na API suggestions
                console.log('\n4. VERIFICANDO COMO APARECE NA API SUGGESTIONS...');
                console.log('🔍 PROBLEMA IDENTIFICADO:');
                console.log('   A API suggestions provavelmente não está incluindo os múltiplos lançamentos');
                console.log('   quando reconstitui os dados dos matches existentes.');
                console.log('   Isso causaria o card aparecer verde mas sem dados detalhados.');

                break; // Analisar apenas a primeira transação com matches
            } else {
                console.log('ℹ️ Nenhum match encontrado para esta transação');
            }
        }

        // 5. Verificar qual é o problema na API suggestions
        console.log('\n5. DIAGNÓSTICO DO PROBLEMA:');
        console.log('🔍 A API /api/reconciliation/suggestions precisa:');
        console.log('   1. Quando encontrar matches existentes, carregar TODOS os lançamentos do grupo');
        console.log('   2. Criar um systemTransaction agregado com valor total e descrição "X lançamentos selecionados"');
        console.log('   3. Incluir systemTransactions array com todos os lançamentos individuais');
        console.log('   4. Manter status correto (sugerido/conciliado) baseado no reconciliation_status');

        console.log('\n6. SOLUÇÃO PROPOSTA:');
        console.log('   Modificar a API suggestions para reconstituir corretamente os dados dos múltiplos matches');

    } catch (error) {
        console.error('❌ Erro durante debug:', error);
    }
}

// Executar debug
debugCardDisplayIssue().then(() => {
    console.log('\n✅ Debug concluído');
    process.exit(0);
}).catch(error => {
    console.error('❌ Erro no debug:', error);
    process.exit(1);
});
