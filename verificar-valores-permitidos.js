const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verificarValoresPermitidos() {
  try {
    console.log('=== 🔍 VERIFICANDO VALORES PERMITIDOS ===\n');

    // 1. Verificar valores únicos de reconciliation_status
    console.log('🏦 Valores únicos de reconciliation_status:');
    const { data: bankStatuses } = await supabase
      .from('bank_transactions')
      .select('reconciliation_status')
      .not('reconciliation_status', 'is', null);

    if (bankStatuses) {
      const uniqueStatuses = [...new Set(bankStatuses.map(item => item.reconciliation_status))];
      console.log('reconciliation_status permitidos:', uniqueStatuses);
    }

    // 2. Verificar valores únicos de status_conciliacao
    console.log('\n🏦 Valores únicos de status_conciliacao:');
    const { data: statusConciliacao } = await supabase
      .from('bank_transactions')
      .select('status_conciliacao')
      .not('status_conciliacao', 'is', null);

    if (statusConciliacao) {
      const uniqueStatuses = [...new Set(statusConciliacao.map(item => item.status_conciliacao))];
      console.log('status_conciliacao permitidos:', uniqueStatuses);
    }

    // 3. Verificar valores únicos de confidence_level em transaction_matches
    console.log('\n🔗 Valores únicos de confidence_level:');
    const { data: confidences } = await supabase
      .from('transaction_matches')
      .select('confidence_level')
      .not('confidence_level', 'is', null);

    if (confidences) {
      const uniqueConfidences = [...new Set(confidences.map(item => item.confidence_level))];
      console.log('confidence_level permitidos:', uniqueConfidences);
    }

    // 4. Verificar valores únicos de status em transaction_matches
    console.log('\n🔗 Valores únicos de status em transaction_matches:');
    const { data: matchStatuses } = await supabase
      .from('transaction_matches')
      .select('status')
      .not('status', 'is', null);

    if (matchStatuses) {
      const uniqueStatuses = [...new Set(matchStatuses.map(item => item.status))];
      console.log('status permitidos:', uniqueStatuses);
    }

    // 5. Testar com valores existentes
    console.log('\n🧪 Testando com valores conhecidos...');
    
    // Buscar uma transação existente conciliada para ver os valores
    const { data: reconciledExample } = await supabase
      .from('bank_transactions')
      .select('*')
      .not('matched_lancamento_id', 'is', null)
      .limit(1);

    if (reconciledExample && reconciledExample.length > 0) {
      console.log('Exemplo de transação conciliada:', {
        reconciliation_status: reconciledExample[0].reconciliation_status,
        status_conciliacao: reconciledExample[0].status_conciliacao,
        match_confidence: reconciledExample[0].match_confidence
      });
    }

    // Buscar exemplo de match
    const { data: matchExample } = await supabase
      .from('transaction_matches')
      .select('*')
      .limit(1);

    if (matchExample && matchExample.length > 0) {
      console.log('Exemplo de match:', {
        confidence_level: matchExample[0].confidence_level,
        status: matchExample[0].status,
        match_type: matchExample[0].match_type
      });
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

verificarValoresPermitidos();
