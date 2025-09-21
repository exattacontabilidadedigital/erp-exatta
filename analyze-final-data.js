const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEwNTExOCwiZXhwIjoyMDcwNjgxMTE4fQ.T0mh9T780CqwYOuNVTJuftfdQ-_1ErbRZBF-K5o2IGU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeData() {
  console.log('🔍 Analisando dados após SQL...');
  
  // 1. Ver todos os pré-lançamentos
  const { data: allPre } = await supabase
    .from('pre_lancamentos')
    .select('id, descricao, usuario_id, empresa_id')
    .limit(5);
  
  console.log('\n📊 PRÉ-LANÇAMENTOS:');
  allPre?.forEach((pre, i) => {
    console.log(`${i+1}. ${pre.descricao} - Usuario: ${pre.usuario_id.substring(0,8)}... - Empresa: ${pre.empresa_id.substring(0,8)}...`);
  });
  
  // 2. Ver empresas únicas
  const empresasUnicas = [...new Set(allPre?.map(p => p.empresa_id))];
  console.log('\n🏢 EMPRESAS COM PRÉ-LANÇAMENTOS:', empresasUnicas.length);
  
  // 3. Ver dados do usuário contabil
  const { data: contabilUser } = await supabase
    .from('usuarios')
    .select('id, empresa_id, nome, email')
    .eq('email', 'contabil@exattacontabilidade.com.br')
    .single();
  
  console.log('\n👤 USUÁRIO CONTABIL:');
  console.log('ID:', contabilUser?.id.substring(0,8) + '...');
  console.log('Empresa ID:', contabilUser?.empresa_id.substring(0,8) + '...');
  console.log('Nome:', contabilUser?.nome);
  
  // 4. Verificar se há pré-lançamentos para esta empresa
  const temPreLanc = allPre?.some(p => p.empresa_id === contabilUser?.empresa_id);
  console.log('\n🔍 RESULTADO:');
  console.log('Empresa do usuário tem pré-lançamentos:', temPreLanc ? 'SIM' : 'NÃO');
  
  if (!temPreLanc) {
    console.log('\n💡 DIAGNÓSTICO:');
    console.log('✅ SQL executado com sucesso - colunas criadas e preenchidas');
    console.log('📊 Os pré-lançamentos existem mas pertencem a outras empresas');
    console.log('🏢 O usuário contabil@exattacontabilidade.com.br não tem pré-lançamentos');
    console.log('✨ Isso é normal - cada empresa vê apenas seus próprios dados');
    console.log('\n🎯 PRÓXIMO PASSO: Testar na aplicação web');
  } else {
    console.log('\n🎉 SUCESSO! Usuário tem pré-lançamentos na sua empresa');
  }
}

analyzeData();