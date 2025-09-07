// Verificar qual lançamento de R$ 25 existe no banco

const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgllwjjkwmqedrzoymc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2xsd2pqa3dtcWVkcnpveW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM0MTQwMzksImV4cCI6MjAzODk5MDAzOX0.o9GzTKFe2l8-Oz-CQ4-JaPWTJXNT94LV_eVyFbJ-Gf0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verificarLancamentos() {
  console.log('🔍 Buscando lançamentos com valor R$ 25...');
  
  // Buscar todos os lançamentos com valor 25
  const { data: lancamentos, error } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('empresa_id', '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d')
    .eq('valor', 25);
    
  if (error) {
    console.error('❌ Erro ao buscar lançamentos:', error);
    return;
  }
  
  console.log(`📊 Encontrados ${lancamentos.length} lançamentos com valor R$ 25:`);
  
  lancamentos.forEach((lancamento, index) => {
    console.log(`\n${index + 1}. Lançamento ${lancamento.id.substring(0, 8)}:`);
    console.log(`   - Valor: R$ ${lancamento.valor}`);
    console.log(`   - Data: ${lancamento.data_lancamento}`);
    console.log(`   - Descrição: ${lancamento.descricao}`);
    console.log(`   - Status: ${lancamento.status}`);
    console.log(`   - Conta Bancária: ${lancamento.conta_bancaria_id}`);
    console.log(`   - Tipo: ${lancamento.tipo}`);
  });
  
  // Verificar também valores próximos
  console.log('\n🔍 Buscando lançamentos com valores próximos a R$ 25 (20-30)...');
  
  const { data: proximos, error: errorProximos } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('empresa_id', '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d')
    .gte('valor', 20)
    .lte('valor', 30)
    .order('valor');
    
  if (errorProximos) {
    console.error('❌ Erro ao buscar lançamentos próximos:', errorProximos);
    return;
  }
  
  console.log(`📊 Encontrados ${proximos.length} lançamentos com valor entre R$ 20-30:`);
  
  proximos.forEach((lancamento, index) => {
    console.log(`\n${index + 1}. Lançamento ${lancamento.id.substring(0, 8)}:`);
    console.log(`   - Valor: R$ ${lancamento.valor}`);
    console.log(`   - Data: ${lancamento.data_lancamento}`);
    console.log(`   - Descrição: ${lancamento.descricao}`);
    console.log(`   - Status: ${lancamento.status}`);
  });
}

verificarLancamentos().catch(console.error);
