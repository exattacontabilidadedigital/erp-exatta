const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjgrirpojhbzegdjukfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3JpcnBvamhiemVnZGp1a2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1NjI5ODUsImV4cCI6MjA0NjEzODk4NX0.Lzjcp-BFJxKLTLTgdG1NCgfQs1-G5d4t9DpXGwJIj_M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLotesTable() {
  console.log('🔍 Testando acesso à tabela lotes_importacao...');
  
  try {
    // Testar acesso à tabela
    const { data, error } = await supabase
      .from('lotes_importacao')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao acessar lotes_importacao:', error);
      return;
    }

    console.log('✅ Tabela lotes_importacao está acessível');
    console.log('📋 Total encontrado:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('📊 Campos disponíveis:', Object.keys(data[0]));
      console.log('📊 Primeiro lote:');
      console.log(JSON.stringify(data[0], null, 2));
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testLotesTable();