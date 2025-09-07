const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugModalLancamentos() {
  console.log('🔍 DEBUGGING: Por que os lançamentos não aparecem no modal\n');

  try {
    // Teste 1: Verificar se há lançamentos na tabela
    console.log('1️⃣ TESTANDO: Lançamentos na tabela...');
    const { data: allLancamentos, error: allError } = await supabase
      .from('lancamentos')
      .select('id, descricao, valor, status, data_lancamento')
      .limit(5);

    if (allError) {
      console.error('❌ Erro ao buscar lançamentos:', allError);
      return;
    }

    console.log(`✅ Total de lançamentos encontrados: ${allLancamentos?.length || 0}`);
    if (allLancamentos && allLancamentos.length > 0) {
      console.log('📋 Primeiros lançamentos:');
      allLancamentos.forEach((l, i) => {
        console.log(`   ${i+1}. ${l.descricao} - R$ ${l.valor} (${l.status})`);
      });
    }

    // Teste 2: Simular exatamente a busca que o modal faz
    console.log('\n2️⃣ TESTANDO: Simulação da busca do modal...');
    
    // Parâmetros padrão que o modal usa
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '20');
    params.append('status', 'pendente'); // Filtro padrão do modal

    console.log('📊 Parâmetros:', Object.fromEntries(params));

    // Fazer a mesma consulta que a API faz
    let query = supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(id, nome, codigo),
        centro_custos:centro_custo_id(id, nome, codigo)
      `);

    // Aplicar filtro de status como o modal faz
    query = query.eq('status', 'pendente');

    const { data: pendentesData, error: pendentesError } = await query
      .range(0, 19) // Primeiros 20
      .order('data_lancamento', { ascending: false })
      .order('created_at', { ascending: false });

    if (pendentesError) {
      console.error('❌ Erro na busca pendentes:', pendentesError);
      return;
    }

    console.log(`✅ Lançamentos pendentes encontrados: ${pendentesData?.length || 0}`);
    if (pendentesData && pendentesData.length > 0) {
      console.log('📋 Lançamentos pendentes:');
      pendentesData.slice(0, 3).forEach((l, i) => {
        console.log(`   ${i+1}. ${l.descricao} - R$ ${l.valor} (${l.data_lancamento})`);
      });
    } else {
      console.log('⚠️ PROBLEMA: Nenhum lançamento pendente encontrado!');
      
      // Verificar se há lançamentos com outros status
      console.log('\n3️⃣ VERIFICANDO: Lançamentos com outros status...');
      const { data: outrosStatus, error: outrosError } = await supabase
        .from('lancamentos')
        .select('status, COUNT(*)')
        .neq('status', 'pendente')
        .limit(10);

      if (!outrosError && outrosStatus) {
        console.log('📊 Lançamentos com outros status:', outrosStatus);
      }
    }

    // Teste 3: Testar sem filtro de status
    console.log('\n3️⃣ TESTANDO: Busca sem filtro de status...');
    const { data: semFiltro, error: semFiltroError } = await supabase
      .from('lancamentos')
      .select('id, descricao, valor, status, data_lancamento')
      .order('data_lancamento', { ascending: false })
      .limit(10);

    if (semFiltroError) {
      console.error('❌ Erro na busca sem filtro:', semFiltroError);
    } else {
      console.log(`✅ Lançamentos sem filtro: ${semFiltro?.length || 0}`);
      if (semFiltro && semFiltro.length > 0) {
        console.log('📋 Status dos lançamentos:');
        const statusCount = {};
        semFiltro.forEach(l => {
          statusCount[l.status] = (statusCount[l.status] || 0) + 1;
        });
        console.log('   Status encontrados:', statusCount);
      }
    }

    // Teste 4: Testar a API diretamente
    console.log('\n4️⃣ TESTANDO: API diretamente (como o frontend faria)...');
    try {
      const apiUrl = `http://localhost:3000/api/conciliacao/buscar-existentes?page=1&limit=20&status=pendente`;
      console.log('🌐 Testando URL:', apiUrl);
      console.log('⚠️ Nota: Este teste só funciona se o servidor estiver rodando');
    } catch (apiError) {
      console.log('ℹ️ Teste de API pulado (servidor não está rodando)');
    }

    // Conclusões
    console.log('\n📋 CONCLUSÕES:');
    const totalLancamentos = allLancamentos?.length || 0;
    const pendentes = pendentesData?.length || 0;
    
    if (totalLancamentos === 0) {
      console.log('❌ PROBLEMA: Não há lançamentos na tabela');
    } else if (pendentes === 0) {
      console.log('❌ PROBLEMA: Não há lançamentos com status "pendente"');
      console.log('💡 SOLUÇÃO: Altere alguns lançamentos para status "pendente" ou');
      console.log('💡          modifique o filtro padrão do modal');
    } else {
      console.log('✅ Os dados estão corretos. O problema pode estar no frontend.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o debug
debugModalLancamentos();
