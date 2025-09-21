const { createClient } = require('@supabase/supabase-js')

// Credenciais do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcefhrwvijehxzrxwyfe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarTabelasImportacao() {
  console.log('🔍 Verificando estrutura das tabelas de importação...\n');

  try {
    // 1. Verificar tabela import_batches
    console.log('📊 Testando tabela import_batches...');
    const { data: batchesData, error: batchesError } = await supabase
      .from('import_batches')
      .select('*')
      .limit(1);

    if (batchesError) {
      console.error('❌ Erro em import_batches:', batchesError);
    } else {
      console.log('✅ import_batches acessível');
      if (batchesData && batchesData.length > 0) {
        console.log('📋 Campos da tabela:', Object.keys(batchesData[0]));
      }
    }

    // 2. Verificar tabela pre_entries
    console.log('\n📊 Testando tabela pre_entries...');
    const { data: entriesData, error: entriesError } = await supabase
      .from('pre_entries')
      .select('*')
      .limit(1);

    if (entriesError) {
      console.error('❌ Erro em pre_entries:', entriesError);
    } else {
      console.log('✅ pre_entries acessível');
      if (entriesData && entriesData.length > 0) {
        console.log('📋 Campos da tabela:', Object.keys(entriesData[0]));
      }
    }

    // 3. Verificar tabela import_templates
    console.log('\n📊 Testando tabela import_templates...');
    const { data: templatesData, error: templatesError } = await supabase
      .from('import_templates')
      .select('*')
      .limit(1);

    if (templatesError) {
      console.error('❌ Erro em import_templates:', templatesError);
    } else {
      console.log('✅ import_templates acessível');
      if (templatesData && templatesData.length > 0) {
        console.log('📋 Campos da tabela:', Object.keys(templatesData[0]));
      }
    }

    // 4. Verificar se existem as tabelas antigas
    console.log('\n🔍 Verificando tabelas antigas...');
    
    const { data: oldBatches, error: oldBatchesError } = await supabase
      .from('lotes_importacao')
      .select('*')
      .limit(1);

    if (oldBatchesError) {
      console.log('❌ lotes_importacao não existe (esperado)');
    } else {
      console.log('⚠️ lotes_importacao ainda existe');
    }

    const { data: oldEntries, error: oldEntriesError } = await supabase
      .from('pre_lancamentos')
      .select('*')
      .limit(1);

    if (oldEntriesError) {
      console.log('❌ pre_lancamentos não existe (esperado)');
    } else {
      console.log('⚠️ pre_lancamentos ainda existe');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  verificarTabelasImportacao();
}

module.exports = { verificarTabelasImportacao };