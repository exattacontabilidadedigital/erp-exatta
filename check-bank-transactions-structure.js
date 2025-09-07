// Script para verificar a estrutura da tabela bank_transactions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBankTransactionsStructure() {
  console.log('🔍 Verificando estrutura da tabela bank_transactions...');
  
  try {
    // Buscar algumas transações para ver a estrutura
    const { data: transactions, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return;
    }

    if (transactions && transactions.length > 0) {
      console.log('📊 Colunas disponíveis na tabela bank_transactions:');
      console.log(Object.keys(transactions[0]));
      
      console.log('\n📋 Estrutura da primeira transação:');
      console.log(JSON.stringify(transactions[0], null, 2));
    } else {
      console.log('⚠️ Nenhuma transação encontrada na tabela');
    }

    // Verificar se existe algum campo relacionado a lançamentos
    console.log('\n🔍 Verificando campos relacionados a lançamentos...');
    const { data: withMatches, error: matchError } = await supabase
      .from('transaction_matches')
      .select('*')
      .limit(1);

    if (matchError) {
      console.error('❌ Erro ao verificar transaction_matches:', matchError);
    } else if (withMatches && withMatches.length > 0) {
      console.log('📊 Colunas disponíveis na tabela transaction_matches:');
      console.log(Object.keys(withMatches[0]));
      
      console.log('\n📋 Estrutura do primeiro match:');
      console.log(JSON.stringify(withMatches[0], null, 2));
    } else {
      console.log('⚠️ Nenhum match encontrado na tabela transaction_matches');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkBankTransactionsStructure();
