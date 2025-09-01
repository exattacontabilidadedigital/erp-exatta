// Teste específico para dados de agosto 2025
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oauvovqfntzcafwvosme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdXZvdnFmbnR6Y2Fmd3Zvc21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NTI2NzcsImV4cCI6MjA1MDEyODY3N30.bhTrqGY9E9pTUnJIYXJOdJOJ3nwQ8VQZqoUnFRwXDCk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAugustData() {
  console.log('🔍 Testando dados específicos de AGOSTO 2025...');
  
  const bankAccountId = '8ad0f3fb-88cc-4f39-8d50-f47efb3a5486';
  const empresaId = '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d';
  
  // Período exato de agosto
  const periodStart = '2025-08-01';
  const periodEnd = '2025-08-31';
  
  console.log(`📅 Período: ${periodStart} até ${periodEnd}`);
  console.log(`🏦 Conta: ${bankAccountId}`);
  console.log(`🏢 Empresa: ${empresaId}`);
  
  try {
    // Buscar transações bancárias de agosto
    console.log('\n🏦 Buscando transações bancárias...');
    const { data: bankTransactions, error: bankError, count: bankCount } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact' })
      .eq('bank_account_id', bankAccountId)
      .eq('empresa_id', empresaId)
      .gte('posted_at', periodStart)
      .lte('posted_at', periodEnd);
    
    if (bankError) {
      console.error('❌ Erro transações bancárias:', bankError);
    } else {
      console.log(`✅ Transações bancárias encontradas: ${bankCount}`);
      if (bankTransactions.length > 0) {
        console.log('📄 Exemplos:');
        bankTransactions.slice(0, 3).forEach((tx, i) => {
          console.log(`   ${i+1}. ${tx.posted_at} | ${tx.amount} | ${tx.memo || 'Sem memo'}`);
        });
      }
    }
    
    // Buscar lançamentos do sistema de agosto
    console.log('\n💼 Buscando lançamentos do sistema...');
    const { data: systemTransactions, error: systemError, count: systemCount } = await supabase
      .from('lancamentos')
      .select('*', { count: 'exact' })
      .eq('empresa_id', empresaId)
      .gte('data_lancamento', periodStart)
      .lte('data_lancamento', periodEnd);
    
    if (systemError) {
      console.error('❌ Erro lançamentos:', systemError);
    } else {
      console.log(`✅ Lançamentos encontrados: ${systemCount}`);
      if (systemTransactions.length > 0) {
        console.log('📄 Exemplos:');
        systemTransactions.slice(0, 3).forEach((tx, i) => {
          console.log(`   ${i+1}. ${tx.data_lancamento} | ${tx.valor} | ${tx.descricao}`);
        });
      }
    }
    
    // Verificar se há dados suficientes para exibir cards
    console.log('\n📊 RESUMO PARA AGOSTO 2025:');
    console.log(`   Transações bancárias: ${bankCount || 0}`);
    console.log(`   Lançamentos sistema: ${systemCount || 0}`);
    console.log(`   Total de possíveis cards: ${(bankCount || 0) + (systemCount || 0)}`);
    
    if ((bankCount || 0) > 0 || (systemCount || 0) > 0) {
      console.log('✅ HÁ DADOS SUFICIENTES PARA MOSTRAR CARDS!');
    } else {
      console.log('❌ NÃO HÁ DADOS - Cards não aparecerão');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAugustData();
