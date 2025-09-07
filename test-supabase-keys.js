// Teste das chaves do Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando variáveis de ambiente:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Definida' : '❌ Não definida');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Definida' : '❌ Não definida');

console.log('\n🧪 Testando conexão com Supabase...');

const testConnection = async () => {
  try {
    // Teste com anon key
    console.log('\n1. Testando com ANON KEY:');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('lancamentos')
      .select('count')
      .limit(1);
    
    if (anonError) {
      console.log('❌ Erro com anon key:', anonError.message);
    } else {
      console.log('✅ Anon key funcionando');
    }

    // Teste com service role key
    console.log('\n2. Testando com SERVICE ROLE KEY:');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { data: serviceTest, error: serviceError } = await supabaseService
      .from('lancamentos')
      .select('count')
      .limit(1);
    
    if (serviceError) {
      console.log('❌ Erro com service role key:', serviceError.message);
    } else {
      console.log('✅ Service role key funcionando');
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
};

testConnection();
