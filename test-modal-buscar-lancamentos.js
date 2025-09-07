const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testBuscarLancamentosAPI() {
  console.log('🔍 Testando a API que o modal utiliza...\n');

  try {
    // Simular uma chamada que o modal faria
    const params = new URLSearchParams({
      page: '1',
      limit: '20',
      status: 'pendente'
    });

    console.log('📡 Fazendo requisição para: /api/conciliacao/buscar-existentes');
    console.log('📊 Parâmetros:', Object.fromEntries(params));
    
    // Simular o que a API faria
    let query = supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(id, nome, codigo),
        centro_custos:centro_custo_id(id, nome, codigo)
      `);

    // Aplicar filtro de status
    query = query.eq('status', 'pendente');

    // Buscar total
    console.log('\n🔢 Contando lançamentos pendentes...');
    const { count: totalCount, error: countError } = await supabase
      .from('lancamentos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');

    if (countError) {
      console.error('❌ Erro ao contar:', countError);
      return;
    }

    console.log(`✅ Total de lançamentos pendentes: ${totalCount}`);

    // Buscar dados paginados
    console.log('\n📄 Buscando primeira página...');
    const { data: lancamentos, error: dataError } = await query
      .range(0, 19) // Primeiros 20 registros
      .order('data_lancamento', { ascending: false })
      .order('created_at', { ascending: false });

    if (dataError) {
      console.error('❌ Erro ao buscar lançamentos:', dataError);
      return;
    }

    console.log(`✅ ${lancamentos?.length || 0} lançamentos retornados`);

    if (lancamentos && lancamentos.length > 0) {
      console.log('\n📋 Estrutura dos dados retornados:');
      console.log('Campos disponíveis:', Object.keys(lancamentos[0]));
      
      console.log('\n📝 Primeiros 3 lançamentos:');
      lancamentos.slice(0, 3).forEach((lancamento, index) => {
        console.log(`\n${index + 1}. ${lancamento.descricao || 'Sem descrição'}`);
        console.log(`   ID: ${lancamento.id.substring(0, 8)}...`);
        console.log(`   Data: ${lancamento.data_lancamento}`);
        console.log(`   Valor: R$ ${Math.abs(lancamento.valor).toFixed(2)}`);
        console.log(`   Tipo: ${lancamento.tipo}`);
        console.log(`   Status: ${lancamento.status}`);
        if (lancamento.numero_documento) {
          console.log(`   Doc: ${lancamento.numero_documento}`);
        }
      });
    }

    // Testar busca com filtros
    console.log('\n🔍 Testando busca com filtro de descrição...');
    const { data: filteredData, error: filterError } = await supabase
      .from('lancamentos')
      .select('*')
      .ilike('descricao', '%pagamento%')
      .limit(5);

    if (filterError) {
      console.error('❌ Erro na busca filtrada:', filterError);
    } else {
      console.log(`✅ ${filteredData?.length || 0} lançamentos encontrados com "pagamento"`);
      if (filteredData && filteredData.length > 0) {
        filteredData.forEach(l => {
          console.log(`   - ${l.descricao} (${l.tipo})`);
        });
      }
    }

    console.log('\n🎉 Teste concluído! O modal deve funcionar corretamente.');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testBuscarLancamentosAPI();
