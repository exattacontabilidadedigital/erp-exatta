// Script para testar quantos lançamentos aparecem no modal
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcefhrwvijehxzrxwyfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'
);

async function testModalData() {
  console.log('🔍 Testando dados do modal...');
  
  try {
    // Teste 1: Buscar TODOS os lançamentos sem filtros
    console.log('\n📊 Teste 1: TODOS os lançamentos');
    const { data: todosLancamentos, error: erro1, count: total1 } = await supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(id, nome, codigo),
        centro_custos:centro_custo_id(id, nome, codigo)
      `, { count: 'exact' });

    if (erro1) {
      console.error('❌ Erro no teste 1:', erro1);
    } else {
      console.log(`✅ Total no banco: ${total1}`);
      console.log(`✅ Retornados: ${todosLancamentos?.length || 0}`);
    }

    // Teste 2: Simular a busca do modal (com paginação)
    console.log('\n📊 Teste 2: Com paginação (limite 20)');
    const { data: comPaginacao, error: erro2, count: total2 } = await supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(id, nome, codigo),
        centro_custos:centro_custo_id(id, nome, codigo)
      `, { count: 'exact' })
      .range(0, 19) // Primeiros 20 (página 1)
      .order('data_lancamento', { ascending: false })
      .order('created_at', { ascending: false });

    if (erro2) {
      console.error('❌ Erro no teste 2:', erro2);
    } else {
      console.log(`✅ Total no banco: ${total2}`);
      console.log(`✅ Retornados com paginação: ${comPaginacao?.length || 0}`);
      
      if (comPaginacao && comPaginacao.length > 0) {
        console.log('\n📋 Primeiros 3 lançamentos:');
        comPaginacao.slice(0, 3).forEach((lanc, i) => {
          console.log(`${i + 1}. ID: ${lanc.id.substring(0, 8)}, Data: ${lanc.data_lancamento}, Valor: ${lanc.valor}, Status: ${lanc.status}`);
        });
      }
    }

    // Teste 3: Apenas status pendente
    console.log('\n📊 Teste 3: Apenas status=pendente');
    const { data: pendentes, error: erro3, count: total3 } = await supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(id, nome, codigo),
        centro_custos:centro_custo_id(id, nome, codigo)
      `, { count: 'exact' })
      .eq('status', 'pendente')
      .range(0, 19)
      .order('data_lancamento', { ascending: false });

    if (erro3) {
      console.error('❌ Erro no teste 3:', erro3);
    } else {
      console.log(`✅ Total pendentes: ${total3}`);
      console.log(`✅ Retornados pendentes: ${pendentes?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testModalData();
