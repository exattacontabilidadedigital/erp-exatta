// Script para verificar os dados do usuário logado
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugUserContext() {
  console.log('🔍 Verificando contexto do usuário...\n');

  try {
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('id, email, nome, empresa_id');

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log('👥 Usuários encontrados:');
    users?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.nome}`);
      console.log(`   Empresa ID: ${user.empresa_id}`);
      console.log('');
    });

    // Verificar especificamente o usuário romario.hj2@gmail.com
    const romarioUser = users?.find(u => u.email === 'romario.hj2@gmail.com');
    if (romarioUser) {
      console.log('🎯 Dados do usuário romario.hj2@gmail.com:');
      console.log('   empresa_id:', romarioUser.empresa_id);
      
      // Buscar templates para esta empresa
      const { data: templates, error: templatesError } = await supabase
        .from('templates_importacao')
        .select('*')
        .eq('empresa_id', romarioUser.empresa_id)
        .order('nome', { ascending: true });

      if (templatesError) {
        console.error('❌ Erro ao buscar templates:', templatesError);
      } else {
        console.log(`   Templates encontrados: ${templates?.length || 0}`);
        templates?.forEach((template, index) => {
          console.log(`   ${index + 1}. ${template.nome} (${template.categoria})`);
        });
      }
    } else {
      console.log('❌ Usuário romario.hj2@gmail.com não encontrado!');
    }

    // Verificar todos os templates no banco
    console.log('\n📋 Todos os templates no banco:');
    const { data: allTemplates, error: allTemplatesError } = await supabase
      .from('templates_importacao')
      .select('id, nome, empresa_id, categoria')
      .order('nome', { ascending: true });

    if (allTemplatesError) {
      console.error('❌ Erro ao buscar todos templates:', allTemplatesError);
    } else {
      allTemplates?.forEach((template, index) => {
        console.log(`${index + 1}. ${template.nome} (${template.categoria}) - empresa: ${template.empresa_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugUserContext();