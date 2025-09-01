// Script para adicionar dados de teste válidos no banco
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestData() {
  console.log('🧪 Adicionando dados de teste válidos...\n');
  
  // Conta bancária de teste
  const testAccount = {
    id: '4fd86770-32c4-4927-9d7e-8f3ded7b38fa',
    empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d',
    name: 'Banco do Brasil - Teste',
    account_number: '12345-6',
    routing_number: '1234-5',
    bank_name: 'Banco do Brasil'
  };

  // Transação bancária de teste
  const testBankTransaction = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    account_id: testAccount.id,
    transaction_date: '2025-09-15',
    amount: -500.00,
    memo: 'Teste de desconciliação',
    payee: 'Teste Payee',
    reconciliation_status: 'reconciled',
    status_conciliacao: 'conciliado',
    matched_lancamento_id: '550e8400-e29b-41d4-a716-446655440033'
  };

  // Lançamento do sistema
  const testSystemTransaction = {
    id: '550e8400-e29b-41d4-a716-446655440033',
    empresa_id: testAccount.empresa_id,
    data: '2025-09-15',
    valor: 500.00,
    descricao: 'Teste de desconciliação',
    status: 'pago',
    tipo: 'saida',
    categoria: 'teste'
  };

  try {
    // 1. Verificar/Inserir conta bancária
    const { data: existingAccount, error: accountError } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('id', testAccount.id)
      .single();

    if (accountError && accountError.code === 'PGRST116') {
      console.log('➕ Inserindo conta bancária de teste...');
      const { error: insertAccountError } = await supabase
        .from('bank_accounts')
        .insert(testAccount);
      
      if (insertAccountError) {
        console.error('❌ Erro ao inserir conta bancária:', insertAccountError);
      } else {
        console.log('✅ Conta bancária inserida');
      }
    } else if (existingAccount) {
      console.log('✅ Conta bancária já existe');
    }

    // 2. Verificar/Inserir lançamento do sistema
    const { data: existingLancamento, error: lancamentoError } = await supabase
      .from('lancamentos')
      .select('id')
      .eq('id', testSystemTransaction.id)
      .single();

    if (lancamentoError && lancamentoError.code === 'PGRST116') {
      console.log('➕ Inserindo lançamento de teste...');
      const { error: insertLancamentoError } = await supabase
        .from('lancamentos')
        .insert(testSystemTransaction);
      
      if (insertLancamentoError) {
        console.error('❌ Erro ao inserir lançamento:', insertLancamentoError);
      } else {
        console.log('✅ Lançamento inserido');
      }
    } else if (existingLancamento) {
      console.log('✅ Lançamento já existe');
    }

    // 3. Verificar/Inserir transação bancária
    const { data: existingBank, error: bankError } = await supabase
      .from('bank_transactions')
      .select('id')
      .eq('id', testBankTransaction.id)
      .single();

    if (bankError && bankError.code === 'PGRST116') {
      console.log('➕ Inserindo transação bancária de teste...');
      const { error: insertBankError } = await supabase
        .from('bank_transactions')
        .insert(testBankTransaction);
      
      if (insertBankError) {
        console.error('❌ Erro ao inserir transação bancária:', insertBankError);
      } else {
        console.log('✅ Transação bancária inserida');
      }
    } else if (existingBank) {
      console.log('✅ Transação bancária já existe');
    }

    console.log('\n🎯 Dados de teste criados com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - Conta: ${testAccount.id}`);
    console.log(`   - Transação Bancária: ${testBankTransaction.id}`);
    console.log(`   - Lançamento: ${testSystemTransaction.id}`);
    console.log('\n🌐 URL de teste:');
    console.log(`   http://localhost:3000/conciliacao?conta_id=${testAccount.id}&conta_nome=${encodeURIComponent(testAccount.name)}&banco=${encodeURIComponent(testAccount.bank_name)}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

addTestData().catch(console.error);
