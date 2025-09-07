// Script para adicionar coluna metadata à tabela transaction_matches
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('URL:', supabaseUrl ? 'DEFINIDA' : 'UNDEFINED');
  console.log('Service Key:', supabaseServiceKey ? 'DEFINIDA' : 'UNDEFINED');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addMetadataColumn() {
  try {
    console.log('🔍 Verificando se a coluna metadata já existe...');
    
    // Primeiro, verificar se a coluna já existe
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'transaction_matches' });
    
    if (columnsError) {
      console.log('⚠️ Não foi possível verificar colunas existentes, tentando adicionar...');
    } else {
      const hasMetadata = columns?.some(col => col.column_name === 'metadata');
      if (hasMetadata) {
        console.log('✅ Coluna metadata já existe na tabela transaction_matches');
        return;
      }
    }

    console.log('🔧 Adicionando coluna metadata...');
    
    // SQL para adicionar a coluna metadata
    const sql = `
      DO $$ 
      BEGIN
          -- Verificar se a coluna metadata existe
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'transaction_matches' 
              AND column_name = 'metadata'
          ) THEN
              -- Adicionar coluna metadata
              ALTER TABLE transaction_matches 
              ADD COLUMN metadata JSONB DEFAULT '{}';
              
              RAISE NOTICE 'Coluna metadata adicionada à tabela transaction_matches';
          ELSE
              RAISE NOTICE 'Coluna metadata já existe na tabela transaction_matches';
          END IF;
      END $$;
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // Tentar abordagem alternativa
      console.log('📝 Tentando abordagem alternativa...');
      
      const { error: alterError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'transaction_matches')
        .eq('column_name', 'metadata')
        .single();

      if (alterError && alterError.code === 'PGRST116') {
        // Coluna não existe, vamos tentar adicionar via query direta
        console.log('🔧 Executando ALTER TABLE diretamente...');
        
        const { error: addError } = await supabase
          .rpc('exec', {
            sql: 'ALTER TABLE transaction_matches ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\''
          });

        if (addError) {
          console.error('❌ Erro ao adicionar coluna:', addError);
          throw addError;
        }
      }
    }

    console.log('🎯 Criando índice para a coluna metadata...');
    
    // Criar índice para busca eficiente
    const { error: indexError } = await supabase
      .rpc('exec', {
        sql: 'CREATE INDEX IF NOT EXISTS idx_transaction_matches_metadata ON transaction_matches USING GIN (metadata)'
      });

    if (indexError) {
      console.log('⚠️ Aviso ao criar índice:', indexError.message);
    }

    console.log('✅ Coluna metadata configurada com sucesso!');
    
    // Testar inserção
    console.log('🧪 Testando inserção com metadata...');
    
    const testMetadata = {
      is_primary: true,
      primary_transaction_id: 'test-id',
      match_type: 'manual'
    };

    console.log('📝 Exemplo de metadata que será usado:', JSON.stringify(testMetadata, null, 2));
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    throw error;
  }
}

// Executar
addMetadataColumn()
  .then(() => {
    console.log('🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na execução:', error);
    process.exit(1);
  });
