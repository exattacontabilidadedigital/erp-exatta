import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/conciliacao/relatorio iniciado');
    
    const { searchParams } = new URL(request.url);
    const bancoId = searchParams.get('bancoId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    
    console.log('📊 Parâmetros do relatório:', { bancoId, dataInicio, dataFim });

    // Base query para transações bancárias
    let queryBase = supabase
      .from('transacoes_bancarias')
      .select(`
        *,
        conta_bancaria:conta_bancaria_id(nome, banco),
        lancamento:lancamento_id(
          *,
          plano_contas:plano_conta_id(nome),
          centro_custos:centro_custo_id(nome)
        )
      `);

    if (bancoId) {
      queryBase = queryBase.eq('conta_bancaria_id', bancoId);
    }

    if (dataInicio && dataFim) {
      queryBase = queryBase.gte('data', dataInicio).lte('data', dataFim);
    }

    // 1. Buscar todas as transações
    const { data: todasTransacoes, error: errorTransacoes } = await queryBase
      .order('data', { ascending: false });

    if (errorTransacoes) {
      console.error('❌ Erro ao buscar transações:', errorTransacoes);
      return NextResponse.json(
        { error: 'Erro ao buscar transações bancárias' },
        { status: 500 }
      );
    }

    console.log(`📈 Total de transações encontradas: ${todasTransacoes?.length || 0}`);

    // 2. Separar transações conciliadas e não conciliadas
    const conciliadas = todasTransacoes?.filter(t => t.lancamento_id) || [];
    const naoConciliadas = todasTransacoes?.filter(t => !t.lancamento_id) || [];

    // 3. Calcular estatísticas
    const estatisticas = {
      total: todasTransacoes?.length || 0,
      conciliadas: conciliadas.length,
      naoConciliadas: naoConciliadas.length,
      percentualConciliacao: todasTransacoes?.length > 0 
        ? ((conciliadas.length / todasTransacoes.length) * 100).toFixed(2)
        : '0.00',
      
      // Valores
      valorTotalCreditos: 0,
      valorTotalDebitos: 0,
      valorConciliadoCreditos: 0,
      valorConciliadoDebitos: 0,
      valorNaoConciliadoCreditos: 0,
      valorNaoConciliadoDebitos: 0,
      
      // Por tipo
      creditosConciliados: 0,
      debitosConciliados: 0,
      creditosNaoConciliados: 0,
      debitosNaoConciliados: 0
    };

    // Calcular valores
    todasTransacoes?.forEach(transacao => {
      const valor = parseFloat(transacao.valor) || 0;
      const isCredito = valor >= 0;
      
      if (isCredito) {
        estatisticas.valorTotalCreditos += valor;
        if (transacao.lancamento_id) {
          estatisticas.valorConciliadoCreditos += valor;
          estatisticas.creditosConciliados++;
        } else {
          estatisticas.valorNaoConciliadoCreditos += valor;
          estatisticas.creditosNaoConciliados++;
        }
      } else {
        estatisticas.valorTotalDebitos += Math.abs(valor);
        if (transacao.lancamento_id) {
          estatisticas.valorConciliadoDebitos += Math.abs(valor);
          estatisticas.debitosConciliados++;
        } else {
          estatisticas.valorNaoConciliadoDebitos += Math.abs(valor);
          estatisticas.debitosNaoConciliados++;
        }
      }
    });

    // 4. Buscar lançamentos não conciliados (para mostrar lançamentos sem transação bancária)
    let queryLancamentos = supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(nome),
        centro_custos:centro_custo_id(nome)
      `)
      .eq('status', 'pendente');

    if (dataInicio && dataFim) {
      queryLancamentos = queryLancamentos.gte('data_lancamento', dataInicio).lte('data_lancamento', dataFim);
    }

    const { data: lancamentosPendentes, error: errorLancamentos } = await queryLancamentos
      .order('data_lancamento', { ascending: false });

    if (errorLancamentos) {
      console.warn('⚠️ Erro ao buscar lançamentos pendentes:', errorLancamentos);
    }

    // 5. Agrupar por data para análise temporal
    const agrupamentoPorData = {};
    todasTransacoes?.forEach(transacao => {
      const data = transacao.data;
      if (!agrupamentoPorData[data]) {
        agrupamentoPorData[data] = {
          data,
          total: 0,
          conciliadas: 0,
          naoConciliadas: 0,
          valorTotal: 0,
          valorConciliado: 0,
          valorNaoConciliado: 0
        };
      }
      
      const grupo = agrupamentoPorData[data];
      const valor = parseFloat(transacao.valor) || 0;
      
      grupo.total++;
      grupo.valorTotal += Math.abs(valor);
      
      if (transacao.lancamento_id) {
        grupo.conciliadas++;
        grupo.valorConciliado += Math.abs(valor);
      } else {
        grupo.naoConciliadas++;
        grupo.valorNaoConciliado += Math.abs(valor);
      }
    });

    const analiseTemporal = Object.values(agrupamentoPorData)
      .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime());

    // 6. Principais desconciliações (maiores valores)
    const principaisDesconciliacoes = naoConciliadas
      .sort((a, b) => Math.abs(parseFloat(b.valor)) - Math.abs(parseFloat(a.valor)))
      .slice(0, 10);

    console.log('✅ Relatório gerado com sucesso');
    console.log('📊 Estatísticas:', {
      total: estatisticas.total,
      conciliadas: estatisticas.conciliadas,
      percentual: estatisticas.percentualConciliacao + '%'
    });

    return NextResponse.json({
      estatisticas,
      conciliadas,
      naoConciliadas,
      lancamentosPendentes: lancamentosPendentes || [],
      analiseTemporal,
      principaisDesconciliacoes,
      metadata: {
        dataGeracao: new Date().toISOString(),
        periodo: dataInicio && dataFim ? { inicio: dataInicio, fim: dataFim } : null,
        banco: bancoId || 'todos'
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na API de relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/conciliacao/relatorio - Exportação iniciada');
    
    const { 
      bancoId, 
      dataInicio, 
      dataFim, 
      formato = 'json',
      incluirDetalhes = true 
    } = await request.json();

    console.log('📊 Parâmetros de exportação:', { bancoId, dataInicio, dataFim, formato, incluirDetalhes });

    // Reutilizar a lógica do GET
    const url = new URL(request.url);
    if (bancoId) url.searchParams.set('bancoId', bancoId);
    if (dataInicio) url.searchParams.set('dataInicio', dataInicio);
    if (dataFim) url.searchParams.set('dataFim', dataFim);

    // Simular GET request
    const mockRequest = new NextRequest(url.toString());
    const response = await exports.GET(mockRequest);
    const dados = await response.json();

    if (!response.ok) {
      return response;
    }

    // Preparar dados para exportação
    let dadosExportacao;

    switch (formato.toLowerCase()) {
      case 'csv':
        dadosExportacao = formatarParaCSV(dados, incluirDetalhes);
        break;
      case 'excel':
        dadosExportacao = formatarParaExcel(dados, incluirDetalhes);
        break;
      default:
        dadosExportacao = dados;
    }

    console.log('✅ Exportação concluída');

    return NextResponse.json({
      success: true,
      formato,
      dados: dadosExportacao,
      metadata: {
        totalRegistros: dados.estatisticas.total,
        dataExportacao: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na exportação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function formatarParaCSV(dados: any, incluirDetalhes: boolean) {
  const linhas = [];
  
  // Cabeçalho do resumo
  linhas.push('RELATÓRIO DE CONCILIAÇÃO BANCÁRIA');
  linhas.push('');
  linhas.push(`Data de Geração,${dados.metadata.dataGeracao}`);
  linhas.push(`Total de Transações,${dados.estatisticas.total}`);
  linhas.push(`Conciliadas,${dados.estatisticas.conciliadas}`);
  linhas.push(`Não Conciliadas,${dados.estatisticas.naoConciliadas}`);
  linhas.push(`Percentual de Conciliação,${dados.estatisticas.percentualConciliacao}%`);
  linhas.push('');

  if (incluirDetalhes) {
    // Transações não conciliadas
    linhas.push('TRANSAÇÕES NÃO CONCILIADAS');
    linhas.push('Data,Descrição,Valor,Tipo,Banco');
    
    dados.naoConciliadas.forEach((transacao: any) => {
      const valor = parseFloat(transacao.valor);
      const tipo = valor >= 0 ? 'Crédito' : 'Débito';
      linhas.push(`${transacao.data},"${transacao.descricao}",${Math.abs(valor).toFixed(2)},${tipo},"${transacao.conta_bancaria?.nome || 'N/A'}"`);
    });
    
    linhas.push('');
    
    // Lançamentos pendentes
    linhas.push('LANÇAMENTOS PENDENTES');
    linhas.push('Data,Descrição,Valor,Tipo,Plano de Contas');
    
    dados.lancamentosPendentes.forEach((lancamento: any) => {
      linhas.push(`${lancamento.data_lancamento},"${lancamento.descricao}",${Math.abs(parseFloat(lancamento.valor)).toFixed(2)},${lancamento.tipo},"${lancamento.plano_contas?.nome || 'N/A'}"`);
    });
  }

  return linhas.join('\n');
}

function formatarParaExcel(dados: any, incluirDetalhes: boolean) {
  // Retorna estrutura que pode ser usada para gerar Excel no frontend
  return {
    planilhas: [
      {
        nome: 'Resumo',
        dados: [
          ['Métrica', 'Valor'],
          ['Total de Transações', dados.estatisticas.total],
          ['Conciliadas', dados.estatisticas.conciliadas],
          ['Não Conciliadas', dados.estatisticas.naoConciliadas],
          ['Percentual de Conciliação', dados.estatisticas.percentualConciliacao + '%'],
          ['Valor Total Créditos', `R$ ${dados.estatisticas.valorTotalCreditos.toFixed(2)}`],
          ['Valor Total Débitos', `R$ ${dados.estatisticas.valorTotalDebitos.toFixed(2)}`]
        ]
      },
      ...(incluirDetalhes ? [
        {
          nome: 'Não Conciliadas',
          dados: [
            ['Data', 'Descrição', 'Valor', 'Tipo', 'Banco'],
            ...dados.naoConciliadas.map((t: any) => [
              t.data,
              t.descricao,
              Math.abs(parseFloat(t.valor)),
              parseFloat(t.valor) >= 0 ? 'Crédito' : 'Débito',
              t.conta_bancaria?.nome || 'N/A'
            ])
          ]
        },
        {
          nome: 'Lançamentos Pendentes',
          dados: [
            ['Data', 'Descrição', 'Valor', 'Tipo', 'Plano de Contas'],
            ...dados.lancamentosPendentes.map((l: any) => [
              l.data_lancamento,
              l.descricao,
              Math.abs(parseFloat(l.valor)),
              l.tipo,
              l.plano_contas?.nome || 'N/A'
            ])
          ]
        }
      ] : [])
    ]
  };
}
