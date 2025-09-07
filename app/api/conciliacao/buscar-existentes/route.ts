import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/conciliacao/buscar-existentes iniciado');
    
    // Configuração do Supabase - Usar chave pública como nas outras APIs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔍 Verificando configuração do Supabase:');
    console.log('URL:', supabaseUrl ? 'DEFINIDA' : 'INDEFINIDA');
    console.log('ANON_KEY:', supabaseKey ? 'DEFINIDA' : 'INDEFINIDA');

    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL não definida');
      return NextResponse.json(
        { error: 'supabaseUrl is required' },
        { status: 500 }
      );
    }

    if (!supabaseKey) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não definida');
      return NextResponse.json(
        { error: 'supabaseKey is required' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
    // Suporte para múltiplas contas bancárias
    const contaBancariaIds = searchParams.getAll('contaBancariaId[]');
    // Fallback para compatibilidade com versão anterior (uma única conta)
    const contaBancariaId = contaBancariaIds.length > 0 ? null : searchParams.get('contaBancariaId');
    const status = searchParams.get('status'); // Sem padrão - será null se não fornecido
    const planoContaId = searchParams.get('planoContaId');
    const centroCustoId = searchParams.get('centroCustoId');
    const buscarValorAbsoluto = searchParams.get('buscarValorAbsoluto') === 'true';

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
      contaBancariaId,
      contaBancariaIds,
      status,
      planoContaId,
      centroCustoId,
      buscarValorAbsoluto
    });

    // 🔍 DEBUG: Verificar se há lançamentos no banco (SEM FILTROS)
    console.log('🔍 DEBUG: Verificando total de lançamentos no banco SEM FILTROS...');
    const debugTotalQuery = supabase
      .from('lancamentos')
      .select('*', { count: 'exact', head: true });
    const { count: debugTotal, error: debugError } = await debugTotalQuery;
    console.log('🔍 DEBUG: Total geral no banco (SEM FILTROS):', debugTotal);

    // 🔍 DEBUG: Verificar com status pendente apenas
    if (status === 'pendente' || !status) {
      console.log('🔍 DEBUG: Verificando total de lançamentos com status=pendente...');
      const debugPendenteQuery = supabase
        .from('lancamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');
      const { count: debugPendente } = await debugPendenteQuery;
      console.log('🔍 DEBUG: Total com status=pendente:', debugPendente);
    }

    // 🔍 DEBUG: Testar busca SEM LIMIT para verificar filtros
    console.log('🔍 DEBUG: Testando busca sem limit para entender filtros...');

    // Query base com joins
    let query = supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(id, nome, codigo),
        centro_custos:centro_custo_id(id, nome, codigo),
        contas_bancarias:conta_bancaria_id(id, agencia, conta, digito, bancos(nome))
      `);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
      console.log(`🔍 Filtro aplicado: status = ${status}`);
    }

    if (busca && busca.trim()) {
      const termoBusca = busca.trim();
      
      // Verificar se é um número (para busca por valor)
      const valorNumerico = parseFloat(termoBusca.replace(/[.,]/g, '.'));
      const isNumero = !isNaN(valorNumerico);
      
      // Criar filtro OR para buscar em múltiplos campos
      if (isNumero) {
        // Se for número, buscar por valor OU descrição OU documento (mas evitar vírgulas na busca textual)
        const termoBuscaLimpo = termoBusca.replace(/[,]/g, ''); // Remove vírgulas da busca textual
        query = query.or(
          `descricao.ilike.%${termoBuscaLimpo}%,` +
          `numero_documento.ilike.%${termoBuscaLimpo}%,` +
          `valor.eq.${valorNumerico}`
        );
      } else {
        // Se não for número, buscar em descrição e documento apenas
        query = query.or(
          `descricao.ilike.%${termoBusca}%,` +
          `numero_documento.ilike.%${termoBusca}%`
        );
      }
      
      console.log(`🔍 Filtro aplicado: busca expandida = "${termoBusca}" (isNumero: ${isNumero})`);
    }

    if (dataInicio) {
      query = query.gte('data_lancamento', dataInicio);
      console.log(`🔍 Filtro aplicado: data >= ${dataInicio}`);
    }

    if (dataFim) {
      query = query.lte('data_lancamento', dataFim);
      console.log(`🔍 Filtro aplicado: data <= ${dataFim}`);
    }

    // Aplicar filtros de valor SEMPRE no SQL para evitar problemas de paginação
    // O filtro absoluto (valor exato) será aplicado via SQL também
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

    // Filtro para múltiplas contas bancárias ou uma única conta
    if (contaBancariaIds.length > 0) {
      query = query.in('conta_bancaria_id', contaBancariaIds);
      console.log(`🔍 Filtro aplicado: conta_bancaria_id IN [${contaBancariaIds.join(', ')}]`);
    } else if (contaBancariaId) {
      query = query.eq('conta_bancaria_id', contaBancariaId);
      console.log(`🔍 Filtro aplicado: conta_bancaria_id = ${contaBancariaId}`);
    }

    if (planoContaId) {
      query = query.eq('plano_conta_id', planoContaId);
      console.log(`🔍 Filtro aplicado: plano_conta_id = ${planoContaId}`);
    }

    if (centroCustoId) {
      query = query.eq('centro_custo_id', centroCustoId);
      console.log(`🔍 Filtro aplicado: centro_custo_id = ${centroCustoId}`);
    }

    // Buscar dados diretamente
    const { data: lancamentosData, error: fetchError } = await query
      .range(offset, offset + limit - 1)
      .order('data_lancamento', { ascending: false })
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erro ao buscar lançamentos:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar lançamentos', details: fetchError.message },
        { status: 500 }
      );
    }

    const lancamentos = lancamentosData || [];
    const totalEstimado = lancamentos.length < limit ? lancamentos.length : (page * limit) + 1;

    // Debug especial quando não há resultados com filtros de valor
    if (lancamentos.length === 0 && (valorMin || valorMax)) {
      console.log('🔍 ZERO RESULTADOS com filtros de valor - investigando...');
      
      // Buscar alguns valores próximos para debug
      const debugQuery = supabase
        .from('lancamentos')
        .select('id, valor, descricao, data_lancamento, status')
        .eq('status', status || 'pendente')
        .limit(10);
        
      const { data: debugData, error: debugError } = await debugQuery;
      
      if (!debugError && debugData) {
        console.log('🔍 Amostra de valores no banco:', debugData.map(l => ({
          id: l.id,
          valor: l.valor,
          valorAbsoluto: Math.abs(parseFloat(l.valor?.toString() || '0')),
          status: l.status
        })));
        
        if (valorMin && valorMax) {
          console.log(`🔍 Filtros aplicados: valorMin=${valorMin}, valorMax=${valorMax}`);
          const valoresNaFaixa = debugData.filter(l => {
            const valor = Math.abs(parseFloat(l.valor?.toString() || '0'));
            return valor >= parseFloat(valorMin) && valor <= parseFloat(valorMax);
          });
          console.log('🔍 Valores que deveriam ser encontrados:', valoresNaFaixa);
        }
      }
    }

    // Aplicar filtro de valor absoluto SE necessário (pós-query)
    let lancamentosFiltrados = lancamentos;
    let totalFiltrado = lancamentos.length;
    
    console.log('🔍 DEBUG pós-busca:', {
      totalEstimado,
      lancamentosRetornados: lancamentos.length,
      buscarValorAbsoluto,
      valorMin,
      valorMax
    });
    
    if (buscarValorAbsoluto && valorMin && valorMax) {
      const valorMinFloat = parseFloat(valorMin);
      const valorMaxFloat = parseFloat(valorMax);
      
      if (!isNaN(valorMinFloat) && !isNaN(valorMaxFloat)) {
        console.log(`🔍 Aplicando filtro de valor absoluto pós-busca: ${valorMinFloat} - ${valorMaxFloat}`);
        console.log(`🔍 Lançamentos antes do filtro: ${lancamentosFiltrados.length}`);
        
        // Debug: Mostrar valores disponíveis
        if (lancamentosFiltrados.length > 0) {
          console.log('🔍 Valores disponíveis:', lancamentosFiltrados.slice(0, 5).map(l => ({
            id: l.id.substring(0, 8),
            valor: l.valor,
            valorAbs: Math.abs(parseFloat(l.valor?.toString() || '0'))
          })));
        }
        
        // Filtrar considerando valor absoluto
        const lancamentosOriginais = [...lancamentosFiltrados];
        console.log(`🔍 Total de lançamentos antes do filtro absoluto: ${lancamentosOriginais.length}`);
        
        lancamentosFiltrados = lancamentosOriginais.filter(lancamento => {
          const valor = parseFloat(lancamento.valor?.toString() || '0');
          const valorAbsoluto = Math.abs(valor);
          
          // Verificar se o valor absoluto está na faixa
          const valorAbsolutoNaFaixa = valorAbsoluto >= valorMinFloat && valorAbsoluto <= valorMaxFloat;
          
          if (valorAbsolutoNaFaixa) {
            console.log(`✅ Incluído: ID ${lancamento.id.substring(0, 8)}, valor: ${valor}, abs: ${valorAbsoluto}`);
          }
          
          return valorAbsolutoNaFaixa;
        });
        
        totalFiltrado = lancamentosFiltrados.length;
        console.log(`🔍 Filtro absoluto aplicado: ${lancamentosFiltrados.length} de ${lancamentosOriginais.length} lançamentos`);
      }
    }

    const hasMore = lancamentos.length >= limit;

    console.log(`✅ Busca concluída:`, {
      totalEstimado,
      totalFiltrado,
      lancamentosRetornados: lancamentosFiltrados.length,
      page,
      limit,
      hasMore,
      primeirosIds: lancamentosFiltrados.slice(0, 3).map(l => l.id) || []
    });

    // Validar estrutura dos dados
    if (lancamentosFiltrados && lancamentosFiltrados.length > 0) {
      const primeiroLancamento = lancamentosFiltrados[0];
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
      lancamentos: lancamentosFiltrados,
      total: totalFiltrado,
      page,
      limit,
      offset,
      hasMore: buscarValorAbsoluto ? false : hasMore, // Desabilitar paginação para filtro absoluto
      filtros: {
        busca,
        dataInicio,
        dataFim,
        valorMin,
        valorMax,
        tipo,
        status,
        planoContaId,
        centroCustoId,
        buscarValorAbsoluto
      },
      metadata: {
        dataConsulta: new Date().toISOString(),
        tempoResposta: Date.now(),
        filtroAbsolutoAplicado: buscarValorAbsoluto
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
