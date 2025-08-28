import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/conciliacao/sugerir-pareamento iniciado');
    
    const { bancoId, dataInicio, dataFim, status = 'pendente' } = await request.json();

    if (!bancoId) {
      console.log('❌ Banco ID não fornecido');
      return NextResponse.json(
        { error: 'Banco ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📊 Parâmetros de busca:', { bancoId, dataInicio, dataFim, status });

    // 1. Buscar transações bancárias não conciliadas
    let queryBanco = supabase
      .from('transacoes_bancarias')
      .select('*')
      .eq('conta_bancaria_id', bancoId)
      .is('lancamento_id', null); // Não conciliadas

    if (dataInicio && dataFim) {
      queryBanco = queryBanco.gte('data', dataInicio).lte('data', dataFim);
    }

    const { data: transacoesBanco, error: errorBanco } = await queryBanco.order('data', { ascending: false });

    if (errorBanco) {
      console.error('❌ Erro ao buscar transações bancárias:', errorBanco);
      return NextResponse.json(
        { error: 'Erro ao buscar transações bancárias' },
        { status: 500 }
      );
    }

    console.log(`📈 Encontradas ${transacoesBanco?.length || 0} transações bancárias não conciliadas`);

    // 2. Buscar lançamentos não conciliados
    let queryLancamentos = supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(nome),
        centro_custos:centro_custo_id(nome)
      `)
      .eq('status', status);

    if (dataInicio && dataFim) {
      queryLancamentos = queryLancamentos.gte('data_lancamento', dataInicio).lte('data_lancamento', dataFim);
    }

    const { data: lancamentos, error: errorLancamentos } = await queryLancamentos
      .order('data_lancamento', { ascending: false });

    if (errorLancamentos) {
      console.error('❌ Erro ao buscar lançamentos:', errorLancamentos);
      return NextResponse.json(
        { error: 'Erro ao buscar lançamentos' },
        { status: 500 }
      );
    }

    console.log(`📊 Encontrados ${lancamentos?.length || 0} lançamentos não conciliados`);

    if (!transacoesBanco?.length || !lancamentos?.length) {
      console.log('ℹ️ Não há transações ou lançamentos suficientes para pareamento');
      return NextResponse.json({
        sugestoes: [],
        estatisticas: {
          transacoesBanco: transacoesBanco?.length || 0,
          lancamentos: lancamentos?.length || 0,
          sugestoes: 0
        }
      });
    }

    // 3. Algoritmo de pareamento
    const sugestoes = [];

    for (const transacao of transacoesBanco) {
      for (const lancamento of lancamentos) {
        const sugestao = avaliarPareamento(transacao, lancamento);
        
        if (sugestao.confianca >= 0.5) { // Apenas sugestões com 50%+ de confiança
          sugestoes.push(sugestao);
        }
      }
    }

    // Ordenar por confiança (maior primeiro)
    sugestoes.sort((a, b) => b.confianca - a.confianca);

    // Limitar a 50 melhores sugestões para performance
    const sugestoesFiltradas = sugestoes.slice(0, 50);

    console.log(`✅ Algoritmo concluído: ${sugestoesFiltradas.length} sugestões geradas`);
    console.log('📊 Distribuição de confiança:', {
      alta: sugestoesFiltradas.filter(s => s.confianca >= 0.8).length,
      media: sugestoesFiltradas.filter(s => s.confianca >= 0.6 && s.confianca < 0.8).length,
      baixa: sugestoesFiltradas.filter(s => s.confianca < 0.6).length
    });

    return NextResponse.json({
      sugestoes: sugestoesFiltradas,
      estatisticas: {
        transacoesBanco: transacoesBanco.length,
        lancamentos: lancamentos.length,
        sugestoes: sugestoesFiltradas.length,
        altaConfianca: sugestoesFiltradas.filter(s => s.confianca >= 0.8).length,
        mediaConfianca: sugestoesFiltradas.filter(s => s.confianca >= 0.6 && s.confianca < 0.8).length,
        baixaConfianca: sugestoesFiltradas.filter(s => s.confianca < 0.6).length
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na API de pareamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function avaliarPareamento(transacao: any, lancamento: any) {
  let pontuacao = 0;
  const motivos = [];

  // 1. Comparação de valor (peso: 40%)
  const valorTransacao = Math.abs(parseFloat(transacao.valor));
  const valorLancamento = Math.abs(parseFloat(lancamento.valor));
  const diferencaValor = Math.abs(valorTransacao - valorLancamento);
  const percentualDiferenca = valorTransacao > 0 ? (diferencaValor / valorTransacao) * 100 : 100;

  if (diferencaValor === 0) {
    pontuacao += 40;
    motivos.push('Valor exato');
  } else if (percentualDiferenca <= 1) {
    pontuacao += 35;
    motivos.push(`Valor muito próximo (${percentualDiferenca.toFixed(2)}% diferença)`);
  } else if (percentualDiferenca <= 5) {
    pontuacao += 25;
    motivos.push(`Valor próximo (${percentualDiferenca.toFixed(2)}% diferença)`);
  } else if (percentualDiferenca <= 10) {
    pontuacao += 15;
    motivos.push(`Valor relativamente próximo (${percentualDiferenca.toFixed(2)}% diferença)`);
  }

  // 2. Comparação de data (peso: 30%)
  const dataTransacao = new Date(transacao.data);
  const dataLancamento = new Date(lancamento.data_lancamento);
  const diferencaDias = Math.abs((dataTransacao.getTime() - dataLancamento.getTime()) / (1000 * 60 * 60 * 24));

  if (diferencaDias === 0) {
    pontuacao += 30;
    motivos.push('Data exata');
  } else if (diferencaDias <= 1) {
    pontuacao += 25;
    motivos.push(`Data muito próxima (${diferencaDias.toFixed(1)} dias)`);
  } else if (diferencaDias <= 3) {
    pontuacao += 20;
    motivos.push(`Data próxima (${diferencaDias.toFixed(1)} dias)`);
  } else if (diferencaDias <= 7) {
    pontuacao += 10;
    motivos.push(`Data na mesma semana (${diferencaDias.toFixed(1)} dias)`);
  } else if (diferencaDias <= 15) {
    pontuacao += 5;
    motivos.push(`Data próxima (${diferencaDias.toFixed(1)} dias)`);
  }

  // 3. Comparação de descrição (peso: 20%)
  const descricaoTransacao = (transacao.descricao || '').toLowerCase().trim();
  const descricaoLancamento = (lancamento.descricao || '').toLowerCase().trim();
  
  if (descricaoTransacao && descricaoLancamento) {
    const palavrasTransacao = descricaoTransacao.split(/\s+/);
    const palavrasLancamento = descricaoLancamento.split(/\s+/);
    
    let palavrasComuns = 0;
    palavrasTransacao.forEach(palavra => {
      if (palavra.length > 2 && palavrasLancamento.some(p => p.includes(palavra) || palavra.includes(p))) {
        palavrasComuns++;
      }
    });

    const totalPalavras = Math.max(palavrasTransacao.length, palavrasLancamento.length);
    const similaridade = totalPalavras > 0 ? (palavrasComuns / totalPalavras) * 100 : 0;

    if (similaridade >= 70) {
      pontuacao += 20;
      motivos.push(`Descrição muito similar (${similaridade.toFixed(1)}%)`);
    } else if (similaridade >= 50) {
      pontuacao += 15;
      motivos.push(`Descrição similar (${similaridade.toFixed(1)}%)`);
    } else if (similaridade >= 30) {
      pontuacao += 10;
      motivos.push(`Descrição parcialmente similar (${similaridade.toFixed(1)}%)`);
    } else if (similaridade > 0) {
      pontuacao += 5;
      motivos.push(`Descrição com alguma similaridade (${similaridade.toFixed(1)}%)`);
    }
  }

  // 4. Compatibilidade de tipo (peso: 10%)
  const tipoTransacao = parseFloat(transacao.valor) >= 0 ? 'credito' : 'debito';
  const tipoLancamento = lancamento.tipo;

  if ((tipoTransacao === 'credito' && tipoLancamento === 'receita') ||
      (tipoTransacao === 'debito' && tipoLancamento === 'despesa')) {
    pontuacao += 10;
    motivos.push('Tipo compatível');
  }

  const confianca = pontuacao / 100;

  return {
    transacao_bancaria: transacao,
    lancamento: lancamento,
    confianca: Math.min(confianca, 1.0),
    pontuacao,
    motivos,
    detalhes: {
      diferencaValor: diferencaValor.toFixed(2),
      percentualDiferenca: percentualDiferenca.toFixed(2),
      diferencaDias: diferencaDias.toFixed(1),
      valorTransacao: valorTransacao.toFixed(2),
      valorLancamento: valorLancamento.toFixed(2)
    }
  };
}
