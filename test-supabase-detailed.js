// Teste detalhado das credenciais Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Análise detalhada das credenciais Supabase...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n📋 Credenciais encontradas:');
console.log('URL:', supabaseUrl);
console.log('Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 50)}...` : 'INDEFINIDA');
console.log('Anon Key:', anonKey ? `${anonKey.substring(0, 50)}...` : 'INDEFINIDA');

// Teste com Service Role Key
console.log('\n🔑 Testando Service Role Key...');
if (supabaseUrl && serviceRoleKey) {
  try {
    const supabaseService = createClient(supabaseUrl, serviceRoleKey);
    
    console.log('Cliente Supabase criado com Service Role Key');
    
    // Teste básico de conectividade
    supabaseService
      .from('bank_transactions')
      .select('*')
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Erro com Service Role Key:', error);
        } else {
          console.log('✅ Service Role Key funcionando:', data?.length || 0, 'registros encontrados');
        }
        
        // Teste com Anon Key
        console.log('\n🔓 Testando Anon Key...');
        const supabaseAnon = createClient(supabaseUrl, anonKey);
        
        return supabaseAnon
          .from('bank_transactions')
          .select('*')
          .limit(1);
      })
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Erro com Anon Key:', error);
        } else {
          console.log('✅ Anon Key funcionando:', data?.length || 0, 'registros encontrados');
        }
      })
      .catch(err => {
        console.error('❌ Erro geral:', err);
      });
      
  } catch (error) {
    console.error('❌ Erro ao criar cliente Service Role:', error.message);
  }
} else {
  console.error('❌ URL ou Service Role Key não encontrados');
}

// Verificar se a URL está correta
console.log('\n🌐 Verificando formato da URL...');
if (supabaseUrl) {
  const urlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/;
  const isValidFormat = urlPattern.test(supabaseUrl);
  console.log('Formato da URL válido:', isValidFormat ? '✅' : '❌');
  
  if (!isValidFormat) {
    console.log('⚠️ URL deveria estar no formato: https://PROJETO.supabase.co');
  }
}

// Verificar se as keys estão no formato JWT correto
console.log('\n🔐 Verificando formato das chaves...');
const jwtPattern = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;

if (serviceRoleKey) {
  const isValidServiceKey = jwtPattern.test(serviceRoleKey);
  console.log('Service Role Key formato JWT:', isValidServiceKey ? '✅' : '❌');
}

if (anonKey) {
  const isValidAnonKey = jwtPattern.test(anonKey);
  console.log('Anon Key formato JWT:', isValidAnonKey ? '✅' : '❌');
}
