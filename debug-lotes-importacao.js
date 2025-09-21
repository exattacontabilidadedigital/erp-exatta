const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarLotesImportacao() {
  console.log('🔍 Verificando estrutura da tabela lotes_importacao...\n');

  try {
    // Verificar se a tabela existe
    console.log('1. Testando acesso à tabela lotes_importacao...');
    const { data: testData, error: testError } = await supabase
      .from('lotes_importacao')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Erro ao acessar lotes_importacao:', testError);
      return;
    }

    console.log('✅ Tabela lotes_importacao acessível');

    // Buscar todas as colunas disponíveis
    console.log('\n2. Buscando estrutura da tabela...');
    const { data: allData, error: allError } = await supabase
      .from('lotes_importacao')
      .select('*')
      .limit(5);

    if (allError) {
      console.error('❌ Erro ao buscar dados:', allError);
      return;
    }

    if (allData && allData.length > 0) {
      console.log('✅ Colunas encontradas na tabela lotes_importacao:');
      const columns = Object.keys(allData[0]);
      columns.forEach(col => console.log(`   - ${col}`));
      
      console.log('\n📋 Exemplo de dados:');
      console.log(JSON.stringify(allData[0], null, 2));
    } else {
      console.log('⚠️ Tabela lotes_importacao está vazia');
    }

    // Verificar tabela modelos_importacao
    console.log('\n3. Verificando tabela modelos_importacao...');
    const { data: modelData, error: modelError } = await supabase
      .from('modelos_importacao')
      .select('*')
      .limit(1);

    if (modelError) {
      console.error('❌ Erro ao acessar modelos_importacao:', modelError);
    } else {
      console.log('✅ Tabela modelos_importacao acessível');
      if (modelData && modelData.length > 0) {
        const modelColumns = Object.keys(modelData[0]);
        console.log('   Colunas: ', modelColumns.join(', '));
      }
    }

    // Testar query com join
    console.log('\n4. Testando query com join...');
    const { data: joinData, error: joinError } = await supabase
      .from('lotes_importacao')
      .select(`
        *,
        modelos_importacao (
          nome,
          tipo_arquivo
        )
      `)
      .limit(1);

    if (joinError) {
      console.error('❌ Erro no JOIN:', joinError);
      console.log('   Tentando query sem JOIN...');
      
      const { data: simpleData, error: simpleError } = await supabase
        .from('lotes_importacao')
        .select('*')
        .limit(1);
      
      if (simpleError) {
        console.error('❌ Erro na query simples:', simpleError);
      } else {
        console.log('✅ Query simples funcionou');
      }
    } else {
      console.log('✅ Query com JOIN funcionou');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarLotesImportacao().then(() => {
  console.log('\n🏁 Verificação concluída');
  process.exit(0);
});