const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kwxhtujmlrwfpngnkukl.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGh0dWptbHJ3ZnBuZ25rdWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMTUyMzYsImV4cCI6MjA0ODg5MTIzNn0.Wt4Cjz6LBJnYmCGCo7JUJrU1pJl6x_ogtLQ8QX2d7fE'
);

async function testSpecificConciliation() {
  console.log('🧪 TESTE: Conciliação Específica de Transferência [19/08/2025 - R$ 10,00]');
  console.log('=' .repeat(80));

  try {
    // 1. Buscar transações bancárias específicas (19/08/2025, valor 10.00, transferência)
    console.log('\n📊 1. Buscando transações bancárias do dia 19/08/2025 com valor 10.00...');
    
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('data_transacao', '2025-08-19')
      .eq('valor', 10.00)
      .ilike('descricao', '%transfer%')
      .eq('status_conciliacao', 'pendente')
      .order('created_at', { ascending: true });

    if (bankError) {
      console.error('❌ Erro ao buscar transações bancárias:', bankError);
      return;
    }

    console.log(`✅ Encontradas ${bankTransactions.length} transações bancárias:`);
    bankTransactions.forEach((trans, index) => {
      console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Valor: R$ ${trans.valor} | Desc: ${trans.descricao.substring(0, 50)}...`);
    });

    if (bankTransactions.length === 0) {
      console.log('⚠️  Nenhuma transação bancária encontrada para testar');
      return;
    }

    // 2. Buscar transações do sistema correspondentes
    console.log('\n💼 2. Buscando transações do sistema correspondentes...');
    
    const { data: systemTransactions, error: systemError } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('data_lancamento', '2025-08-19')
      .eq('valor', 10.00)
      .ilike('descricao', '%transfer%')
      .order('created_at', { ascending: true });

    if (systemError) {
      console.error('❌ Erro ao buscar lançamentos:', systemError);
      return;
    }

    console.log(`✅ Encontrados ${systemTransactions.length} lançamentos do sistema:`);
    systemTransactions.forEach((trans, index) => {
      console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Valor: R$ ${trans.valor} | Desc: ${trans.descricao.substring(0, 50)}...`);
    });

    if (systemTransactions.length === 0) {
      console.log('⚠️  Nenhum lançamento do sistema encontrado para testar');
      return;
    }

    // 3. Verificar estado atual dos matches
    console.log('\n🔗 3. Verificando matches existentes...');
    
    const bankIds = bankTransactions.map(t => t.id);
    const { data: existingMatches, error: matchError } = await supabase
      .from('transaction_matches')
      .select('*')
      .in('bank_transaction_id', bankIds);

    if (matchError) {
      console.error('❌ Erro ao buscar matches:', matchError);
      return;
    }

    console.log(`✅ Matches existentes: ${existingMatches.length}`);
    existingMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. Bank: ${match.bank_transaction_id.substring(0, 8)}... → System: ${match.system_transaction_id.substring(0, 8)}... | Status: ${match.status}`);
    });

    // 4. Simular conciliação da PRIMEIRA transação bancária com a PRIMEIRA do sistema
    const targetBankTrans = bankTransactions[0];
    const targetSystemTrans = systemTransactions[0];

    console.log(`\n🎯 4. Simulando conciliação específica:`);
    console.log(`   Bank Transaction: ${targetBankTrans.id}`);
    console.log(`   System Transaction: ${targetSystemTrans.id}`);
    console.log(`   Descrição Bank: ${targetBankTrans.descricao}`);
    console.log(`   Descrição System: ${targetSystemTrans.descricao}`);

    // 5. Chamar a API de conciliação
    console.log('\n🔄 5. Chamando API de conciliação...');
    
    const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: targetBankTrans.id,
        system_transaction_id: targetSystemTrans.id,
        confidence_level: 'manual',
        rule_applied: 'test_manual_selection'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Resultado da API:', result);

    // 6. Verificar quais transações foram afetadas
    console.log('\n🔍 6. Verificando quais transações foram REALMENTE afetadas...');
    
    const { data: updatedBankTransactions, error: updatedBankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('data_transacao', '2025-08-19')
      .eq('valor', 10.00)
      .ilike('descricao', '%transfer%')
      .order('created_at', { ascending: true });

    if (updatedBankError) {
      console.error('❌ Erro ao verificar transações atualizadas:', updatedBankError);
      return;
    }

    console.log('\n📋 Estado atual das transações bancárias:');
    updatedBankTransactions.forEach((trans, index) => {
      const wasTarget = trans.id === targetBankTrans.id ? ' ← ALVO' : '';
      console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Status: ${trans.status_conciliacao} | Match: ${trans.matched_lancamento_id?.substring(0, 8) || 'N/A'}${wasTarget}`);
    });

    // 7. Verificar matches criados/atualizados
    console.log('\n🔗 7. Verificando matches criados/atualizados...');
    
    const { data: finalMatches, error: finalMatchError } = await supabase
      .from('transaction_matches')
      .select('*')
      .in('bank_transaction_id', bankIds);

    if (finalMatchError) {
      console.error('❌ Erro ao verificar matches finais:', finalMatchError);
      return;
    }

    console.log(`\n📊 Matches após conciliação: ${finalMatches.length}`);
    finalMatches.forEach((match, index) => {
      const isNew = !existingMatches.find(m => m.id === match.id) ? ' [NOVO]' : '';
      console.log(`   ${index + 1}. Bank: ${match.bank_transaction_id.substring(0, 8)}... → System: ${match.system_transaction_id.substring(0, 8)}... | Status: ${match.status}${isNew}`);
    });

    // 8. Análise do resultado
    console.log('\n🎯 8. ANÁLISE DO RESULTADO:');
    const conciliadasAntes = bankTransactions.filter(t => t.status_conciliacao === 'conciliado').length;
    const conciliadasDepois = updatedBankTransactions.filter(t => t.status_conciliacao === 'conciliado').length;
    const diferencaConciliadas = conciliadasDepois - conciliadasAntes;

    console.log(`   • Transações conciliadas ANTES: ${conciliadasAntes}`);
    console.log(`   • Transações conciliadas DEPOIS: ${conciliadasDepois}`);
    console.log(`   • DIFERENÇA: ${diferencaConciliadas}`);

    if (diferencaConciliadas === 1) {
      console.log('✅ SUCESSO: Apenas 1 transação foi conciliada (comportamento correto)');
    } else if (diferencaConciliadas > 1) {
      console.log(`❌ PROBLEMA IDENTIFICADO: ${diferencaConciliadas} transações foram conciliadas quando deveria ser apenas 1!`);
      
      // Identificar quais foram conciliadas
      const novasConciliadas = updatedBankTransactions.filter(t => 
        t.status_conciliacao === 'conciliado' && 
        !bankTransactions.find(orig => orig.id === t.id && orig.status_conciliacao === 'conciliado')
      );
      
      console.log('\n🚨 Transações INCORRETAMENTE conciliadas:');
      novasConciliadas.forEach((trans, index) => {
        const isTarget = trans.id === targetBankTrans.id ? ' (Era o alvo correto)' : ' (Conciliada por engano!)';
        console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Desc: ${trans.descricao.substring(0, 40)}...${isTarget}`);
      });
    } else {
      console.log('⚠️  Nenhuma transação foi conciliada - pode haver outro problema');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testSpecificConciliation();
