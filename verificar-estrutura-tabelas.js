const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verificarEstruturaTabelasECampos() {
  try {
    console.log('=== 🔍 VERIFICANDO ESTRUTURA DAS TABELAS ===\n');

    // 1. Verificar campos da tabela bank_transactions
    console.log('🏦 Campos da tabela bank_transactions:');
    const { data: bankTransSample, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .limit(1);

    if (bankError) {
      console.error('❌ Erro ao buscar bank_transactions:', bankError);
    } else if (bankTransSample && bankTransSample.length > 0) {
      console.log('Campos disponíveis:', Object.keys(bankTransSample[0]));
    }

    // 2. Verificar campos da tabela lancamentos
    console.log('\n💰 Campos da tabela lancamentos:');
    const { data: lancamentosSample, error: lancamentosError } = await supabase
      .from('lancamentos')
      .select('*')
      .limit(1);

    if (lancamentosError) {
      console.error('❌ Erro ao buscar lancamentos:', lancamentosError);
    } else if (lancamentosSample && lancamentosSample.length > 0) {
      console.log('Campos disponíveis:', Object.keys(lancamentosSample[0]));
    }

    // 3. Verificar se o campo correto é 'reconciled' ou outro
    console.log('\n🔍 Sample de lançamento para ver status:');
    const { data: lancamentoDetail } = await supabase
      .from('lancamentos')
      .select('id, reconciled, status, tipo, descricao')
      .limit(3);

    if (lancamentoDetail) {
      lancamentoDetail.forEach((item, index) => {
        console.log(`Lançamento ${index + 1}:`, {
          id: item.id,
          reconciled: item.reconciled,
          status: item.status,
          tipo: item.tipo,
          descricao: item.descricao
        });
      });
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar a verificação
verificarEstruturaTabelasECampos();
