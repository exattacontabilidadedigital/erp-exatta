const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEwNTExOCwiZXhwIjoyMDcwNjgxMTE4fQ.T0mh9T780CqwYOuNVTJuftfdQ-_1ErbRZBF-K5o2IGU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAndFetchData() {
  console.log('🚀 Testando autenticação e busca de pré-lançamentos...');
  
  try {
    // 1. Fazer login
    console.log('🔐 Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'contabil@exattacontabilidade.com.br',
      password: 'R@748596'
    });

    if (authError) {
      console.log('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', authData.user.id);

    // 2. Buscar empresa do usuário
    console.log('\n🏢 Buscando empresa do usuário...');
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('empresa_id, nome, email')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
      return;
    }

    console.log('✅ Usuário encontrado:', userData);

    // 3. Buscar pré-lançamentos da empresa
    console.log('\n📋 Buscando pré-lançamentos da empresa...');
    const { data: preLancamentos, error: preError } = await supabase
      .from('pre_lancamentos')
      .select('id, descricao, valor, data_lancamento, status_aprovacao, usuario_id, empresa_id')
      .eq('empresa_id', userData.empresa_id)
      .order('data_criacao', { ascending: false });

    if (preError) {
      console.log('❌ Erro ao buscar pré-lançamentos:', preError.message);
      return;
    }

    console.log('✅ Pré-lançamentos encontrados:', preLancamentos.length);
    
    if (preLancamentos.length > 0) {
      console.log('\n📊 Primeiros 3 registros:');
      preLancamentos.slice(0, 3).forEach((pl, index) => {
        console.log(`${index + 1}. ${pl.descricao} - R$ ${pl.valor} - ${pl.status_aprovacao}`);
      });
      
      console.log('\n📈 Distribuição por status:');
      const statusCount = {
        pendente: preLancamentos.filter(p => p.status_aprovacao === 'pendente').length,
        aprovado: preLancamentos.filter(p => p.status_aprovacao === 'aprovado').length,
        rejeitado: preLancamentos.filter(p => p.status_aprovacao === 'rejeitado').length,
      };
      console.log(statusCount);
    } else {
      console.log('⚠️ Nenhum pré-lançamento encontrado para esta empresa');
      
      // Verificar se existem pré-lançamentos para outros usuários/empresas
      console.log('\n🔍 Verificando todos os pré-lançamentos...');
      const { data: allPre } = await supabase
        .from('pre_lancamentos')
        .select('empresa_id, usuario_id')
        .limit(10);
      
      if (allPre && allPre.length > 0) {
        const empresas = [...new Set(allPre.map(p => p.empresa_id))];
        console.log('🏢 Empresas com pré-lançamentos:', empresas);
        console.log('🏢 Sua empresa:', userData.empresa_id);
        console.log('🔍 Sua empresa tem pré-lançamentos:', empresas.includes(userData.empresa_id) ? 'SIM' : 'NÃO');
      }
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

testAuthAndFetchData();