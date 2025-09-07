// Verificação e criação da coluna metadata de forma simples
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndAddMetadata() {
  try {
    console.log('🔍 Testando inserção para verificar se coluna metadata existe...');
    
    // Tentar fazer uma query que use a coluna metadata
    const { data, error } = await supabase
      .from('transaction_matches')
      .select('id, metadata')
      .limit(1);

    if (error) {
      if (error.message.includes("Could not find the 'metadata' column")) {
        console.log('❌ Coluna metadata não existe na tabela transaction_matches');
        console.log('💡 A coluna precisa ser adicionada diretamente no banco de dados');
        
        // SQL que deve ser executado manualmente
        console.log('\n📝 Execute este SQL no seu banco de dados:');
        console.log('');
        console.log('ALTER TABLE transaction_matches ADD COLUMN metadata JSONB DEFAULT \'{}\';');
        console.log('CREATE INDEX IF NOT EXISTS idx_transaction_matches_metadata ON transaction_matches USING GIN (metadata);');
        console.log('');
        
        return false;
      } else {
        console.log('❌ Outro erro:', error);
        return false;
      }
    } else {
      console.log('✅ Coluna metadata existe e está funcionando!');
      console.log(`📊 Encontradas ${data?.length || 0} transações`);
      return true;
    }
    
  } catch (error) {
    console.error('💥 Erro:', error);
    return false;
  }
}

checkAndAddMetadata()
  .then((success) => {
    if (success) {
      console.log('🎉 Pronto para usar a funcionalidade de primary transaction!');
    } else {
      console.log('⚠️ Precisa executar SQL manualmente no banco');
    }
  })
  .catch(console.error);
