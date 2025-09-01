const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verificarCamposReconciled() {
  try {
    console.log('=== 🔍 VERIFICANDO CAMPOS DE CONCILIAÇÃO ===\n');

    // Tentar buscar o campo 'reconciled'
    const { data: reconciled1, error: error1 } = await supabase
      .from('lancamentos')
      .select('id, reconciled')
      .limit(1);

    if (error1) {
      console.log('❌ Campo "reconciled" não existe:', error1.message);
    } else {
      console.log('✅ Campo "reconciled" existe:', reconciled1);
    }

    // Tentar buscar possíveis campos relacionados
    const possibleFields = [
      'reconciled',
      'status_conciliacao', 
      'conciliado',
      'conciliation_status',
      'is_reconciled',
      'bank_transaction_id'
    ];

    for (const field of possibleFields) {
      try {
        const { data, error } = await supabase
          .from('lancamentos')
          .select(`id, ${field}`)
          .limit(1);

        if (!error) {
          console.log(`✅ Campo "${field}" existe`);
        }
      } catch (e) {
        console.log(`❌ Campo "${field}" não existe`);
      }
    }

    // Verificar os status possíveis
    console.log('\n🔍 Valores únicos do campo "status":');
    const { data: statusValues } = await supabase
      .from('lancamentos')
      .select('status')
      .not('status', 'is', null);

    if (statusValues) {
      const uniqueStatuses = [...new Set(statusValues.map(item => item.status))];
      console.log('Status únicos encontrados:', uniqueStatuses);
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

verificarCamposReconciled();
