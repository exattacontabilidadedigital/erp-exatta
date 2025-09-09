require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarCenarioTesteMulriplo() {
  try {
    console.log('🔧 Criando cenário de teste para múltiplos lançamentos...');

    // Usar a primeira transação bancária disponível (R$ 10)
    const bankTransactionId = 'cf663e76-4c56-4231-9e87-78475e50b414';
    const valorBanco = 10;

    console.log(`\n💰 Usando transação bancária ID: ${bankTransactionId}`);
    console.log(`💰 Valor no banco: R$ ${valorBanco}`);

    // Vamos criar dois lançamentos que somem R$ 10:
    // 1. R$ 6 - Compra de material 
    // 2. R$ 4 - Taxa de manutenção

    console.log('\n📝 Criando primeiro lançamento (R$ 6)...');
    const { data: lancamento1, error: error1 } = await supabase
      .from('lancamentos')
      .insert({
        tipo: 'despesa',
        numero_documento: 'TEST-001',
        data_lancamento: '2025-09-08',
        descricao: 'Compra de material para teste múltiplo',
        valor: 6.00,
        status: 'pago',
        bank_transaction_id: bankTransactionId,
        is_multiple_match: true,
        match_group_size: 2,
        empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d'
      })
      .select()
      .single();

    if (error1) {
      console.error('Erro ao criar lançamento 1:', error1);
      return;
    }

    console.log('✅ Primeiro lançamento criado:', lancamento1.id);

    console.log('\n📝 Criando segundo lançamento (R$ 4)...');
    const { data: lancamento2, error: error2 } = await supabase
      .from('lancamentos')
      .insert({
        tipo: 'despesa',
        numero_documento: 'TEST-002',
        data_lancamento: '2025-09-08',
        descricao: 'Taxa de manutenção para teste múltiplo',
        valor: 4.00,
        status: 'pago',
        bank_transaction_id: bankTransactionId,
        is_multiple_match: true,
        match_group_size: 2,
        empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d'
      })
      .select()
      .single();

    if (error2) {
      console.error('Erro ao criar lançamento 2:', error2);
      return;
    }

    console.log('✅ Segundo lançamento criado:', lancamento2.id);

    // Atualizar o status da transação bancária
    console.log('\n🔄 Atualizando status da transação bancária...');
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({
        reconciliation_status: 'sugerido',
        match_count: 2
      })
      .eq('id', bankTransactionId);

    if (updateError) {
      console.error('Erro ao atualizar transação bancária:', updateError);
      return;
    }

    console.log('✅ Transação bancária atualizada!');

    console.log('\n🎯 Cenário de teste criado com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - Transação bancária: R$ ${valorBanco}`);
    console.log(`   - Lançamento 1: R$ 6.00`);
    console.log(`   - Lançamento 2: R$ 4.00`);
    console.log(`   - Total lançamentos: R$ 10.00`);
    console.log(`   - Status: múltiplos lançamentos criados`);

    console.log('\n🌐 Agora você pode acessar http://localhost:3000 para ver o card exibindo a soma dos múltiplos lançamentos!');

  } catch (error) {
    console.error('Erro durante criação do cenário:', error);
  }
}

criarCenarioTesteMulriplo();
