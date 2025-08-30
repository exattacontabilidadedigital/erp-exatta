const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function checkConstraints() {
  console.log('🔍 Verificando constraints da tabela bank_transactions...\n');
  
  try {
    // Query para buscar constraints
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          conname as constraint_name,
          pg_get_constraintdef(c.oid) as constraint_definition
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE t.relname = 'bank_transactions' 
        AND n.nspname = 'public'
        AND contype = 'c'
      `
    });
    
    if (error) {
      console.error('❌ Erro ao buscar constraints:', error);
      
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...');
      
      const { data: tableInfo, error: infoError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'bank_transactions');
        
      if (infoError) {
        console.error('❌ Erro no método alternativo:', infoError);
      } else {
        console.log('📋 Constraints encontradas:', tableInfo);
      }
      
    } else {
      console.log('📋 Constraints da tabela bank_transactions:');
      data.forEach(constraint => {
        console.log(`\n🔒 ${constraint.constraint_name}:`);
        console.log(`   ${constraint.constraint_definition}`);
      });
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

checkConstraints().then(() => process.exit(0));
