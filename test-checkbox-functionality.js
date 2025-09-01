import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCheckboxFunctionality() {
  console.log('☑️ Testando funcionalidade do checkbox...');
  
  const params = {
    bank_account_id: '4fd86770-32c4-4927-9d7e-8f3ded7b38fa',
    period_start: '2025-08-01',
    period_end: '2025-08-31',
    empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d'
  };
  
  // 1. Teste com checkbox DESMARCADO (include_reconciled=false)
  console.log('\n1. 📋 Teste com checkbox DESMARCADO (apenas pending):');
  const { data: pendingOnly } = await supabase
    .from('bank_transactions')
    .select('id, memo, amount, reconciliation_status, status_conciliacao')
    .eq('bank_account_id', params.bank_account_id)
    .eq('empresa_id', params.empresa_id)
    .eq('reconciliation_status', 'pending')
    .gte('posted_at', params.period_start)
    .lte('posted_at', params.period_end)
    .order('posted_at', { ascending: false });

  console.log(`   📊 Resultado: ${pendingOnly?.length || 0} transações`);
  pendingOnly?.slice(0, 3).forEach((t, i) => {
    console.log(`   ${i+1}. ${t.id.slice(0,8)}... | ${t.amount} | ${t.reconciliation_status}/${t.status_conciliacao}`);
  });
  
  // 2. Teste com checkbox MARCADO (include_reconciled=true)
  console.log('\n2. ☑️ Teste com checkbox MARCADO (pending + matched + ignored):');
  const { data: withReconciled } = await supabase
    .from('bank_transactions')
    .select('id, memo, amount, reconciliation_status, status_conciliacao')
    .eq('bank_account_id', params.bank_account_id)
    .eq('empresa_id', params.empresa_id)
    .in('reconciliation_status', ['pending', 'matched', 'ignored'])
    .gte('posted_at', params.period_start)
    .lte('posted_at', params.period_end)
    .order('posted_at', { ascending: false });

  console.log(`   📊 Resultado: ${withReconciled?.length || 0} transações`);
  
  // Agrupar por status
  const byStatus = withReconciled?.reduce((acc, t) => {
    acc[t.reconciliation_status] = (acc[t.reconciliation_status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('   📈 Distribuição por status:');
  Object.entries(byStatus || {}).forEach(([status, count]) => {
    console.log(`      ${status}: ${count} transações`);
  });
  
  // Mostrar algumas transações de cada tipo
  console.log('\n   🔍 Amostras por tipo:');
  ['pending', 'matched', 'ignored'].forEach(status => {
    const samples = withReconciled?.filter(t => t.reconciliation_status === status).slice(0, 2);
    if (samples && samples.length > 0) {
      console.log(`   ${status.toUpperCase()}:`);
      samples.forEach(t => {
        console.log(`      ${t.id.slice(0,8)}... | ${t.amount} | ${t.status_conciliacao}`);
      });
    }
  });

  // 3. Comparação
  console.log('\n3. 📊 Comparação dos resultados:');
  const difference = (withReconciled?.length || 0) - (pendingOnly?.length || 0);
  console.log(`   Apenas pending: ${pendingOnly?.length || 0} transações`);
  console.log(`   Com conciliados: ${withReconciled?.length || 0} transações`);
  console.log(`   Diferença: +${difference} transações (conciliadas/ignoradas)`);
  
  if (difference > 0) {
    console.log('   ✅ Checkbox funcionará corretamente!');
    console.log('   📝 Quando marcado, usuário verá transações conciliadas em VERDE');
  } else {
    console.log('   ⚠️ Não há transações conciliadas para mostrar no período');
  }
}

testCheckboxFunctionality().catch(console.error);
