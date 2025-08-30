const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregar variáveis de ambiente do arquivo .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTables() {
  try {
    console.log('🚀 Iniciando criação das tabelas de conciliação...');
    
    const sql = fs.readFileSync('scripts/015_create_remaining_reconciliation_tables.sql', 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command.length === 0) continue;
      
      console.log(`📝 Executando comando ${i + 1}/${commands.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: command + ';' });
      
      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
        // Continuar com os próximos comandos mesmo se um falhar
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    }
    
    console.log('🎉 Processo de criação das tabelas concluído!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

createTables();
