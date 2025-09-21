// Script para mover TODOS os templates para a empresa correta
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function moveAllTemplatesCorrectCompany() {
  console.log('🔄 Movendo todos os templates para a empresa correta...\n');

  const targetEmpresaId = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'; // romario.hj2@gmail.com
  const wrongEmpresaId = '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d';

  try {
    // 1. Verificar templates na empresa errada
    console.log('📋 Templates na empresa errada:');
    const { data: wrongTemplates, error: wrongError } = await supabase
      .from('templates_importacao')
      .select('*')
      .eq('empresa_id', wrongEmpresaId);

    if (wrongError) {
      console.error('❌ Erro ao buscar templates:', wrongError);
      return;
    }

    wrongTemplates?.forEach((template, index) => {
      console.log(`${index + 1}. ${template.nome} (${template.categoria})`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Empresa atual: ${template.empresa_id}`);
      console.log('');
    });

    if (!wrongTemplates || wrongTemplates.length === 0) {
      console.log('✅ Nenhum template encontrado na empresa errada.');
      return;
    }

    // 2. Mover cada template usando delete+insert
    console.log(`🔄 Movendo ${wrongTemplates.length} templates...\n`);

    for (const template of wrongTemplates) {
      console.log(`📝 Processando: ${template.nome}`);

      try {
        // Deletar da empresa errada
        const { error: deleteError } = await supabase
          .from('templates_importacao')
          .delete()
          .eq('id', template.id);

        if (deleteError) {
          console.error(`❌ Erro ao deletar ${template.nome}:`, deleteError);
          continue;
        }

        // Recriar na empresa correta
        const newTemplate = {
          ...template,
          empresa_id: targetEmpresaId,
          // Remover campos que podem causar conflito
          created_at: undefined,
          updated_at: undefined
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('templates_importacao')
          .insert([newTemplate])
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Erro ao inserir ${template.nome}:`, insertError);
          
          // Tentar restaurar na empresa original
          await supabase
            .from('templates_importacao')
            .insert([{
              ...template,
              created_at: undefined,
              updated_at: undefined
            }]);
          continue;
        }

        console.log(`✅ ${template.nome} movido com sucesso!`);
        console.log(`   Novo ID: ${insertResult.id}`);
        console.log(`   Nova empresa: ${insertResult.empresa_id}`);
        console.log('');

      } catch (error) {
        console.error(`❌ Erro geral com ${template.nome}:`, error);
      }
    }

    // 3. Verificar resultado final
    console.log('📋 Verificando resultado final...');
    const { data: finalTemplates, error: finalError } = await supabase
      .from('templates_importacao')
      .select('id, nome, categoria, empresa_id, ativo')
      .eq('empresa_id', targetEmpresaId)
      .order('nome', { ascending: true });

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
      return;
    }

    console.log(`\n✅ Templates na empresa correta (${targetEmpresaId}):`);
    finalTemplates?.forEach((template, index) => {
      const status = template.ativo ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${template.nome} (${template.categoria})`);
    });

    console.log(`\n🎉 Processo concluído! Total: ${finalTemplates?.length || 0} templates`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

moveAllTemplatesCorrectCompany();