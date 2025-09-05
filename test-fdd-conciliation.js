const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kwxhtujmlrwfpngnkukl.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGh0dWptbHJ3ZnBuZ25rdWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMTUyMzYsImV4cCI6MjA0ODg5MTIzNn0.Wt4Cjz6LBJnYmCGCo7JUJrU1pJl6x_ogtLQ8QX2d7fE'
);

async function findTransferenceTransactions() {
  console.log('🔍 BUSCA: Encontrando transações de transferência com "fdd"');
  console.log('=' .repeat(70));

  try {
    // 1. Buscar todas as transações bancárias de agosto
    console.log('\n📊 Buscando transações bancárias de agosto 2025...');
    
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .gte('posted_at', '2025-08-01')
      .lte('posted_at', '2025-08-31')
      .order('posted_at', { ascending: true });

    if (bankError) {
      console.error('❌ Erro ao buscar transações bancárias:', bankError);
      return;
    }

    console.log(`✅ Total de transações bancárias de agosto: ${bankTransactions.length}`);

    // 2. Filtrar as que contêm "fdd" na descrição
    const fddTransactions = bankTransactions.filter(trans => {
      const desc = (trans.payee || trans.memo || trans.descricao || '').toLowerCase();
      return desc.includes('fdd');
    });

    console.log(`✅ Transações com "fdd": ${fddTransactions.length}`);
    
    fddTransactions.forEach((trans, index) => {
      console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Data: ${trans.posted_at} | Valor: ${trans.amount} | Desc: ${trans.payee || trans.memo || trans.descricao || 'N/A'} | Status: ${trans.status_conciliacao}`);
    });

    if (fddTransactions.length === 0) {
      console.log('⚠️  Nenhuma transação com "fdd" encontrada');
      return;
    }

    // 3. Buscar lançamentos do sistema com "fdd"
    console.log('\n💼 Buscando lançamentos do sistema com "fdd"...');
    
    const { data: systemTransactions, error: systemError } = await supabase
      .from('lancamentos')
      .select('*')
      .gte('data_lancamento', '2025-08-01')
      .lte('data_lancamento', '2025-08-31')
      .ilike('descricao', '%fdd%')
      .order('data_lancamento', { ascending: true });

    if (systemError) {
      console.error('❌ Erro ao buscar lançamentos:', systemError);
      return;
    }

    console.log(`✅ Lançamentos do sistema com "fdd": ${systemTransactions.length}`);
    systemTransactions.forEach((trans, index) => {
      console.log(`   ${index + 1}. ID: ${trans.id.substring(0, 8)}... | Data: ${trans.data_lancamento} | Valor: ${trans.valor} | Desc: ${trans.descricao}`);
    });

    // 4. Encontrar pares com valor 10 para testar
    console.log('\n🎯 Procurando pares com valor 10.00...');
    
    const valor10Bank = fddTransactions.filter(t => Math.abs(t.amount) === 10);
    const valor10System = systemTransactions.filter(t => t.valor === 10);

    console.log(`📊 Transações bancárias valor 10: ${valor10Bank.length}`);
    valor10Bank.forEach((trans, index) => {
      console.log(`   ${index + 1}. Bank ID: ${trans.id.substring(0, 8)}... | Data: ${trans.posted_at} | Status: ${trans.status_conciliacao}`);
    });

    console.log(`📊 Lançamentos sistema valor 10: ${valor10System.length}`);
    valor10System.forEach((trans, index) => {
      console.log(`   ${index + 1}. System ID: ${trans.id.substring(0, 8)}... | Data: ${trans.data_lancamento}`);
    });

    // 5. Se temos pelo menos um par, vamos fazer o teste de conciliação
    if (valor10Bank.length > 0 && valor10System.length > 0) {
      const targetBank = valor10Bank.find(t => t.status_conciliacao === 'pendente') || valor10Bank[0];
      const targetSystem = valor10System[0];

      console.log('\n🧪 TESTE: Vamos conciliar especificamente:');
      console.log(`   Bank: ${targetBank.id} (${targetBank.posted_at})`);
      console.log(`   System: ${targetSystem.id} (${targetSystem.data_lancamento})`);

      // Contar quantas transações de valor 10 estão pendentes ANTES
      const pendentesAntes = valor10Bank.filter(t => t.status_conciliacao === 'pendente').length;
      console.log(`   Pendentes ANTES: ${pendentesAntes}`);

      // Fazer a conciliação
      console.log('\n🔄 Executando conciliação...');
      
      const response = await fetch('http://localhost:3000/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: targetBank.id,
          system_transaction_id: targetSystem.id,
          confidence_level: 'manual',
          rule_applied: 'test_specific_fdd'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Conciliação realizada:', result.message);

        // Verificar resultado
        const { data: updatedBanks } = await supabase
          .from('bank_transactions')
          .select('*')
          .in('id', valor10Bank.map(t => t.id));

        const pendentesDepois = updatedBanks.filter(t => t.status_conciliacao === 'pendente').length;
        const conciliadasDepois = updatedBanks.filter(t => t.status_conciliacao === 'conciliado').length;

        console.log(`   Pendentes DEPOIS: ${pendentesDepois}`);
        console.log(`   Conciliadas DEPOIS: ${conciliadasDepois}`);

        const diferencaPendentes = pendentesAntes - pendentesDepois;
        
        if (diferencaPendentes === 1) {
          console.log('✅ CORRETO: Apenas 1 transação foi conciliada');
        } else if (diferencaPendentes > 1) {
          console.log(`❌ PROBLEMA: ${diferencaPendentes} transações foram conciliadas ao invés de 1!`);
          
          // Mostrar quais foram conciliadas
          updatedBanks.forEach(updated => {
            const original = valor10Bank.find(orig => orig.id === updated.id);
            if (original.status_conciliacao !== updated.status_conciliacao) {
              const isTarget = updated.id === targetBank.id;
              console.log(`   🔄 ${updated.id.substring(0, 8)}... foi conciliada ${isTarget ? '(CORRETA)' : '(INCORRETA)'}`);
            }
          });
        }

      } else {
        console.error('❌ Erro na conciliação:', await response.text());
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

findTransferenceTransactions();
