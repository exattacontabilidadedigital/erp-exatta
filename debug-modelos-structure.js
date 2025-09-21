const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjgrirpojhbzegdjukfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3JpcnBvamhiemVnZGp1a2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1NjI5ODUsImV4cCI6MjA0NjEzODk4NX0.Lzjcp-BFJxKLTLTgdG1NCgfQs1-G5d4t9DpXGwJIj_M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkModelosStructure() {
  console.log('🔍 Verificando estrutura da tabela modelos_importacao...');
  
  try {
    // Buscar um registro existente para ver os campos
    const { data, error } = await supabase
      .from('modelos_importacao')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar modelos:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('📋 Campos da tabela modelos_importacao:');
      console.log(Object.keys(data[0]));
      console.log('\n📊 Exemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ Nenhum registro encontrado na tabela modelos_importacao');
    }

    // Tentar inserir um registro de teste para ver os requisitos
    console.log('\n🧪 Tentando inserir registro de teste...');
    
    const testData = {
      nome: 'TESTE_ESTRUTURA',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('modelos_importacao')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir teste (mostra campos obrigatórios):');
      console.log(JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Inserção de teste bem-sucedida:', insertData);
      
      // Remover o registro de teste
      await supabase
        .from('modelos_importacao')
        .delete()
        .eq('id', insertData.id);
      
      console.log('🗑️ Registro de teste removido');
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

checkModelosStructure();