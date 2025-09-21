const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEwNTExOCwiZXhwIjoyMDcwNjgxMTE4fQ.T0mh9T780CqwYOuNVTJuftfdQ-_1ErbRZBF-K5o2IGU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testColumns() {
  try {
    console.log('🔍 Testando se as colunas usuario_id e empresa_id existem...');
    
    // Tentar selecionar as colunas
    const { data: testData, error: testError } = await supabase
      .from('pre_lancamentos')
      .select('id, descricao, usuario_id, empresa_id, lote_id')
      .limit(3);
    
    if (testError) {
      if (testError.message.includes('column') && testError.message.includes('does not exist')) {
        console.log('❌ Colunas ainda não existem');
        console.log('💡 Execute o script SQL: add-columns-pre-lancamentos-final.sql');
        console.log('   no Supabase SQL Editor');
      } else {
        console.log('❌ Erro:', testError.message);
      }
      return;
    }
    
    console.log('✅ Colunas existem!');
    console.log('📊 Registros encontrados:', testData?.length || 0);
    
    if (testData && testData.length > 0) {
      const comUsuarioId = testData.filter(item => item.usuario_id).length;
      const comEmpresaId = testData.filter(item => item.empresa_id).length;
      
      console.log('  📋 Com usuario_id preenchido:', comUsuarioId);
      console.log('  🏢 Com empresa_id preenchido:', comEmpresaId);
      
      console.log('\n🔍 Exemplo de registro:');
      console.log(testData[0]);
      
      if (comUsuarioId === 0 || comEmpresaId === 0) {
        console.log('\n⚠️  Alguns registros não têm usuario_id/empresa_id preenchidos');
        console.log('   Execute a parte UPDATE do script SQL para preencher os dados');
      } else {
        console.log('\n🎉 Todos os registros têm usuario_id e empresa_id preenchidos!');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

testColumns();