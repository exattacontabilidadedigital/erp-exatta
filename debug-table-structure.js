// Script para verificar estrutura da tabela bank_transactions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verificando configuração...');
console.log('URL:', supabaseUrl ? 'OK' : 'MISSING');
console.log('KEY:', supabaseKey ? 'OK' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('\n1️⃣ Verificando estrutura da tabela bank_transactions...');
    
    // Primeiro, tentar uma consulta simples
    const { data: sample, error: sampleError } = await supabase
      .from('bank_transactions')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Erro ao consultar bank_transactions:', sampleError);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('✅ Tabela bank_transactions encontrada');
      console.log('📋 Colunas disponíveis:', Object.keys(sample[0]));
      console.log('📊 Amostra de dados:', sample[0]);
      
      // Verificar se existe coluna metadata
      const hasMetadata = 'metadata' in sample[0];
      console.log('🔍 Coluna metadata existe?', hasMetadata);
      
      if (!hasMetadata) {
        console.log('\n2️⃣ Verificando tabela transaction_matches...');
        
        const { data: matches, error: matchError } = await supabase
          .from('transaction_matches')
          .select('*')
          .limit(1);
        
        if (matchError) {
          console.error('❌ Erro ao consultar transaction_matches:', matchError);
        } else if (matches && matches.length > 0) {
          console.log('✅ Tabela transaction_matches encontrada');
          console.log('📋 Colunas disponíveis:', Object.keys(matches[0]));
          console.log('📊 Amostra de dados:', matches[0]);
        } else {
          console.log('ℹ️ Tabela transaction_matches vazia');
        }
      }
    } else {
      console.log('ℹ️ Tabela bank_transactions vazia');
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkTableStructure();
