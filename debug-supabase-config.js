// Debug das variáveis de ambiente do Supabase
console.log('🔍 DEBUG: Variáveis de ambiente do Supabase');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINIDA (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NÃO DEFINIDA');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDA (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'NÃO DEFINIDA');

// Teste de configuração do cliente Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('supabaseUrl:', supabaseUrl);
console.log('supabaseKey (primeiros 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NÃO DEFINIDA');

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Cliente Supabase criado com sucesso');
  
  // Teste simples de conexão
  supabase
    .from('transaction_matches')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Erro de conexão:', error.message);
      } else {
        console.log('✅ Conexão bem-sucedida');
      }
    });
} else {
  console.log('❌ Configuração incompleta do Supabase');
}
