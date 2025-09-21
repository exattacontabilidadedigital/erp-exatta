// Script para corrigir o trigger problemático
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTriggerAndUpdate() {
  console.log('🔧 Corrigindo trigger e fazendo atualização...\n');

  try {
    // Como não temos acesso direto aos triggers via Supabase,
    // vamos testar se a atualização ainda falha
    console.log('🧪 Testando se o trigger ainda causa problema...');
    
    // Primeiro verificar o estado atual
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('templates_importacao')
      .select('*')
      .eq('id', '8216991b-d47d-467d-9185-88818b0722dd')
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar template:', fetchError);
      return;
    }

    console.log('📋 Estado atual do template:');
    console.log(`   Nome: ${currentTemplate.nome}`);
    console.log(`   Empresa atual: ${currentTemplate.empresa_id}`);
    console.log(`   Empresa correta: 15bdcc8f-e7a5-41ce-bc2b-403f78f64236`);

    // Verificar se já está na empresa correta
    if (currentTemplate.empresa_id === '15bdcc8f-e7a5-41ce-bc2b-403f78f64236') {
      console.log('✅ Template já está na empresa correta!');
      
      // Verificar todos os templates da empresa
      const { data: allTemplates, error: allError } = await supabase
        .from('templates_importacao')
        .select('id, nome, categoria, ativo')
        .eq('empresa_id', '15bdcc8f-e7a5-41ce-bc2b-403f78f64236')
        .order('nome', { ascending: true });

      if (allError) {
        console.error('❌ Erro ao buscar todos templates:', allError);
      } else {
        console.log('\n📋 Todos os templates da empresa:');
        allTemplates?.forEach((template, index) => {
          const status = template.ativo ? '✅' : '❌';
          console.log(`${index + 1}. ${status} ${template.nome} (${template.categoria})`);
        });
        console.log(`\n✅ Total: ${allTemplates?.length || 0} templates`);
      }
      
      return;
    }

    // Se não estiver na empresa correta, tentar atualização normal
    console.log('\n🔄 Tentando atualização normal via Supabase...');
    const { data: updateResult, error: updateError } = await supabase
      .from('templates_importacao')
      .update({ empresa_id: '15bdcc8f-e7a5-41ce-bc2b-403f78f64236' })
      .eq('id', '8216991b-d47d-467d-9185-88818b0722dd')
      .select();

    if (updateError) {
      console.log('⚠️ Atualização normal falhou:', updateError.message);
      console.log('🔄 Usando método alternativo (delete + insert)...');
      
      // Usar o método que já funcionou antes
      const { error: deleteError } = await supabase
        .from('templates_importacao')
        .delete()
        .eq('id', '8216991b-d47d-467d-9185-88818b0722dd');

      if (deleteError) {
        console.error('❌ Erro ao deletar:', deleteError);
        return;
      }

      // Recriar com nova empresa
      const newTemplate = {
        ...currentTemplate,
        empresa_id: '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'
      };
      
      delete newTemplate.created_at;
      delete newTemplate.updated_at;

      const { data: insertResult, error: insertError } = await supabase
        .from('templates_importacao')
        .insert([newTemplate])
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir:', insertError);
        
        // Restaurar original
        delete currentTemplate.created_at;
        delete currentTemplate.updated_at;
        await supabase.from('templates_importacao').insert([currentTemplate]);
        return;
      }

      console.log('✅ Template movido com sucesso via delete+insert!');
      console.log(`   Novo ID: ${insertResult[0].id}`);
      
    } else {
      console.log('✅ Atualização normal funcionou!');
      console.log('   Resultado:', updateResult[0]);
    }

    // Verificar resultado final
    console.log('\n📋 Verificando resultado final...');
    const { data: finalTemplates, error: finalError } = await supabase
      .from('templates_importacao')
      .select('id, nome, categoria, ativo, empresa_id')
      .eq('empresa_id', '15bdcc8f-e7a5-41ce-bc2b-403f78f64236')
      .order('nome', { ascending: true });

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
    } else {
      console.log('📋 Templates finais da empresa:');
      finalTemplates?.forEach((template, index) => {
        const status = template.ativo ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${template.nome} (${template.categoria})`);
      });
      console.log(`\n✅ Total: ${finalTemplates?.length || 0} templates na empresa`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixTriggerAndUpdate();