import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/conciliacao/buscar-existentes iniciado');
    
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Parâmetros de filtro
    const busca = searchParams.get('busca');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const valorMin = searchParams.get('valorMin');
    const valorMax = searchParams.get('valorMax');
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status') || 'pendente'; // Padrão: apenas pendentes
    const planoContaId = searchParams.get('planoContaId');
    const centroCustoId = searchParams.get('centroCustoId');

    console.log('📊 Parâmetros recebidos:', {
      page,
      limit,
      offset,
      busca,
      dataInicio,
      dataFim,
      valorMin,
      valorMax,
      tipo,
      status,
      planoContaId,
      centroCustoId
    });

    // Query base com joins
    let query = supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(id, nome, codigo),
        centro_custos:centro_custo_id(id, nome, codigo)
      `);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
      console.log(`🔍 Filtro aplicado: status = ${status}`);
    }

    if (busca && busca.trim()) {
      query = query.ilike('descricao', `%${busca.trim()}%`);
      console.log(`🔍 Filtro aplicado: busca = "${busca.trim()}"`);
    }

    if (dataInicio) {
      query = query.gte('data_lancamento', dataInicio);
      console.log(`🔍 Filtro aplicado: data >= ${dataInicio}`);
    }

    if (dataFim) {
      query = query.lte('data_lancamento', dataFim);
      console.log(`🔍 Filtro aplicado: data <= ${dataFim}`);
    }

    if (valorMin) {
      const valorMinFloat = parseFloat(valorMin);
      if (!isNaN(valorMinFloat)) {
        query = query.gte('valor', valorMinFloat);
        console.log(`🔍 Filtro aplicado: valor >= ${valorMinFloat}`);
      }
    }

    if (valorMax) {
      const valorMaxFloat = parseFloat(valorMax);
      if (!isNaN(valorMaxFloat)) {
        query = query.lte('valor', valorMaxFloat);
        console.log(`🔍 Filtro aplicado: valor <= ${valorMaxFloat}`);
      }
    }

    if (tipo && (tipo === 'receita' || tipo === 'despesa')) {
      query = query.eq('tipo', tipo);
      console.log(`🔍 Filtro aplicado: tipo = ${tipo}`);
    }

    if (planoContaId) {
      query = query.eq('plano_conta_id', planoContaId);
      console.log(`🔍 Filtro aplicado: plano_conta_id = ${planoContaId}`);
    }

    if (centroCustoId) {
      query = query.eq('centro_custo_id', centroCustoId);
      console.log(`🔍 Filtro aplicado: centro_custo_id = ${centroCustoId}`);
    }

    // PRIMEIRO: Contar total (sem paginação)
    console.log('🔢 Contando total de registros...');
    
    // Criar query separada para contagem
    let countQuery = supabase
      .from('lancamentos')
      .select('*', { count: 'exact', head: true });

    // Aplicar os mesmos filtros para contagem
    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (busca && busca.trim()) {
      countQuery = countQuery.ilike('descricao', `%${busca.trim()}%`);
    }
    if (dataInicio) {
      countQuery = countQuery.gte('data_lancamento', dataInicio);
    }
    if (dataFim) {
      countQuery = countQuery.lte('data_lancamento', dataFim);
    }
    if (valorMin) {
      const valorMinFloat = parseFloat(valorMin);
      if (!isNaN(valorMinFloat)) {
        countQuery = countQuery.gte('valor', valorMinFloat);
      }
    }
    if (valorMax) {
      const valorMaxFloat = parseFloat(valorMax);
      if (!isNaN(valorMaxFloat)) {
        countQuery = countQuery.lte('valor', valorMaxFloat);
      }
    }
    if (tipo && (tipo === 'receita' || tipo === 'despesa')) {
      countQuery = countQuery.eq('tipo', tipo);
    }
    if (planoContaId) {
      countQuery = countQuery.eq('plano_conta_id', planoContaId);
    }
    if (centroCustoId) {
      countQuery = countQuery.eq('centro_custo_id', centroCustoId);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return NextResponse.json(
        { error: 'Erro ao contar registros', details: countError.message },
        { status: 500 }
      );
    }

    console.log(`📊 Total de registros encontrados: ${totalCount}`);

    // SEGUNDO: Buscar registros com paginação
    console.log(`📄 Buscando registros da página ${page} (limit: ${limit}, offset: ${offset})...`);
    
    const { data: lancamentos, error: dataError } = await query
      .range(offset, offset + limit - 1)
      .order('data_lancamento', { ascending: false })
      .order('created_at', { ascending: false });

    if (dataError) {
      console.error('❌ Erro ao buscar lançamentos:', dataError);
      return NextResponse.json(
        { error: 'Erro ao buscar lançamentos', details: dataError.message },
        { status: 500 }
      );
    }

    const hasMore = totalCount ? (offset + limit < totalCount) : false;

    console.log(`✅ Busca concluída:`, {
      totalCount,
      lancamentosRetornados: lancamentos?.length || 0,
      page,
      limit,
      hasMore,
      primeirosIds: lancamentos?.slice(0, 3).map(l => l.id) || []
    });

    // Validar estrutura dos dados
    if (lancamentos && lancamentos.length > 0) {
      const primeiroLancamento = lancamentos[0];
      console.log('🔍 Estrutura do primeiro lançamento:', {
        id: primeiroLancamento.id,
        temDescricao: !!primeiroLancamento.descricao,
        temValor: primeiroLancamento.valor !== null && primeiroLancamento.valor !== undefined,
        temData: !!primeiroLancamento.data_lancamento,
        temTipo: !!primeiroLancamento.tipo,
        temStatus: !!primeiroLancamento.status,
        temPlanoContas: !!primeiroLancamento.plano_contas,
        campos: Object.keys(primeiroLancamento)
      });
    }

    const response = {
      lancamentos: lancamentos || [],
      total: totalCount || 0,
      page,
      limit,
      offset,
      hasMore,
      filtros: {
        busca,
        dataInicio,
        dataFim,
        valorMin,
        valorMax,
        tipo,
        status,
        planoContaId,
        centroCustoId
      },
      metadata: {
        dataConsulta: new Date().toISOString(),
        tempoResposta: Date.now()
      }
    };

    console.log('📤 Enviando resposta com estrutura:', {
      lancamentos: response.lancamentos.length,
      total: response.total,
      hasMore: response.hasMore,
      page: response.page
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erro interno na API:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Endpoint POST para busca avançada (opcional)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/conciliacao/buscar-existentes iniciado');
    
    const body = await request.json();
    console.log('📊 Body da requisição:', body);
    
    // Converter parâmetros do body para searchParams
    const searchParams = new URLSearchParams();
    
    Object.entries(body).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    // Criar request GET simulado
    const simulatedRequest = new NextRequest(
      `${request.url}?${searchParams.toString()}`,
      { method: 'GET' }
    );
    
    return await exports.GET(simulatedRequest);
    
  } catch (error) {
    console.error('❌ Erro no POST:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
