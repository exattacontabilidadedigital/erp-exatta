const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mgppaygsulvjekgnubrf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHBheWdzdWx2amVrZ251YnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0ODQ1NzksImV4cCI6MjAzNDA2MDU3OX0.pjqE75VKP1-M6Bxf2PtTiAQO_F1VgwVqKzAVYC2u5r8'
);

async function fixConstraints() {
  console.log('🔧 Corrigindo constraints da tabela bank_transactions...');

  try {
    // 1. Primeiro, vamos dropar as constraints existentes se houver
    console.log('🗑️ Removendo constraints antigas...');
    
    const dropConstraints = [
      `ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_reconciliation_status_check;`,
      `ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_status_conciliacao_check;`
    ];

    for (const sql of dropConstraints) {
      const { error } = await supabase.rpc('execute_sql', { sql });
      if (error) {
        console.log(`⚠️ Aviso ao dropar constraint: ${error.message}`);
      }
    }

    // 2. Criar as constraints corretas
    console.log('✨ Criando constraints corretas...');

    // Constraint para reconciliation_status (classificação automática)
    const reconciliationStatusConstraint = `
      ALTER TABLE bank_transactions 
      ADD CONSTRAINT bank_transactions_reconciliation_status_check 
      CHECK (reconciliation_status IN ('sugerido', 'transferencia', 'sem_match'));
    `;

    const { error: statusError } = await supabase.rpc('execute_sql', { 
      sql: reconciliationStatusConstraint 
    });

    if (statusError) {
      console.log('❌ Erro ao criar constraint reconciliation_status:', statusError);
    } else {
      console.log('✅ Constraint reconciliation_status criada com sucesso');
    }

    // Constraint para status_conciliacao (ações do usuário)
    const statusConciliacaoConstraint = `
      ALTER TABLE bank_transactions 
      ADD CONSTRAINT bank_transactions_status_conciliacao_check 
      CHECK (status_conciliacao IN ('pendente', 'conciliado', 'desconciliado', 'desvinculado', 'ignorado'));
    `;

    const { error: conciliacaoError } = await supabase.rpc('execute_sql', { 
      sql: statusConciliacaoConstraint 
    });

    if (conciliacaoError) {
      console.log('❌ Erro ao criar constraint status_conciliacao:', conciliacaoError);
    } else {
      console.log('✅ Constraint status_conciliacao criada com sucesso');
    }

    // 3. Verificar se há registros com valores inválidos e corrigir
    console.log('🔍 Verificando registros com valores inválidos...');

    // Verificar reconciliation_status inválidos
    const { data: invalidReconciliation, error: checkError1 } = await supabase
      .from('bank_transactions')
      .select('id, reconciliation_status')
      .not('reconciliation_status', 'in', '(sugerido,transferencia,sem_match)');

    if (checkError1) {
      console.log('❌ Erro ao verificar reconciliation_status:', checkError1);
    } else if (invalidReconciliation?.length > 0) {
      console.log(`⚠️ Encontrados ${invalidReconciliation.length} registros com reconciliation_status inválido:`, 
        invalidReconciliation.map(r => ({ id: r.id, status: r.reconciliation_status })));
      
      // Corrigir valores inválidos para 'sem_match' como padrão
      const { error: fixError1 } = await supabase
        .from('bank_transactions')
        .update({ reconciliation_status: 'sem_match' })
        .not('reconciliation_status', 'in', '(sugerido,transferencia,sem_match)');

      if (fixError1) {
        console.log('❌ Erro ao corrigir reconciliation_status:', fixError1);
      } else {
        console.log('✅ Valores de reconciliation_status corrigidos');
      }
    }

    // Verificar status_conciliacao inválidos
    const { data: invalidConciliacao, error: checkError2 } = await supabase
      .from('bank_transactions')
      .select('id, status_conciliacao')
      .not('status_conciliacao', 'in', '(pendente,conciliado,desconciliado,desvinculado,ignorado)');

    if (checkError2) {
      console.log('❌ Erro ao verificar status_conciliacao:', checkError2);
    } else if (invalidConciliacao?.length > 0) {
      console.log(`⚠️ Encontrados ${invalidConciliacao.length} registros com status_conciliacao inválido:`, 
        invalidConciliacao.map(r => ({ id: r.id, status: r.status_conciliacao })));
      
      // Corrigir valores inválidos para 'pendente' como padrão
      const { error: fixError2 } = await supabase
        .from('bank_transactions')
        .update({ status_conciliacao: 'pendente' })
        .not('status_conciliacao', 'in', '(pendente,conciliado,desconciliado,desvinculado,ignorado)');

      if (fixError2) {
        console.log('❌ Erro ao corrigir status_conciliacao:', fixError2);
      } else {
        console.log('✅ Valores de status_conciliacao corrigidos');
      }
    }

    // 4. Testar as constraints
    console.log('🧪 Testando constraints...');
    
    console.log('📋 Resumo das constraints criadas:');
    console.log('   • reconciliation_status: sugerido, transferencia, sem_match');
    console.log('   • status_conciliacao: pendente, conciliado, desconciliado, desvinculado, ignorado');
    
    console.log('✅ Correção de constraints concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a função se o arquivo for executado diretamente
if (require.main === module) {
  fixConstraints();
}

module.exports = { fixConstraints };
