// Script para verificar constraints da tabela bank_transactions
const { createClient } = require('@supabase/supabase-js');

async function verificarConstraints() {
  console.log('🔍 VERIFICANDO CONSTRAINTS DA TABELA BANK_TRANSACTIONS\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Verificar estrutura da tabela
    console.log('📋 1. Estrutura da tabela bank_transactions:');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'bank_transactions' });

    if (tableError) {
      console.log('❌ Erro ao buscar info da tabela (tentando query direta...)');
      
      // Query alternativa para verificar a estrutura
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'bank_transactions')
        .eq('table_schema', 'public');

      if (!colError && columns) {
        console.log('Colunas encontradas:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
      }
    } else {
      console.log('Table info:', tableInfo);
    }

    // 2. Verificar constraints específicas
    console.log('\n📋 2. Verificando constraints:');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .like('check_clause', '%reconciliation_status%');

    if (constraintError) {
      console.log('❌ Erro ao buscar constraints:', constraintError);
    } else {
      console.log('Constraints encontradas:', constraints);
    }

    // 3. Verificar valores únicos atualmente na coluna
    console.log('\n📋 3. Valores únicos atuais na coluna reconciliation_status:');
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('reconciliation_status')
      .not('reconciliation_status', 'is', null);

    if (bankError) {
      console.log('❌ Erro ao buscar transações:', bankError);
    } else {
      const uniqueStatuses = [...new Set(bankTransactions.map(t => t.reconciliation_status))];
      console.log('Status únicos encontrados:', uniqueStatuses);
    }

    // 4. Testar inserção de cada valor
    console.log('\n📋 4. Testando valores que queremos usar:');
    const testValues = ['transferencia', 'sugerido', 'sem_match', 'conciliado'];
    
    for (const testValue of testValues) {
      try {
        // Fazer um update de teste em uma transação que não existe (vai dar erro de NOT FOUND, não de constraint)
        const { error: testError } = await supabase
          .from('bank_transactions')
          .update({ reconciliation_status: testValue })
          .eq('id', '00000000-0000-0000-0000-000000000000'); // ID inexistente

        if (testError && testError.code === '23514') {
          console.log(`❌ ${testValue}: REJEITADO pela constraint`);
        } else {
          console.log(`✅ ${testValue}: ACEITO (ou ID não encontrado)`);
        }
      } catch (err) {
        console.log(`❌ ${testValue}: ERRO -`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarConstraints().catch(console.error);
