const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTemplatesTable() {
  console.log('🔍 Testando acesso à tabela templates_importacao...');
  
  try {
    // Testar acesso à tabela
    const { data, error } = await supabase
      .from('templates_importacao')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao acessar templates_importacao:', error);
      console.log('🔧 A tabela provavelmente não existe ainda.');
      
      // Tentar criar um template simples para ver se funciona
      console.log('🧪 Tentando criar template de teste...');
      
      const testTemplate = {
        empresa_id: 'cf764510-7038-4e64-ae14-1eefef7fcdbd',
        nome: 'Template Teste ' + Date.now(),
        descricao_padrao: 'Template criado para teste',
        categoria: 'teste',
        limite_confianca: 0.8,
        confirmacao_automatica: false,
        ativo: true
      };

      const { data: insertData, error: insertError } = await supabase
        .from('templates_importacao')
        .insert(testTemplate)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir template:', insertError);
      } else {
        console.log('✅ Template criado com sucesso:', insertData);
      }
      
      return;
    }

    console.log('✅ Tabela templates_importacao está acessível');
    console.log('📊 Dados encontrados:', data);

    // Buscar todos os templates
    const { data: allTemplates, error: allError } = await supabase
      .from('templates_importacao')
      .select('*');

    if (allError) {
      console.error('❌ Erro ao buscar todos os templates:', allError);
    } else {
      console.log('📋 Total de templates:', allTemplates?.length || 0);
      console.log('📋 Templates:', allTemplates);
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testTemplatesTable();