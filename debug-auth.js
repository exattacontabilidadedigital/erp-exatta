require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  console.log('🔍 Verificando usuários no sistema...');
  
  try {
    // Buscar todos os usuários
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*');

    if (usuariosError) {
      console.error('❌ Erro ao buscar usuários:', usuariosError);
      return;
    }

    console.log('📊 Total de usuários encontrados:', usuarios?.length || 0);
    
    if (usuarios && usuarios.length > 0) {
      console.log('👤 Primeiro usuário:');
      console.log('  - ID:', usuarios[0].id);
      console.log('  - Nome:', usuarios[0].nome);
      console.log('  - Email:', usuarios[0].email);
      console.log('  - Empresa ID:', usuarios[0].empresa_id);
      console.log('  - Role:', usuarios[0].role);
      console.log('  - Ativo:', usuarios[0].ativo);
      
      // Buscar dados da empresa
      if (usuarios[0].empresa_id) {
        console.log('\n🏢 Verificando dados da empresa...');
        const { data: empresa, error: empresaError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', usuarios[0].empresa_id)
          .single();

        if (empresaError) {
          console.error('❌ Erro ao buscar empresa:', empresaError);
        } else {
          console.log('✅ Empresa encontrada:');
          console.log('  - ID:', empresa.id);
          console.log('  - Nome:', empresa.nome);
          console.log('  - CNPJ:', empresa.cnpj);
        }

        // Verificar contas dessa empresa
        console.log('\n🏦 Verificando contas da empresa...');
        const { data: contas, error: contasError } = await supabase
          .from('contas_bancarias')
          .select(`
            *,
            bancos:banco_id (
              id,
              nome,
              codigo
            )
          `)
          .eq('empresa_id', usuarios[0].empresa_id);

        if (contasError) {
          console.error('❌ Erro ao buscar contas:', contasError);
        } else {
          console.log(`✅ ${contas?.length || 0} contas encontradas para a empresa`);
          if (contas && contas.length > 0) {
            console.log('🔍 Primeira conta:', {
              id: contas[0].id,
              nome: contas[0].nome,
              banco: contas[0].bancos?.nome,
              ativa: contas[0].ativa
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAuth();