const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function criarDadosTeste() {
  try {
    console.log('=== Criando dados de teste para importação ===\n');

    // 1. Criar alguns templates básicos
    console.log('📝 Criando templates de importação...');
    
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id')
      .limit(1);
    
    if (!empresas || empresas.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      return;
    }

    const empresaId = empresas[0].id;
    console.log(`🏢 Usando empresa: ${empresaId}`);

    // Buscar plano de contas
    const { data: planos } = await supabase
      .from('plano_contas')
      .select('id')
      .eq('empresa_id', empresaId)
      .limit(3);

    const { data: contas } = await supabase
      .from('contas_bancarias')
      .select('id')
      .eq('empresa_id', empresaId)
      .limit(1);

    // Criar templates
    const templates = [
      {
        empresa_id: empresaId,
        nome: 'Transferência PIX',
        descricao_padrao: 'PIX|TED|DOC',
        regex_padrao: '.*(PIX|TED|DOC).*',
        plano_conta_id: planos?.[0]?.id,
        conta_bancaria_id: contas?.[0]?.id,
        categoria: 'transferencia',
        limite_confianca: 0.90,
        confirmacao_automatica: true
      },
      {
        empresa_id: empresaId,
        nome: 'Pagamento Fornecedor',
        descricao_padrao: 'FORNECEDOR|PAGTO|PAGAMENTO',
        regex_padrao: '.*(FORNECEDOR|PAGTO|PAGAMENTO).*',
        plano_conta_id: planos?.[1]?.id,
        conta_bancaria_id: contas?.[0]?.id,
        categoria: 'despesa',
        limite_confianca: 0.75
      },
      {
        empresa_id: empresaId,
        nome: 'Recebimento Cliente',
        descricao_padrao: 'RECEBTO|CREDITO|DEPOSITO',
        regex_padrao: '.*(RECEBTO|CREDITO|DEPOSITO).*',
        plano_conta_id: planos?.[2]?.id,
        conta_bancaria_id: contas?.[0]?.id,
        categoria: 'receita',
        limite_confianca: 0.80
      }
    ];

    const { data: templatesCreated, error: templatesError } = await supabase
      .from('templates_importacao')
      .insert(templates)
      .select();

    if (templatesError) {
      console.log('❌ Erro ao criar templates:', templatesError.message);
    } else {
      console.log(`✅ ${templatesCreated.length} templates criados`);
    }

    // 2. Criar um lote de importação de teste
    console.log('\n📦 Criando lote de importação de teste...');
    
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id')
      .eq('empresa_id', empresaId)
      .limit(1);

    if (!usuarios || usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado para esta empresa');
      return;
    }

    const usuarioId = usuarios[0].id;
    const { data: modelos } = await supabase
      .from('modelos_importacao')
      .select('id')
      .eq('tipo_arquivo', 'CSV')
      .limit(1);

    const lote = {
      usuario_upload: usuarioId,
      modelo_id: modelos?.[0]?.id,
      nome_arquivo: 'extrato_teste_setembro.csv',
      tipo_arquivo: 'CSV',
      hash_arquivo: 'hash_' + Date.now(),
      tamanho_arquivo: 2048,
      total_registros: 15,
      registros_processados: 15,
      status: 'processado',
      conta_bancaria_id: contas?.[0]?.id,
      data_upload: new Date().toISOString(),
      data_processamento: new Date().toISOString(),
      data_conclusao: new Date().toISOString()
    };

    const { data: loteCreated, error: loteError } = await supabase
      .from('lotes_importacao')
      .insert([lote])
      .select()
      .single();

    if (loteError) {
      console.log('❌ Erro ao criar lote:', loteError.message);
      return;
    }

    console.log(`✅ Lote criado: ${loteCreated.id}`);

    // 3. Criar pré-lançamentos de teste
    console.log('\n💰 Criando pré-lançamentos de teste...');
    
    const preLancamentos = [
      {
        lote_id: loteCreated.id,
        linha_arquivo: 1,
        data_lancamento: '2025-09-15',
        descricao: 'PIX RECEBIDO - CLIENTE ABC LTDA',
        valor: 1500.00,
        tipo_movimento: 'entrada',
        conta_credito_sugerida: planos?.[2]?.id,
        score_matching: 95,
        status_aprovacao: 'pendente'
      },
      {
        lote_id: loteCreated.id,
        linha_arquivo: 2,
        data_lancamento: '2025-09-16',
        descricao: 'PAGAMENTO FORNECEDOR XYZ SA',
        valor: 800.00,
        tipo_movimento: 'saida',
        conta_debito_sugerida: planos?.[1]?.id,
        score_matching: 88,
        status_aprovacao: 'pendente'
      },
      {
        lote_id: loteCreated.id,
        linha_arquivo: 3,
        data_lancamento: '2025-09-17',
        descricao: 'TED RECEBIMENTO CLIENTE DEF',
        valor: 2200.00,
        tipo_movimento: 'entrada',
        conta_credito_sugerida: planos?.[2]?.id,
        score_matching: 92,
        status_aprovacao: 'aprovado',
        data_aprovacao: new Date().toISOString(),
        usuario_aprovacao: usuarioId
      },
      {
        lote_id: loteCreated.id,
        linha_arquivo: 4,
        data_lancamento: '2025-09-18',
        descricao: 'DOC PAGAMENTO DIVERSOS',
        valor: 350.00,
        tipo_movimento: 'saida',
        conta_debito_sugerida: planos?.[1]?.id,
        score_matching: 45,
        status_aprovacao: 'rejeitado',
        data_aprovacao: new Date().toISOString(),
        usuario_aprovacao: usuarioId,
        motivo_rejeicao: 'Score muito baixo para aprovação automática'
      },
      {
        lote_id: loteCreated.id,
        linha_arquivo: 5,
        data_lancamento: '2025-09-19',
        descricao: 'TRANSFERENCIA CONTA CORRENTE',
        valor: 1000.00,
        tipo_movimento: 'saida',
        conta_debito_sugerida: planos?.[0]?.id,
        score_matching: 78,
        status_aprovacao: 'pendente'
      }
    ];

    const { data: preLancCreated, error: preLancError } = await supabase
      .from('pre_lancamentos')
      .insert(preLancamentos)
      .select();

    if (preLancError) {
      console.log('❌ Erro ao criar pré-lançamentos:', preLancError.message);
    } else {
      console.log(`✅ ${preLancCreated.length} pré-lançamentos criados`);
    }

    // 4. Criar histórico
    console.log('\n📜 Criando histórico...');
    
    const historico = [
      {
        lote_id: loteCreated.id,
        pre_lancamento_id: preLancCreated[2]?.id,
        acao: 'aprovacao',
        valores_anteriores: { status_aprovacao: 'pendente' },
        valores_novos: { status_aprovacao: 'aprovado' },
        usuario_acao: usuarioId,
        observacoes: 'Aprovado automaticamente - alta confiança'
      },
      {
        lote_id: loteCreated.id,
        pre_lancamento_id: preLancCreated[3]?.id,
        acao: 'rejeicao',
        valores_anteriores: { status_aprovacao: 'pendente' },
        valores_novos: { status_aprovacao: 'rejeitado' },
        usuario_acao: usuarioId,
        observacoes: 'Rejeitado - score insuficiente'
      }
    ];

    const { data: histCreated, error: histError } = await supabase
      .from('historico_importacoes')
      .insert(historico)
      .select();

    if (histError) {
      console.log('❌ Erro ao criar histórico:', histError.message);
    } else {
      console.log(`✅ ${histCreated.length} registros de histórico criados`);
    }

    console.log('\n🎉 Dados de teste criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`- 3 templates de importação`);
    console.log(`- 1 lote de importação`);
    console.log(`- 5 pré-lançamentos (3 pendentes, 1 aprovado, 1 rejeitado)`);
    console.log(`- 2 registros de histórico`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

criarDadosTeste().then(() => {
  console.log('\n✅ Script concluído!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});