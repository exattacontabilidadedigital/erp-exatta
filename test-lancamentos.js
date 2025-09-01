const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testLancamentos() {
  console.log('🔍 Testando dados da tabela lancamentos...\n');
  
  try {
    // Buscar lançamentos
    const { data, error } = await supabase
      .from('lancamentos')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Erro ao buscar lançamentos:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ ${data.length} lançamentos encontrados`);
      console.log('Colunas disponíveis:', Object.keys(data[0]));
      console.log('\nExemplos de registros:');
      data.forEach((item, index) => {
        console.log(`\nLançamento ${index + 1}:`);
        console.log(JSON.stringify(item, null, 2));
      });
    } else {
      console.log('⚠️ Nenhum lançamento encontrado na tabela');
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

testLancamentos().then(() => process.exit(0));
