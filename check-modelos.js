const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkModelosExistentes() {
  try {
    console.log('=== Verificando modelos de importação existentes ===\n');
    
    const { data: modelos, error } = await supabase
      .from('modelos_importacao')
      .select('*');
    
    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }

    console.log(`📋 Total de modelos: ${modelos?.length || 0}\n`);
    
    modelos?.forEach((modelo, index) => {
      console.log(`${index + 1}. ${modelo.nome}`);
      console.log(`   Tipo: ${modelo.tipo_arquivo}`);
      console.log(`   Descrição: ${modelo.descricao || 'Sem descrição'}`);
      console.log(`   Ativo: ${modelo.ativo ? '✅' : '❌'}`);
      console.log(`   Criado em: ${modelo.data_criacao}`);
      console.log(`   Configuração: ${JSON.stringify(modelo.configuracao, null, 2)}`);
      console.log(`   Mapeamento: ${JSON.stringify(modelo.mapeamento_campos, null, 2)}`);
      console.log(`   Regras: ${JSON.stringify(modelo.regras_matching, null, 2)}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkModelosExistentes().then(() => {
  console.log('\n✅ Verificação concluída!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});