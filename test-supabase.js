// Teste direto das credenciais Supabase
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testando credenciais Supabase...');

// Carregando manualmente as variáveis do .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? `✅ ${supabaseUrl}` : '❌ INDEFINIDA');
console.log('Key:', supabaseKey ? `✅ ${supabaseKey.substring(0, 20)}...` : '❌ INDEFINIDA');

if (supabaseUrl && supabaseKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste simples - listar tabelas
    supabase
      .from('bank_transactions')
      .select('count')
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Erro Supabase:', error.message);
        } else {
          console.log('✅ Conexão Supabase OK');
        }
      });
      
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error.message);
  }
} else {
  console.error('❌ Credenciais não encontradas');
}
