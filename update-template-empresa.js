// Script para atualizar empresa_id dos templates
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateTemplateEmpresa() {
  console.log('🔄 Iniciando atualização de empresa_id dos templates...\n');

  try {
    // 1. Verificar dados atuais
    console.log('📋 Dados atuais dos templates:');
    const { data: currentTemplates, error: currentError } = await supabase
      .from('templates_importacao')
      .select('id, nome, empresa_id, categoria, created_at')
      .in('id', [
        '496d8048-8051-48ee-8bf5-fc758061794f',
        '8216991b-d47d-467d-9185-88818b0722dd'
      ])
      .order('nome', { ascending: true });

    if (currentError) {
      console.error('❌ Erro ao buscar templates atuais:', currentError);
      return;
    }

    currentTemplates?.forEach((template, index) => {
      console.log(`${index + 1}. ${template.nome}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Empresa ID: ${template.empresa_id}`);
      console.log(`   Categoria: ${template.categoria}`);
      console.log('');
    });

    // 2. Verificar empresa do usuário romario.hj2@gmail.com
    console.log('👤 Verificando empresa do usuário romario.hj2@gmail.com:');
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select(`
        id,
        email,
        nome,
        empresa_id,
        empresas (
          id,
          razao_social,
          nome_fantasia
        )
      `)
      .eq('email', 'romario.hj2@gmail.com')
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    console.log(`   Usuário: ${userData.nome} (${userData.email})`);
    console.log(`   Empresa ID: ${userData.empresa_id}`);
    if (userData.empresas) {
      console.log(`   Razão Social: ${userData.empresas.razao_social}`);
      console.log(`   Nome Fantasia: ${userData.empresas.nome_fantasia}`);
    }
    console.log('');

    // 3. Atualizar template "terdfa" para a empresa correta
    const templateToUpdate = currentTemplates?.find(t => t.id === '8216991b-d47d-467d-9185-88818b0722dd');
    
    if (templateToUpdate && templateToUpdate.empresa_id !== userData.empresa_id) {
      console.log(`🔄 Atualizando template "${templateToUpdate.nome}" para empresa correta...`);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('templates_importacao')
        .update({
          empresa_id: userData.empresa_id
        })
        .eq('id', '8216991b-d47d-467d-9185-88818b0722dd')
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar template:', updateError);
        return;
      }

      console.log('✅ Template atualizado com sucesso!');
      console.log('   Resultado:', updateResult[0]);
      console.log('');
    } else {
      console.log('ℹ️ Template já está na empresa correta ou não encontrado.');
      console.log('');
    }

    // 4. Verificar resultado final
    console.log('📋 Verificando resultado final:');
    const { data: finalTemplates, error: finalError } = await supabase
      .from('templates_importacao')
      .select('id, nome, empresa_id, categoria, updated_at')
      .in('id', [
        '496d8048-8051-48ee-8bf5-fc758061794f',
        '8216991b-d47d-467d-9185-88818b0722dd'
      ])
      .order('nome', { ascending: true });

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
      return;
    }

    finalTemplates?.forEach((template, index) => {
      console.log(`${index + 1}. ${template.nome}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Empresa ID: ${template.empresa_id}`);
      console.log(`   Categoria: ${template.categoria}`);
      console.log(`   Atualizado em: ${template.updated_at}`);
      console.log('');
    });

    // 5. Listar todos os templates da empresa correta
    console.log('📋 Todos os templates da empresa do usuário:');
    const { data: allUserTemplates, error: allError } = await supabase
      .from('templates_importacao')
      .select('id, nome, categoria, ativo')
      .eq('empresa_id', userData.empresa_id)
      .order('nome', { ascending: true });

    if (allError) {
      console.error('❌ Erro ao buscar todos os templates:', allError);
      return;
    }

    allUserTemplates?.forEach((template, index) => {
      const status = template.ativo ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${template.nome} (${template.categoria})`);
    });

    console.log(`\n✅ Processo concluído! Total de templates na empresa: ${allUserTemplates?.length || 0}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

updateTemplateEmpresa();