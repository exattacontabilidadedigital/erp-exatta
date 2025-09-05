const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://mgppaygsulvjekgnubrf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHBheWdzdWx2amVrZ251YnJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxODQ4NDU3OSwiZXhwIjoyMDM0MDYwNTc5fQ.DLePLLRFOJd_IrtGtk8xqt1Wl0gg7XGqO4Ak2UKlBuc',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

async function executeConstraintFix() {
  console.log('🔧 Executando correção de constraints via service_role...');

  try {
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('fix-constraints.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) continue;

      console.log(`\n🔄 Executando comando ${i + 1}:`);
      console.log(`   ${command.substring(0, 60)}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command
        });

        if (error) {
          console.log(`❌ Erro no comando ${i + 1}:`, error.message);
          
          // Se o erro for sobre constraint já existir, é ok
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log('   ℹ️ Ignorando erro esperado');
            continue;
          }
          
          // Se for o último comando (SELECT), mostrar resultado
          if (command.toLowerCase().trim().startsWith('select')) {
            console.log('📋 Resultado da consulta:', data);
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
          if (data) {
            console.log('   📊 Resultado:', data);
          }
        }
      } catch (cmdError) {
        console.log(`❌ Exceção no comando ${i + 1}:`, cmdError.message);
      }
    }

    // Verificação final
    console.log('\n🔍 Verificação final das constraints...');
    
    const { data: constraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .like('constraint_name', '%bank_transactions%status%');

    if (checkError) {
      console.log('❌ Erro ao verificar constraints:', checkError);
    } else {
      console.log('📋 Constraints encontradas:');
      constraints?.forEach(constraint => {
        console.log(`   • ${constraint.constraint_name}: ${constraint.check_clause}`);
      });
    }

    console.log('\n✅ Processo de correção de constraints concluído!');
    console.log('📋 Valores permitidos:');
    console.log('   • reconciliation_status: sugerido, transferencia, sem_match');
    console.log('   • status_conciliacao: pendente, conciliado, desconciliado, desvinculado, ignorado');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeConstraintFix();
}

module.exports = { executeConstraintFix };
