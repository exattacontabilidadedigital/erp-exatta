require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstrutura() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...');

    // Verificar transaction_matches
    console.log('\n📋 Estrutura da tabela transaction_matches:');
    const { data: matches, error: matchError } = await supabase
      .from('transaction_matches')
      .select('*')
      .limit(3);

    if (matchError) {
      console.error('Erro ao buscar matches:', matchError);
    } else {
      console.log('Total de matches:', matches.length);
      if (matches.length > 0) {
        console.log('Campos disponíveis:', Object.keys(matches[0]));
        console.log('Exemplo de match:', matches[0]);
      }
    }

    // Verificar como os dados estão organizados
    console.log('\n📋 Verificando transações bancárias com reconciliation_status:');
    const { data: bankWithStatus, error: bankStatusError } = await supabase
      .from('bank_transactions')
      .select('id, valor, descricao, reconciliation_status')
      .not('reconciliation_status', 'eq', 'sem_match')
      .limit(10);

    if (bankStatusError) {
      console.error('Erro ao buscar transações bancárias:', bankStatusError);
    } else {
      console.log('Transações bancárias conciliadas/transferências:', bankWithStatus.length);
      bankWithStatus.forEach(bt => {
        console.log(`- ID: ${bt.id}, Status: ${bt.reconciliation_status}, Valor: R$ ${bt.valor}`);
      });
    }

    // Verificar transações do sistema que estão conciliadas
    console.log('\n📋 Verificando transações do sistema conciliadas:');
    const { data: systemConciliated, error: systemError } = await supabase
      .from('system_transactions')
      .select('id, valor, descricao, status_conciliacao')
      .eq('status_conciliacao', 'conciliado')
      .limit(10);

    if (systemError) {
      console.error('Erro ao buscar transações do sistema:', systemError);
    } else {
      console.log('Transações do sistema conciliadas:', systemConciliated.length);
      systemConciliated.forEach(st => {
        console.log(`- ID: ${st.id}, Valor: R$ ${st.valor}, Descrição: ${st.descricao}`);
      });
    }

  } catch (error) {
    console.error('Erro durante verificação:', error);
  }
}

verificarEstrutura();
