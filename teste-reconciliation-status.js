const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verificarValoresReconciliationStatus() {
  try {
    console.log('=== 🔍 VALORES PERMITIDOS PARA RECONCILIATION_STATUS ===\n');

    // Verificar valores únicos de reconciliation_status
    const { data: bankStatuses } = await supabase
      .from('bank_transactions')
      .select('reconciliation_status')
      .not('reconciliation_status', 'is', null);

    if (bankStatuses) {
      const uniqueStatuses = [...new Set(bankStatuses.map(item => item.reconciliation_status))];
      console.log('✅ Valores encontrados em reconciliation_status:', uniqueStatuses);
    }

    // Tentar inserir um novo valor para ver se é aceito
    console.log('\n🧪 Testando se "reconciled" é permitido...');
    
    // Buscar uma transação para testar
    const { data: testBank } = await supabase
      .from('bank_transactions')
      .select('id, reconciliation_status')
      .eq('reconciliation_status', 'pending')
      .limit(1);

    if (testBank && testBank.length > 0) {
      const originalId = testBank[0].id;
      const originalStatus = testBank[0].reconciliation_status;
      
      console.log(`Testando alteração na transação ${originalId}:`);
      console.log(`Status atual: ${originalStatus}`);
      
      // Tentar atualizar para "reconciled"
      const { error: reconciled_error } = await supabase
        .from('bank_transactions')
        .update({ reconciliation_status: 'reconciled' })
        .eq('id', originalId);

      if (reconciled_error) {
        console.log('❌ "reconciled" NÃO é permitido:', reconciled_error.message);
      } else {
        console.log('✅ "reconciled" é permitido');
        
        // Reverter para o status original
        await supabase
          .from('bank_transactions')
          .update({ reconciliation_status: originalStatus })
          .eq('id', originalId);
      }

      // Testar outros valores possíveis
      const testValues = ['matched', 'completed', 'confirmed', 'done'];
      
      for (const value of testValues) {
        const { error: test_error } = await supabase
          .from('bank_transactions')
          .update({ reconciliation_status: value })
          .eq('id', originalId);

        if (test_error) {
          console.log(`❌ "${value}" NÃO é permitido`);
        } else {
          console.log(`✅ "${value}" é permitido`);
          // Reverter
          await supabase
            .from('bank_transactions')
            .update({ reconciliation_status: originalStatus })
            .eq('id', originalId);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

verificarValoresReconciliationStatus();
