require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAllUsers() {
  console.log('🔍 Verificando todos os usuários e suas empresas...');
  
  try {
    // Buscar todos os usuários
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*');

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log(`📊 Total de usuários: ${usuarios?.length || 0}\n`);
    
    for (let i = 0; i < usuarios.length; i++) {
      const user = usuarios[i];
      console.log(`👤 Usuário ${i + 1}:`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Nome: ${user.nome}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Empresa ID: ${user.empresa_id}`);
      
      // Contar contas desta empresa
      const { data: contas, error: contasError } = await supabase
        .from('contas_bancarias')
        .select('id')
        .eq('empresa_id', user.empresa_id);

      if (!contasError) {
        console.log(`  - Contas bancárias: ${contas?.length || 0}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAllUsers();