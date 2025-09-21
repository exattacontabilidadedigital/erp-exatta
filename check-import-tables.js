const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkImportTables() {
  try {
    console.log('=== Verificando todas as tabelas de importação ===\n');
    
    const tables = [
      'modelos_importacao',
      'lotes_importacao', 
      'pre_lancamentos',
      'aprendizado_modelos',
      'historico_importacoes',
      'templates_importacao',
      'lotes_processamento',
      'pre_validacao_lancamentos'
    ];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ERRO - ${error.message}`);
        } else {
          console.log(`✅ ${table}: Existe (${count || 0} registros)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ERRO - ${err.message}`);
      }
    }

    console.log('\n=== Verificando empresas disponíveis ===');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome_fantasia')
      .limit(3);
    
    if (empresasError) {
      console.log('❌ Erro ao buscar empresas:', empresasError.message);
    } else {
      console.log(`✅ Empresas encontradas: ${empresas?.length || 0}`);
      empresas?.forEach(emp => console.log(`  - ID: ${emp.id} | Nome: ${emp.nome_fantasia}`));
    }

    console.log('\n=== Verificando usuários ===');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, email, empresa_id')
      .limit(3);
    
    if (usuariosError) {
      console.log('❌ Erro ao buscar usuários:', usuariosError.message);
    } else {
      console.log(`✅ Usuários encontrados: ${usuarios?.length || 0}`);
      usuarios?.forEach(user => console.log(`  - ID: ${user.id} | Email: ${user.email} | Empresa: ${user.empresa_id}`));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkImportTables().then(() => {
  console.log('\n✅ Verificação concluída!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});