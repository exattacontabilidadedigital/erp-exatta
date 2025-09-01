// Teste de seletor de período para conciliação
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oauvovqfntzcafwvosme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdXZvdnFmbnR6Y2Fmd3Zvc21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NTI2NzcsImV4cCI6MjA1MDEyODY3N30.bhTrqGY9E9pTUnJIYXJOdJOJ3nwQ8VQZqoUnFRwXDCk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPeriodSelector() {
  console.log('🗓️ Testando seletor de período...');
  
  const bankAccountId = '8ad0f3fb-88cc-4f39-8d50-f47efb3a5486';
  
  // Testar dados de diferentes meses
  const months = [
    { mes: '08', ano: '2025', nome: 'Agosto 2025' },
    { mes: '09', ano: '2025', nome: 'Setembro 2025' },
    { mes: '07', ano: '2025', nome: 'Julho 2025' }
  ];
  
  for (const period of months) {
    console.log(`\n📅 Testando período: ${period.nome}`);
    
    const periodStart = `${period.ano}-${period.mes.padStart(2, '0')}-01`;
    const lastDay = new Date(Number(period.ano), Number(period.mes), 0).getDate();
    const periodEnd = `${period.ano}-${period.mes.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    console.log(`   📊 Período: ${periodStart} até ${periodEnd}`);
    
    // Contar transações bancárias
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', bankAccountId)
      .gte('posted_at', periodStart)
      .lte('posted_at', periodEnd);
    
    if (bankError) {
      console.error('   ❌ Erro ao buscar transações bancárias:', bankError);
    } else {
      console.log(`   🏦 Transações bancárias: ${bankTransactions.length}`);
    }
    
    // Contar lançamentos do sistema
    const { data: systemTransactions, error: systemError } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('empresa_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
      .gte('data_lancamento', periodStart)
      .lte('data_lancamento', periodEnd);
    
    if (systemError) {
      console.error('   ❌ Erro ao buscar lançamentos:', systemError);
    } else {
      console.log(`   📋 Lançamentos do sistema: ${systemTransactions.length}`);
    }
  }
  
  console.log('\n✅ Teste do seletor de período concluído!');
}

testPeriodSelector().catch(console.error);
