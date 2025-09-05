// =====================================
// TESTE COMPLETO DO SISTEMA DE CONCILIAÇÃO
// Validação das melhorias implementadas
// =====================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🧪 INICIANDO BATERIA DE TESTES COMPLETA - SISTEMA DE CONCILIAÇÃO');
console.log('=' .repeat(80));

// =====================================
// 1. TESTE DUPLICATE PREVENTION - API LANCAMENTOS
// =====================================
async function testDuplicatePreventionSearch() {
  console.log('\n1️⃣ TESTANDO PREVENÇÃO DE DUPLICATAS - BUSCA DE LANÇAMENTOS');
  
  try {
    // Simular busca de lançamentos para reconciliação
    const response = await fetch('/api/lancamentos?empresa_id=1&search=test&limit=10', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.error('❌ Falha na requisição:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API respondeu corretamente');
    console.log('📊 Lançamentos retornados:', data.length || 0);
    
    // Verificar se transações já reconciliadas foram excluídas
    if (data.length > 0) {
      console.log('🔍 Verificando se há transações já reconciliadas nos resultados...');
      
      // Verificar se alguma dessas transações já está em matches confirmados
      const systemIds = data.map(item => item.id);
      
      const { data: existingMatches } = await supabase
        .from('transaction_matches')
        .select('system_transaction_id')
        .in('system_transaction_id', systemIds)
        .eq('status', 'confirmed');
      
      if (existingMatches && existingMatches.length > 0) {
        console.log('⚠️ PROBLEMA: Encontradas transações já reconciliadas nos resultados');
        console.log('🔍 IDs problemáticos:', existingMatches.map(m => m.system_transaction_id));
      } else {
        console.log('✅ SUCESSO: Nenhuma transação já reconciliada foi retornada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de busca:', error);
  }
}

// =====================================
// 2. TESTE DUPLICATE PREVENTION - API CONCILIAÇÃO
// =====================================
async function testDuplicatePreventionConciliation() {
  console.log('\n2️⃣ TESTANDO PREVENÇÃO DE DUPLICATAS - CONCILIAÇÃO');
  
  try {
    // Buscar uma transação bancária e um lançamento de exemplo
    const { data: bankTransactions } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('status_conciliacao', 'pendente')
      .limit(1);
    
    const { data: systemTransactions } = await supabase
      .from('lancamentos')
      .select('*')
      .limit(1);
    
    if (!bankTransactions?.length || !systemTransactions?.length) {
      console.log('⚠️ Dados de teste insuficientes');
      return;
    }
    
    const bankTx = bankTransactions[0];
    const systemTx = systemTransactions[0];
    
    console.log('🧪 Testando conciliação:', {
      bank_id: bankTx.id,
      system_id: systemTx.id
    });
    
    // Tentar primeira conciliação
    const response1 = await fetch('/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: bankTx.id,
        system_transaction_id: systemTx.id,
        confidence: '100%',
        user_id: 'test-user'
      })
    });
    
    console.log('🔍 Primeira tentativa:', response1.status);
    
    if (response1.ok) {
      console.log('✅ Primeira conciliação aceita');
      
      // Tentar segunda conciliação (deve ser rejeitada)
      const response2 = await fetch('/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: bankTx.id,
          system_transaction_id: systemTx.id,
          confidence: '100%',
          user_id: 'test-user-2'
        })
      });
      
      if (response2.status === 409) {
        console.log('✅ SUCESSO: Segunda tentativa rejeitada com 409 (correto)');
      } else {
        console.log('⚠️ PROBLEMA: Segunda tentativa não foi rejeitada:', response2.status);
      }
    } else {
      console.log('⚠️ Primeira conciliação falhou:', response1.status);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de conciliação:', error);
  }
}

// =====================================
// 3. TESTE CLEAN CONFLICTS API
// =====================================
async function testCleanConflictsAPI() {
  console.log('\n3️⃣ TESTANDO API DE LIMPEZA DE CONFLITOS');
  
  try {
    // Buscar uma conta bancária para teste
    const { data: accounts } = await supabase
      .from('bank_accounts')
      .select('id, empresa_id')
      .limit(1);
    
    if (!accounts?.length) {
      console.log('⚠️ Nenhuma conta bancária encontrada para teste');
      return;
    }
    
    const account = accounts[0];
    
    console.log('🧪 Testando limpeza para conta:', account.id);
    
    const response = await fetch('/api/reconciliation/clean-conflicts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: account.empresa_id,
        bank_account_id: account.id
      })
    });
    
    if (!response.ok) {
      console.log('❌ API retornou erro:', response.status);
      const errorData = await response.json();
      console.log('🔍 Detalhes do erro:', errorData);
      return;
    }
    
    const result = await response.json();
    console.log('✅ API funcionou corretamente');
    console.log('📊 Resultado:', {
      success: result.success,
      conflicts_cleaned: result.conflicts_cleaned,
      message: result.message
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de limpeza:', error);
  }
}

// =====================================
// 4. TESTE TRANSFER VALIDATION
// =====================================
async function testTransferValidation() {
  console.log('\n4️⃣ TESTANDO VALIDAÇÃO RÍGIDA DE TRANSFERÊNCIAS');
  
  // Casos de teste para validação de transferências
  const testCases = [
    // Caso 1: Transferência válida
    {
      memo: 'TED TRANSFERENCIA ENVIADA PARA CONTA 12345',
      amount: -1000,
      type: 'DEBIT',
      expected: true,
      description: 'Transferência válida com keyword TED'
    },
    // Caso 2: Não é transferência
    {
      memo: 'PAGAMENTO DE FORNECEDOR',
      amount: -500,
      type: 'DEBIT',
      expected: false,
      description: 'Pagamento comum sem keywords de transferência'
    },
    // Caso 3: Flexível rejeitado
    {
      memo: 'COMPRA OU TRANSFERENCIA', 
      amount: -200,
      type: 'DEBIT',
      expected: false,
      description: 'Caso flexível que deve ser rejeitado'
    },
    // Caso 4: PIX válido
    {
      memo: 'PIX ENVIADO CHAVE 123456789',
      amount: -300,
      type: 'DEBIT',
      expected: true,
      description: 'PIX válido'
    }
  ];
  
  console.log('🧪 Executando casos de teste de transferência...');
  
  testCases.forEach((testCase, index) => {
    // Simular a lógica de validação rígida
    const transferKeywords = ['TED', 'DOC', 'PIX', 'TRANSFERENCIA', 'TRANSFER'];
    const isTransfer = transferKeywords.some(keyword => 
      testCase.memo.toUpperCase().includes(keyword)
    );
    
    const result = isTransfer === testCase.expected;
    console.log(`${result ? '✅' : '❌'} Caso ${index + 1}: ${testCase.description}`);
    console.log(`   📝 Input: "${testCase.memo}"`);
    console.log(`   🎯 Esperado: ${testCase.expected}, Obtido: ${isTransfer}`);
    
    if (!result) {
      console.log('   ⚠️ FALHA NA VALIDAÇÃO!');
    }
  });
}

// =====================================
// 5. TESTE INTEGRIDADE TRANSACTION_MATCHES
// =====================================
async function testTransactionMatchesIntegrity() {
  console.log('\n5️⃣ TESTANDO INTEGRIDADE DA TABELA TRANSACTION_MATCHES');
  
  try {
    // Verificar matches órfãos
    const { data: orphanedMatches, error: orphanError } = await supabase
      .from('transaction_matches')
      .select(`
        id,
        bank_transaction_id,
        system_transaction_id,
        status,
        bank_transactions!inner(
          id,
          status_conciliacao
        )
      `)
      .eq('status', 'confirmed')
      .neq('bank_transactions.status_conciliacao', 'conciliado');
    
    if (orphanError) {
      console.error('❌ Erro ao verificar matches órfãos:', orphanError);
      return;
    }
    
    console.log('🔍 Matches órfãos encontrados:', orphanedMatches?.length || 0);
    
    if (orphanedMatches && orphanedMatches.length > 0) {
      console.log('⚠️ PROBLEMAS DETECTADOS:');
      orphanedMatches.forEach(match => {
        console.log(`   - Match ${match.id}: bank_tx ${match.bank_transaction_id} está pendente mas match confirmado`);
      });
    } else {
      console.log('✅ Nenhum match órfão detectado');
    }
    
    // Verificar duplicatas
    const { data: duplicates, error: dupError } = await supabase
      .from('transaction_matches')
      .select('system_transaction_id, count(*)')
      .eq('status', 'confirmed')
      .group('system_transaction_id')
      .having('count(*) > 1');
    
    if (dupError) {
      console.error('❌ Erro ao verificar duplicatas:', dupError);
      return;
    }
    
    console.log('🔍 Transações sistema com múltiplos matches:', duplicates?.length || 0);
    
    if (duplicates && duplicates.length > 0) {
      console.log('⚠️ DUPLICATAS DETECTADAS:');
      duplicates.forEach(dup => {
        console.log(`   - Sistema TX ${dup.system_transaction_id}: ${dup.count} matches`);
      });
    } else {
      console.log('✅ Nenhuma duplicata detectada');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de integridade:', error);
  }
}

// =====================================
// EXECUTAR TODOS OS TESTES
// =====================================
async function runAllTests() {
  console.log('🚀 EXECUTANDO BATERIA COMPLETA DE TESTES...\n');
  
  await testDuplicatePreventionSearch();
  await testDuplicatePreventionConciliation();
  await testCleanConflictsAPI();
  await testTransferValidation();
  await testTransactionMatchesIntegrity();
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 BATERIA DE TESTES CONCLUÍDA');
  console.log('   📝 Verifique os resultados acima para identificar problemas');
  console.log('   🔧 Use a API de limpeza se houver conflitos detectados');
  console.log('=' .repeat(80));
}

// Executar testes
runAllTests().catch(console.error);
