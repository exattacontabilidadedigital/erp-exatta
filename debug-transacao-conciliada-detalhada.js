// Debug para verificar se transação conciliada tem matches na transaction_matches
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wpnovfvpczuhsxnzueal.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwbm92ZnZwY3p1aHN4bnp1ZWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ4NzE4MzIsImV4cCI6MjA0MDQ0NzgzMn0.9VHnNZOVeaFHpA42tTAcQwLeCdmOqTStCUW5_mxHcLs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTransacaoConciliada() {
  try {
    console.log('🔍 Verificando transações conciliadas...');
    
    // Buscar a transação conciliada de R$ 150,00 (valor negativo)
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('status_conciliacao', 'conciliado')
      .eq('amount', -150.00); // Valor negativo conforme imagem
    
    if (bankError) {
      console.error('❌ Erro ao buscar transações bancárias:', bankError);
      return;
    }
    
    console.log(`📦 Transações de R$ 150,00 conciliadas: ${bankTransactions?.length || 0}`);
    
    if (!bankTransactions || bankTransactions.length === 0) {
      console.log('⚠️ Transação de R$ 150,00 não encontrada, buscando todas...');
      
      const { data: allConciliated } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('status_conciliacao', 'conciliado')
        .limit(10);
      
      console.log('Todas transações conciliadas:', allConciliated);
      return;
    }
    
    const bankTxn = bankTransactions[0];
    console.log(`\n🔍 Analisando transação ${bankTxn.id}:`);
    console.log(`   Valor: R$ ${bankTxn.amount}`);
    console.log(`   Descrição: ${bankTxn.payee}`);
    console.log(`   Status: ${bankTxn.status_conciliacao}`);
    console.log(`   Matched Lançamento ID: ${bankTxn.matched_lancamento_id}`);
    
    // Verificar se tem matches na transaction_matches
    const { data: matches, error: matchesError } = await supabase
      .from('transaction_matches')
      .select(`
        *,
        lancamentos:system_transaction_id (
          id,
          descricao,
          valor,
          data_lancamento
        )
      `)
      .eq('bank_transaction_id', bankTxn.id);
    
    if (matchesError) {
      console.error('❌ Erro ao buscar matches:', matchesError);
    } else {
      console.log(`\n📋 Matches encontrados: ${matches?.length || 0}`);
      
      if (matches && matches.length > 0) {
        console.log('✅ TEM MÚLTIPLOS MATCHES! Detalhes:');
        let totalValue = 0;
        
        matches.forEach((match, index) => {
          const lancamento = match.lancamentos;
          if (lancamento) {
            console.log(`   Match ${index + 1}:`);
            console.log(`     Lançamento ID: ${lancamento.id}`);
            console.log(`     Descrição: ${lancamento.descricao}`);
            console.log(`     Valor: R$ ${lancamento.valor}`);
            console.log(`     Data: ${lancamento.data_lancamento}`);
            console.log(`     Is Primary: ${match.is_primary}`);
            console.log(`     Status: ${match.status}`);
            
            totalValue += Math.abs(lancamento.valor);
          }
        });
        
        console.log(`\n📊 RESUMO:`);
        console.log(`   Total de lançamentos: ${matches.length}`);
        console.log(`   Valor total: R$ ${totalValue}`);
        console.log(`   Deveria mostrar: "${matches.length} lançamentos selecionados"`);
        
      } else {
        console.log('⚠️ NÃO tem matches na transaction_matches');
        console.log('   Vai usar apenas o matched_lancamento_id');
        
        if (bankTxn.matched_lancamento_id) {
          const { data: lancamento } = await supabase
            .from('lancamentos')
            .select('*')
            .eq('id', bankTxn.matched_lancamento_id)
            .single();
          
          if (lancamento) {
            console.log(`   Lançamento único: ${lancamento.descricao} - R$ ${lancamento.valor}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugTransacaoConciliada();
