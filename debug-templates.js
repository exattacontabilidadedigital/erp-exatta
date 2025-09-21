const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTemplates() {
  try {
    console.log('=== Debug Templates de Importação ===\n');
    
    // Testar consulta básica
    console.log('1. Testando consulta básica...');
    const { data: allTemplates, error: allError } = await supabase
      .from('templates_importacao')
      .select('*');
    
    if (allError) {
      console.log('❌ Erro na consulta básica:', allError);
      return;
    }
    
    console.log(`✅ Total de templates encontrados: ${allTemplates.length}`);
    allTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.nome} (Empresa: ${template.empresa_id})`);
    });
    
    // Testar consulta filtrada por empresa
    console.log('\n2. Testando consulta por empresa específica...');
    const empresaId = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'; // ID da empresa dos dados
    
    const { data: filteredTemplates, error: filteredError } = await supabase
      .from('templates_importacao')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });
    
    if (filteredError) {
      console.log('❌ Erro na consulta filtrada:', filteredError);
      return;
    }
    
    console.log(`✅ Templates da empresa ${empresaId}: ${filteredTemplates.length}`);
    filteredTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.nome}`);
      console.log(`   - Padrão: ${template.descricao_padrao}`);
      console.log(`   - Categoria: ${template.categoria}`);
      console.log(`   - Ativo: ${template.ativo}`);
      console.log(`   - Criado em: ${template.created_at}`);
    });
    
    // Verificar usuários e suas empresas
    console.log('\n3. Verificando usuários e empresas...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, email, empresa_id');
    
    if (usuariosError) {
      console.log('❌ Erro ao buscar usuários:', usuariosError);
    } else {
      console.log('✅ Usuários encontrados:');
      usuarios.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}, Empresa: ${user.empresa_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugTemplates().then(() => {
  console.log('\n✅ Debug concluído!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});