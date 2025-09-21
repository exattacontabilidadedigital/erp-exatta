const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjgrirpojhbzegdjukfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3JpcnBvamhiemVnZGp1a2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1NjI5ODUsImV4cCI6MjA0NjEzODk4NX0.Lzjcp-BFJxKLTLTgdG1NCgfQs1-G5d4t9DpXGwJIj_M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPreLancamentosTable() {
  console.log('🔍 Testando acesso à tabela pre_lancamentos...');
  
  try {
    // Testar acesso à tabela
    const { data, error } = await supabase
      .from('pre_lancamentos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao acessar pre_lancamentos:', error);
      console.log('🔧 A tabela provavelmente não existe ou não tem a estrutura correta.');
      return;
    }

    console.log('✅ Tabela pre_lancamentos está acessível');
    console.log('📊 Exemplo de dados:', data);

    // Buscar todos os pre_lancamentos
    const { data: allEntries, error: allError } = await supabase
      .from('pre_lancamentos')
      .select('*')
      .limit(5);

    if (allError) {
      console.error('❌ Erro ao buscar pre_lancamentos:', allError);
    } else {
      console.log('📋 Total encontrado:', allEntries?.length || 0);
      console.log('📋 Campos disponíveis:', allEntries?.[0] ? Object.keys(allEntries[0]) : 'Nenhum');
      
      if (allEntries && allEntries.length > 0) {
        console.log('📊 Exemplo de pré-lançamento:');
        console.log(JSON.stringify(allEntries[0], null, 2));
      }
    }

    // Testar inserção de exemplo
    console.log('\n🧪 Testando inserção de pré-lançamento...');
    
    const testEntry = {
      lote_id: '00000000-0000-0000-0000-000000000000', // UUID fictício
      linha_arquivo: 1,
      data_lancamento: '2024-01-01',
      descricao: 'Teste de pré-lançamento',
      valor: 100.50,
      tipo_movimento: 'entrada',
      status_aprovacao: 'pendente',
      status_matching: 'pendente'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('pre_lancamentos')
      .insert(testEntry)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir (mostra campos obrigatórios):');
      console.log(JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Pré-lançamento criado:', insertData);
      
      // Remover o teste
      await supabase
        .from('pre_lancamentos')
        .delete()
        .eq('id', insertData.id);
      
      console.log('🗑️ Pré-lançamento de teste removido');
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testPreLancamentosTable();