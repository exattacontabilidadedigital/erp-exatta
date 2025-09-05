// Script para executar a correção da constraint no banco
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function executarCorrecaoConstraint() {
  console.log('🔧 EXECUTANDO CORREÇÃO DA CONSTRAINT RECONCILIATION_STATUS\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Verificar constraint atual
    console.log('📋 1. Verificando constraint atual...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
              tc.constraint_name,
              cc.check_clause
          FROM information_schema.table_constraints tc
          JOIN information_schema.check_constraints cc 
              ON tc.constraint_name = cc.constraint_name
          WHERE tc.table_name = 'bank_transactions' 
              AND tc.constraint_type = 'CHECK'
              AND cc.check_clause LIKE '%reconciliation_status%';
        `
      });

    if (constraintError) {
      console.log('❌ Erro ao verificar constraints:', constraintError);
    } else {
      console.log('Constraints encontradas:', constraints);
    }

    // 2. Remover constraint existente
    console.log('\n📋 2. Removendo constraint existente...');
    const { error: dropError } = await supabase
      .rpc('sql', {
        query: 'ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_reconciliation_status_check;'
      });

    if (dropError) {
      console.log('⚠️ Aviso ao remover constraint:', dropError);
    } else {
      console.log('✅ Constraint removida com sucesso');
    }

    // 3. Criar nova constraint
    console.log('\n📋 3. Criando nova constraint com todos os valores...');
    const { error: createError } = await supabase
      .rpc('sql', {
        query: `
          ALTER TABLE bank_transactions 
          ADD CONSTRAINT bank_transactions_reconciliation_status_check 
          CHECK (reconciliation_status IN (
              'pending',
              'matched', 
              'transferencia',
              'sugerido', 
              'sem_match',
              'conciliado',
              'ignorado',
              'desvinculado'
          ));
        `
      });

    if (createError) {
      console.log('❌ Erro ao criar nova constraint:', createError);
    } else {
      console.log('✅ Nova constraint criada com sucesso!');
    }

    // 4. Verificar constraint final
    console.log('\n📋 4. Verificando constraint final...');
    const { data: finalConstraints, error: finalError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
              tc.constraint_name,
              cc.check_clause
          FROM information_schema.table_constraints tc
          JOIN information_schema.check_constraints cc 
              ON tc.constraint_name = cc.constraint_name
          WHERE tc.table_name = 'bank_transactions' 
              AND tc.constraint_type = 'CHECK'
              AND cc.check_clause LIKE '%reconciliation_status%';
        `
      });

    if (finalError) {
      console.log('❌ Erro ao verificar constraint final:', finalError);
    } else {
      console.log('Constraint final:', finalConstraints);
    }

    // 5. Testar os novos valores
    console.log('\n📋 5. Testando novos valores...');
    const testValues = ['transferencia', 'sugerido', 'sem_match', 'conciliado'];
    
    for (const testValue of testValues) {
      try {
        const { error: testError } = await supabase
          .from('bank_transactions')
          .update({ reconciliation_status: testValue })
          .eq('id', '00000000-0000-0000-0000-000000000000'); // ID inexistente

        if (testError && testError.code === '23514') {
          console.log(`❌ ${testValue}: AINDA REJEITADO pela constraint`);
        } else {
          console.log(`✅ ${testValue}: ACEITO pela constraint`);
        }
      } catch (err) {
        if (err.message.includes('constraint')) {
          console.log(`❌ ${testValue}: REJEITADO pela constraint`);
        } else {
          console.log(`✅ ${testValue}: ACEITO pela constraint`);
        }
      }
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('Agora você pode usar os valores:');
    console.log('- transferencia');
    console.log('- sugerido'); 
    console.log('- sem_match');
    console.log('- conciliado');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

executarCorrecaoConstraint().catch(console.error);
