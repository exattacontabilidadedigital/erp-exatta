import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/conciliacao/estatisticas iniciado');
    
    const { searchParams } = new URL(request.url);
    const bancoId = searchParams.get('bancoId');
    const periodo = searchParams.get('periodo') || '30'; // dias
    
    console.log('📊 Parâmetros das estatísticas:', { bancoId, periodo });

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];

    // 1. Estatísticas gerais
    let queryGeral = supabase
      .from('transacoes_bancarias')
      .select('*', { count: 'exact' })
      .gte('data', dataLimiteStr);

    if (bancoId) {
      queryGeral = queryGeral.eq('conta_bancaria_id', bancoId);
    }

    const { count: totalTransacoes, error: errorTotal } = await queryGeral;

    if (errorTotal) {
      console.error('❌ Erro ao contar total de transações:', errorTotal);
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      );
    }

    // 2. Transações conciliadas
    let queryConciliadas = supabase
      .from('transacoes_bancarias')
      .select('*', { count: 'exact' })
      .gte('data', dataLimiteStr)
      .not('lancamento_id', 'is', null);

    if (bancoId) {
      queryConciliadas = queryConciliadas.eq('conta_bancaria_id', bancoId);
    }

    const { count: totalConciliadas, error: errorConciliadas } = await queryConciliadas;

    if (errorConciliadas) {
      console.error('❌ Erro ao contar transações conciliadas:', errorConciliadas);
    }

    // 3. Valores por tipo
    let queryValores = supabase
      .from('transacoes_bancarias')
      .select('valor, lancamento_id')
      .gte('data', dataLimiteStr);

    if (bancoId) {
      queryValores = queryValores.eq('conta_bancaria_id', bancoId);
    }

    const { data: dadosValores, error: errorValores } = await queryValores;

    if (errorValores) {
      console.error('❌ Erro ao buscar valores:', errorValores);
    }

    // Calcular valores
    const valores = {
      totalCreditos: 0,
      totalDebitos: 0,
      creditosConciliados: 0,
      debitosConciliados: 0,
      creditosNaoConciliados: 0,
      debitosNaoConciliados: 0
    };

    dadosValores?.forEach(item => {
      const valor = parseFloat(item.valor) || 0;
      const isConciliado = !!item.lancamento_id;
      
      if (valor >= 0) {
        valores.totalCreditos += valor;
        if (isConciliado) {
          valores.creditosConciliados += valor;
        } else {
          valores.creditosNaoConciliados += valor;
        }
      } else {
        const valorAbs = Math.abs(valor);
        valores.totalDebitos += valorAbs;
        if (isConciliado) {
          valores.debitosConciliados += valorAbs;
        } else {
          valores.debitosNaoConciliados += valorAbs;
        }
      }
    });

    // 4. Estatísticas por banco (se não foi especificado um banco)
    let estatisticasPorBanco = [];
    if (!bancoId) {
      const { data: bancos, error: errorBancos } = await supabase
        .from('contas_bancarias')
        .select('id, nome, banco');

      if (!errorBancos && bancos) {
        for (const banco of bancos) {
          const { count: totalBanco } = await supabase
            .from('transacoes_bancarias')
            .select('*', { count: 'exact' })
            .eq('conta_bancaria_id', banco.id)
            .gte('data', dataLimiteStr);

          const { count: conciliadasBanco } = await supabase
            .from('transacoes_bancarias')
            .select('*', { count: 'exact' })
            .eq('conta_bancaria_id', banco.id)
            .gte('data', dataLimiteStr)
            .not('lancamento_id', 'is', null);

          estatisticasPorBanco.push({
            banco: {
              id: banco.id,
              nome: banco.nome,
              banco: banco.banco
            },
            total: totalBanco || 0,
            conciliadas: conciliadasBanco || 0,
            naoConciliadas: (totalBanco || 0) - (conciliadasBanco || 0),
            percentualConciliacao: totalBanco > 0 
              ? (((conciliadasBanco || 0) / totalBanco) * 100).toFixed(2)
              : '0.00'
          });
        }
      }
    }

    // 5. Evolução diária (últimos 7 dias)
    const evolucaoDiaria = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];

      let queryDia = supabase
        .from('transacoes_bancarias')
        .select('lancamento_id', { count: 'exact' })
        .eq('data', dataStr);

      if (bancoId) {
        queryDia = queryDia.eq('conta_bancaria_id', bancoId);
      }

      const { count: totalDia } = await queryDia;

      let queryConciliadasDia = supabase
        .from('transacoes_bancarias')
        .select('*', { count: 'exact' })
        .eq('data', dataStr)
        .not('lancamento_id', 'is', null);

      if (bancoId) {
        queryConciliadasDia = queryConciliadasDia.eq('conta_bancaria_id', bancoId);
      }

      const { count: conciliadasDia } = await queryConciliadasDia;

      evolucaoDiaria.push({
        data: dataStr,
        total: totalDia || 0,
        conciliadas: conciliadasDia || 0,
        naoConciliadas: (totalDia || 0) - (conciliadasDia || 0),
        percentual: totalDia > 0 ? (((conciliadasDia || 0) / totalDia) * 100).toFixed(2) : '0.00'
      });
    }

    // 6. Buscar lançamentos pendentes
    let queryLancamentosPendentes = supabase
      .from('lancamentos')
      .select('*', { count: 'exact' })
      .eq('status', 'pendente')
      .gte('data_lancamento', dataLimiteStr);

    const { count: lancamentosPendentes, error: errorLancamentos } = await queryLancamentosPendentes;

    const resultado = {
      periodo: {
        dias: parseInt(periodo),
        dataInicio: dataLimiteStr,
        dataFim: new Date().toISOString().split('T')[0]
      },
      geral: {
        totalTransacoes: totalTransacoes || 0,
        totalConciliadas: totalConciliadas || 0,
        totalNaoConciliadas: (totalTransacoes || 0) - (totalConciliadas || 0),
        percentualConciliacao: totalTransacoes > 0 
          ? (((totalConciliadas || 0) / totalTransacoes) * 100).toFixed(2)
          : '0.00',
        lancamentosPendentes: lancamentosPendentes || 0
      },
      valores,
      porBanco: estatisticasPorBanco,
      evolucaoDiaria,
      metadata: {
        dataConsulta: new Date().toISOString(),
        banco: bancoId || 'todos'
      }
    };

    console.log('✅ Estatísticas geradas com sucesso');
    console.log('📊 Resumo:', {
      total: resultado.geral.totalTransacoes,
      conciliadas: resultado.geral.totalConciliadas,
      percentual: resultado.geral.percentualConciliacao + '%'
    });

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('❌ Erro interno na API de estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/conciliacao/estatisticas - Dashboard personalizado');
    
    const { 
      bancoIds = [], 
      dataInicio, 
      dataFim, 
      metricas = ['conciliacao', 'valores', 'temporal'],
      agrupamento = 'diario' // diario, semanal, mensal
    } = await request.json();

    console.log('📊 Dashboard personalizado:', { bancoIds, dataInicio, dataFim, metricas, agrupamento });

    const resultado: any = {
      configuracao: { bancoIds, dataInicio, dataFim, metricas, agrupamento },
      dados: {}
    };

    // Métrica: Conciliação
    if (metricas.includes('conciliacao')) {
      let queryConciliacao = supabase
        .from('transacoes_bancarias')
        .select('lancamento_id', { count: 'exact' });

      if (bancoIds.length > 0) {
        queryConciliacao = queryConciliacao.in('conta_bancaria_id', bancoIds);
      }

      if (dataInicio && dataFim) {
        queryConciliacao = queryConciliacao.gte('data', dataInicio).lte('data', dataFim);
      }

      const { count: total } = await queryConciliacao;
      const { count: conciliadas } = await queryConciliacao.not('lancamento_id', 'is', null);

      resultado.dados.conciliacao = {
        total: total || 0,
        conciliadas: conciliadas || 0,
        naoConciliadas: (total || 0) - (conciliadas || 0),
        percentual: total > 0 ? (((conciliadas || 0) / total) * 100).toFixed(2) : '0.00'
      };
    }

    // Métrica: Valores
    if (metricas.includes('valores')) {
      let queryValores = supabase
        .from('transacoes_bancarias')
        .select('valor, lancamento_id');

      if (bancoIds.length > 0) {
        queryValores = queryValores.in('conta_bancaria_id', bancoIds);
      }

      if (dataInicio && dataFim) {
        queryValores = queryValores.gte('data', dataInicio).lte('data', dataFim);
      }

      const { data: transacoes } = await queryValores;

      const valoresCalculados = {
        totalCreditos: 0,
        totalDebitos: 0,
        creditosConciliados: 0,
        debitosConciliados: 0,
        creditosNaoConciliados: 0,
        debitosNaoConciliados: 0
      };

      transacoes?.forEach(t => {
        const valor = parseFloat(t.valor) || 0;
        const isConciliado = !!t.lancamento_id;
        
        if (valor >= 0) {
          valoresCalculados.totalCreditos += valor;
          if (isConciliado) {
            valoresCalculados.creditosConciliados += valor;
          } else {
            valoresCalculados.creditosNaoConciliados += valor;
          }
        } else {
          const valorAbs = Math.abs(valor);
          valoresCalculados.totalDebitos += valorAbs;
          if (isConciliado) {
            valoresCalculados.debitosConciliados += valorAbs;
          } else {
            valoresCalculados.debitosNaoConciliados += valorAbs;
          }
        }
      });

      resultado.dados.valores = valoresCalculados;
    }

    // Métrica: Temporal
    if (metricas.includes('temporal')) {
      const dadosTemporais = await gerarDadosTemporais(bancoIds, dataInicio, dataFim, agrupamento);
      resultado.dados.temporal = dadosTemporais;
    }

    console.log('✅ Dashboard personalizado gerado');

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('❌ Erro interno no dashboard personalizado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function gerarDadosTemporais(bancoIds: string[], dataInicio: string, dataFim: string, agrupamento: string) {
  // Implementação simplificada - pode ser expandida conforme necessário
  const dados = [];
  const inicio = new Date(dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const fim = new Date(dataFim || new Date());

  let currentDate = new Date(inicio);
  
  while (currentDate <= fim) {
    const dataStr = currentDate.toISOString().split('T')[0];
    
    let queryDia = supabase
      .from('transacoes_bancarias')
      .select('lancamento_id', { count: 'exact' })
      .eq('data', dataStr);

    if (bancoIds.length > 0) {
      queryDia = queryDia.in('conta_bancaria_id', bancoIds);
    }

    const { count: total } = await queryDia;
    const { count: conciliadas } = await queryDia.not('lancamento_id', 'is', null);

    dados.push({
      data: dataStr,
      total: total || 0,
      conciliadas: conciliadas || 0,
      naoConciliadas: (total || 0) - (conciliadas || 0)
    });

    // Incrementar data baseado no agrupamento
    if (agrupamento === 'diario') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (agrupamento === 'semanal') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (agrupamento === 'mensal') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return dados;
}
