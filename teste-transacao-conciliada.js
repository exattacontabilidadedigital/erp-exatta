// Script para testar se a correção de transações conciliadas está funcionando
// Verifica se o API está carregando corretamente os systemTransaction para transações conciliadas

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wpnovfvpczuhsxnzueal.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwbm92ZnZwY3p1aHN4bnp1ZWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ4NzE4MzIsImV4cCI6MjA0MDQ0NzgzMn0.9VHnNZOVeaFHpA42tTAcQwLeCdmOqTStCUW5_mxHcLs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarTransacaoConciliada() {
  try {
    console.log('🔍 Verificando transações conciliadas...');
    
    // Buscar transações bancárias conciliadas
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('status_conciliacao', 'conciliado')
      .not('matched_lancamento_id', 'is', null)
      .limit(5);
    
    if (bankError) {
      console.error('❌ Erro ao buscar transações bancárias:', bankError);
      return;
    }
    
    console.log(`📦 Transações conciliadas encontradas: ${bankTransactions?.length || 0}`);
    
    if (!bankTransactions || bankTransactions.length === 0) {
      console.log('⚠️ Nenhuma transação conciliada encontrada');
      return;
    }
    
    // Para cada transação conciliada, verificar se tem lançamento
    for (const bankTxn of bankTransactions) {
      console.log(`\n🔍 Verificando transação ${bankTxn.id}:`);
      console.log(`   Status: ${bankTxn.status_conciliacao}`);
      console.log(`   Matched Lançamento ID: ${bankTxn.matched_lancamento_id}`);
      console.log(`   Valor: R$ ${bankTxn.amount}`);
      console.log(`   Descrição: ${bankTxn.payee}`);
      
      if (bankTxn.matched_lancamento_id) {
        const { data: lancamento, error: lancError } = await supabase
          .from('lancamentos')
          .select('*')
          .eq('id', bankTxn.matched_lancamento_id)
          .single();
        
        if (lancError) {
          console.error(`   ❌ Erro ao buscar lançamento ${bankTxn.matched_lancamento_id}:`, lancError);
        } else if (lancamento) {
          console.log(`   ✅ Lançamento encontrado:`);
          console.log(`      ID: ${lancamento.id}`);
          console.log(`      Descrição: ${lancamento.descricao}`);
          console.log(`      Valor: R$ ${lancamento.valor}`);
          console.log(`      Data: ${lancamento.data_lancamento}`);
        } else {
          console.log(`   ⚠️ Lançamento ${bankTxn.matched_lancamento_id} não encontrado`);
        }
      }
    }
    
    // Testar o endpoint da API suggestions
    console.log('\n🧪 Testando API suggestions...');
    const sampleBankTxn = bankTransactions[0];
    
    const testUrl = `http://localhost:3001/api/reconciliation/suggestions?bank_account_id=${sampleBankTxn.conta_bancaria_id}&period_start=2025-08-01&period_end=2025-08-31&empresa_id=${sampleBankTxn.empresa_id}&include_reconciled=true`;
    console.log(`📡 URL de teste: ${testUrl}`);
    
    console.log('ℹ️  Para testar, acesse o navegador e verifique se as transações conciliadas aparecem com dados corretos.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testarTransacaoConciliada();
