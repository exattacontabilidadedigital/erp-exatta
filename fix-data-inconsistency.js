const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEwNTExOCwiZXhwIjoyMDcwNjgxMTE4fQ.T0mh9T780CqwYOuNVTJuftfdQ-_1ErbRZBF-K5o2IGU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixData() {
  console.log('🔧 Corrigindo dados inconsistentes...');
  
  // 1. Ver dados atuais
  const { data: preLanc } = await supabase
    .from('pre_lancamentos')
    .select('id, usuario_id, empresa_id')
    .limit(5);
  
  console.log('📊 Dados atuais dos pré-lançamentos:');
  preLanc?.forEach(p => {
    console.log(`  - Usuario: ${p.usuario_id.substring(0,8)}... Empresa: ${p.empresa_id.substring(0,8)}...`);
  });
  
  // 2. Ver dados do usuário atual
  const { data: user } = await supabase
    .from('usuarios')
    .select('id, empresa_id, email')
    .eq('id', '7317f5bd-f288-4433-8283-596936caf9b2')
    .single();
  
  console.log('\n👤 Dados do usuário contabil:');
  console.log(`  - Usuario ID: ${user?.id.substring(0,8)}...`);
  console.log(`  - Empresa ID: ${user?.empresa_id.substring(0,8)}...`);
  
  // 3. Atualizar os pré-lançamentos para a empresa correta
  console.log('\n🔧 Atualizando empresa_id dos pré-lançamentos...');
  const { data: updateResult, error: updateError } = await supabase
    .from('pre_lancamentos')
    .update({ empresa_id: user?.empresa_id })
    .eq('usuario_id', user?.id);
  
  if (updateError) {
    console.log('❌ Erro na atualização:', updateError.message);
  } else {
    console.log('✅ Atualização realizada com sucesso!');
    
    // Verificar resultado
    const { data: verificacao } = await supabase
      .from('pre_lancamentos')
      .select('id, empresa_id')
      .eq('empresa_id', user?.empresa_id);
    
    console.log(`📊 Pré-lançamentos agora na empresa correta: ${verificacao?.length || 0}`);
  }
}

fixData();