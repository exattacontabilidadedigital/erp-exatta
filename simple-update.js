// Script simples para atualizar empresa_id usando upsert
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleUpdate() {
  console.log('🔄 Tentativa de atualização simples...\n');

  try {
    // Primeiro, vamos buscar o template completo
    const { data: originalTemplate, error: fetchError } = await supabase
      .from('templates_importacao')
      .select('*')
      .eq('id', '8216991b-d47d-467d-9185-88818b0722dd')
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar template:', fetchError);
      return;
    }

    console.log('📋 Template original:');
    console.log(`   Nome: ${originalTemplate.nome}`);
    console.log(`   Empresa atual: ${originalTemplate.empresa_id}`);
    console.log(`   Categoria: ${originalTemplate.categoria}`);

    // Tentar deletar e recriar o registro
    console.log('\n🗑️ Deletando template antigo...');
    const { error: deleteError } = await supabase
      .from('templates_importacao')
      .delete()
      .eq('id', '8216991b-d47d-467d-9185-88818b0722dd');

    if (deleteError) {
      console.error('❌ Erro ao deletar:', deleteError);
      return;
    }

    console.log('✅ Template deletado com sucesso!');

    // Recriar com a nova empresa_id
    console.log('📝 Recriando template com nova empresa...');
    const newTemplate = {
      ...originalTemplate,
      empresa_id: '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'
    };

    // Remover campos que podem causar conflito
    delete newTemplate.created_at;
    delete newTemplate.updated_at;

    const { data: insertResult, error: insertError } = await supabase
      .from('templates_importacao')
      .insert([newTemplate])
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError);
      
      // Tentar recriar o original em caso de erro
      console.log('🔄 Tentando restaurar template original...');
      delete originalTemplate.created_at;
      delete originalTemplate.updated_at;
      
      const { error: restoreError } = await supabase
        .from('templates_importacao')
        .insert([originalTemplate]);
        
      if (restoreError) {
        console.error('❌ ERRO CRÍTICO - Não foi possível restaurar template!', restoreError);
      } else {
        console.log('✅ Template original restaurado.');
      }
      return;
    }

    console.log('✅ Template recriado com sucesso!');
    console.log('📋 Novo template:');
    console.log(`   ID: ${insertResult[0].id}`);
    console.log(`   Nome: ${insertResult[0].nome}`);
    console.log(`   Nova empresa: ${insertResult[0].empresa_id}`);
    console.log(`   Categoria: ${insertResult[0].categoria}`);

    // Verificar todos os templates da empresa agora
    console.log('\n📋 Todos os templates da empresa 15bdcc8f-e7a5-41ce-bc2b-403f78f64236:');
    const { data: allTemplates, error: allError } = await supabase
      .from('templates_importacao')
      .select('id, nome, categoria, ativo')
      .eq('empresa_id', '15bdcc8f-e7a5-41ce-bc2b-403f78f64236')
      .order('nome', { ascending: true });

    if (allError) {
      console.error('❌ Erro ao buscar todos templates:', allError);
    } else {
      allTemplates?.forEach((template, index) => {
        const status = template.ativo ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${template.nome} (${template.categoria})`);
      });
      console.log(`\n✅ Total: ${allTemplates?.length || 0} templates na empresa`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

simpleUpdate();