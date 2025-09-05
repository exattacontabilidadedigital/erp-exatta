import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/lancamentos iniciado');
    
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresa_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tipo = searchParams.get('tipo');
    const valorMin = searchParams.get('valor_min');
    const valorMax = searchParams.get('valor_max');
    const busca = searchParams.get('busca');
    
    console.log('📊 Parâmetros:', { 
      empresaId, 
      status, 
      limit, 
      offset, 
      tipo, 
      valorMin, 
      valorMax,
      busca 
    });

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresa_id é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO: Construir query base EXCLUINDO lançamentos já conciliados
    let query = supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(nome),
        centro_custos:centro_custo_id(nome),
        conta_bancaria:conta_bancaria_id(
          id,
          agencia,
          conta,
          digito,
          banco_id,
          saldo_atual
        )
      `)
      .eq('empresa_id', empresaId);

    // ✅ FILTRO CRÍTICO: Excluir lançamentos já conciliados
    // Buscar IDs de lançamentos que já estão em matches confirmados
    const { data: matchesConfirmados, error: matchError } = await supabase
      .from('transaction_matches')
      .select('system_transaction_id')
      .eq('status', 'confirmed');

    if (matchError) {
      console.error('❌ Erro ao buscar matches confirmados:', matchError);
      return NextResponse.json(
        { error: 'Erro ao verificar lançamentos conciliados', details: matchError.message },
        { status: 500 }
      );
    }

    const idsJaConciliados = matchesConfirmados?.map(m => m.system_transaction_id) || [];
    
    console.log('🚫 Lançamentos já conciliados a serem excluídos:', idsJaConciliados.length);
    
    // Se há lançamentos conciliados, excluí-los da busca
    if (idsJaConciliados.length > 0) {
      query = query.not('id', 'in', `(${idsJaConciliados.map(id => `"${id}"`).join(',')})`);
    }

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (valorMin) {
      const valorMinFloat = parseFloat(valorMin);
      if (!isNaN(valorMinFloat)) {
        query = query.gte('valor', valorMinFloat);
      }
    }
    
    if (valorMax) {
      const valorMaxFloat = parseFloat(valorMax);
      if (!isNaN(valorMaxFloat)) {
        query = query.lte('valor', valorMaxFloat);
      }
    }
    
    if (busca && busca.trim()) {
      query = query.or(`descricao.ilike.%${busca.trim()}%,numero_documento.ilike.%${busca.trim()}%`);
    }

    // Aplicar paginação e ordenação
    const { data: lancamentos, error } = await query
      .range(offset, offset + limit - 1)
      .order('data_lancamento', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar lançamentos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar lançamentos', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Lançamentos encontrados: ${lancamentos?.length || 0}`);

    // Para debug, verificar estrutura dos primeiros lançamentos
    if (lancamentos && lancamentos.length > 0) {
      console.log('📋 Primeiro lançamento:', {
        id: lancamentos[0].id,
        tipo: lancamentos[0].tipo,
        valor: lancamentos[0].valor,
        descricao: lancamentos[0].descricao,
        status: lancamentos[0].status
      });
    }

    return NextResponse.json(lancamentos || []);

  } catch (error) {
    console.error('❌ Erro interno na API de lançamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/lancamentos iniciado');
    
    const body = await request.json();
    console.log('📊 Dados recebidos:', body);

    // Validar campos obrigatórios
    const { 
      empresa_id,
      tipo,
      descricao,
      valor,
      data_lancamento,
      plano_conta_id,
      centro_custo_id,
      status = 'pendente'
    } = body;

    if (!empresa_id || !tipo || !descricao || !valor || !data_lancamento || !plano_conta_id || !centro_custo_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios missing' },
        { status: 400 }
      );
    }

    // Inserir lançamento
    const { data: novoLancamento, error } = await supabase
      .from('lancamentos')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar lançamento:', error);
      return NextResponse.json(
        { error: 'Erro ao criar lançamento', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Lançamento criado com sucesso:', novoLancamento.id);

    return NextResponse.json(novoLancamento, { status: 201 });

  } catch (error) {
    console.error('❌ Erro interno na criação de lançamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
