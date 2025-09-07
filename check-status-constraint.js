require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusConstraints() {
  console.log('🔍 Verificando constraints na coluna status...');
  
  // Valores existentes de status
  try {
    console.log('\n1️⃣ Valores existentes de status:');
    const { data: existingStatus, error: statusError } = await supabase
      .from('transaction_matches')
      .select('status')
      .not('status', 'is', null);
      
    if (statusError) {
      console.log('❌ Erro ao buscar status:', statusError);
    } else {
      const uniqueStatus = [...new Set(existingStatus.map(s => s.status))];
      console.log('📋 Status existentes:', uniqueStatus);
    }
  } catch (err) {
    console.log('❌ Erro na verificação:', err.message);
  }
  
  // Testar valores de status
  const testStatusValues = [
    'suggested',
    'confirmed',
    'rejected',
    'pending',
    'matched',
    'unmatched',
    'active',
    'inactive'
  ];
  
  console.log('\n2️⃣ Testando valores permitidos para status:');
  
  for (const testStatus of testStatusValues) {
    try {
      const testRecord = {
        bank_transaction_id: 'd0eb0bc6-c024-4880-a781-e6691ff2842e',
        system_transaction_id: '0e9d53d4-1469-4e28-973b-fc14aa39c972',
        status: testStatus,
        match_type: 'manual',
        confidence_level: 'medium',
        notes: `teste status: ${testStatus}`
      };
      
      const { data, error } = await supabase
        .from('transaction_matches')
        .insert([testRecord])
        .select();
        
      if (error) {
        console.log(`❌ ${testStatus}: ${error.message}`);
      } else {
        console.log(`✅ ${testStatus}: ACEITO`);
        
        // Limpar imediatamente
        await supabase
          .from('transaction_matches')
          .delete()
          .eq('id', data[0].id);
      }
    } catch (err) {
      console.log(`❌ ${testStatus}: ${err.message}`);
    }
  }
}

checkStatusConstraints();
