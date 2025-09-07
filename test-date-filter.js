require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔑 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Definida' : 'Não definida');
console.log('🔑 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDateFilter() {
  console.log('🧪 Testando filtros de data...');
  
  // Primeiro: contar todos os lançamentos
  const { count: totalCount } = await supabase
    .from('lancamentos')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Total de lançamentos na tabela: ${totalCount}`);
  
  // Segundo: filtrar por data sem outros filtros
  const dataInicio = '2025-07-01';
  const dataFim = '2025-09-06';
  
  console.log(`📅 Testando intervalo: ${dataInicio} até ${dataFim}`);
  
  const { data: lancamentos, count: filteredCount, error } = await supabase
    .from('lancamentos')
    .select('*', { count: 'exact' })
    .gte('data_lancamento', dataInicio)
    .lte('data_lancamento', dataFim);
  
  if (error) {
    console.error('❌ Erro na consulta:', error);
    return;
  }
  
  console.log(`📋 Lançamentos encontrados no intervalo: ${filteredCount}`);
  console.log('📝 Primeiros 5 resultados:');
  lancamentos.slice(0, 5).forEach((l, i) => {
    console.log(`  ${i+1}. ${l.data_lancamento} - ${l.descricao} - R$ ${l.valor}`);
  });
  
  // Terceiro: testar apenas com status pendente
  const { data: pendentes, count: pendentesCount } = await supabase
    .from('lancamentos')
    .select('*', { count: 'exact' })
    .gte('data_lancamento', dataInicio)
    .lte('data_lancamento', dataFim)
    .eq('status', 'pendente');
  
  console.log(`⏳ Lançamentos PENDENTES no intervalo: ${pendentesCount}`);
  
  // Quarto: verificar distribuição por status
  const { data: statusDistribution } = await supabase
    .from('lancamentos')
    .select('status')
    .gte('data_lancamento', dataInicio)
    .lte('data_lancamento', dataFim);
  
  const statusCount = statusDistribution.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 Distribuição por status no intervalo:', statusCount);
}

testDateFilter().catch(console.error);
