import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/conciliacao/confirmar-pareamento iniciado');
    
    const { transacaoBancariaId, lancamentoId, observacoes } = await request.json();

    if (!transacaoBancariaId || !lancamentoId) {
      console.log('❌ IDs da transação bancária ou lançamento não fornecidos');
      return NextResponse.json(
        { error: 'IDs da transação bancária e lançamento são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('📊 Confirmando pareamento:', { transacaoBancariaId, lancamentoId, observacoes });

    // 1. Verificar se a transação bancária existe e não está conciliada
    const { data: transacao, error: errorTransacao } = await supabase
      .from('transacoes_bancarias')
      .select('*')
      .eq('id', transacaoBancariaId)
      .single();

    if (errorTransacao || !transacao) {
      console.error('❌ Transação bancária não encontrada:', errorTransacao);
      return NextResponse.json(
        { error: 'Transação bancária não encontrada' },
        { status: 404 }
      );
    }

    if (transacao.lancamento_id) {
      console.log('❌ Transação bancária já conciliada');
      return NextResponse.json(
        { error: 'Transação bancária já está conciliada' },
        { status: 400 }
      );
    }

    // 2. Verificar se o lançamento existe e está pendente
    const { data: lancamento, error: errorLancamento } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('id', lancamentoId)
      .single();

    if (errorLancamento || !lancamento) {
      console.error('❌ Lançamento não encontrado:', errorLancamento);
      return NextResponse.json(
        { error: 'Lançamento não encontrado' },
        { status: 404 }
      );
    }

    if (lancamento.status !== 'pendente') {
      console.log('❌ Lançamento não está pendente');
      return NextResponse.json(
        { error: 'Lançamento não está pendente para conciliação' },
        { status: 400 }
      );
    }

    // 3. Iniciar transação no banco
    const { data: transacaoResult, error: errorTransacaoResult } = await supabase.rpc('confirmar_pareamento', {
      p_transacao_bancaria_id: transacaoBancariaId,
      p_lancamento_id: lancamentoId,
      p_observacoes: observacoes || null
    });

    if (errorTransacaoResult) {
      console.error('❌ Erro ao confirmar pareamento:', errorTransacaoResult);
      
      // Fallback: tentar atualização manual se a function não existir
      try {
        // Atualizar transação bancária
        const { error: errorUpdateTransacao } = await supabase
          .from('transacoes_bancarias')
          .update({ 
            lancamento_id: lancamentoId,
            data_conciliacao: new Date().toISOString()
          })
          .eq('id', transacaoBancariaId);

        if (errorUpdateTransacao) {
          throw errorUpdateTransacao;
        }

        // Atualizar lançamento
        const { error: errorUpdateLancamento } = await supabase
          .from('lancamentos')
          .update({ 
            status: 'conciliado',
            data_conciliacao: new Date().toISOString(),
            observacoes_conciliacao: observacoes || null
          })
          .eq('id', lancamentoId);

        if (errorUpdateLancamento) {
          // Reverter atualização da transação bancária
          await supabase
            .from('transacoes_bancarias')
            .update({ 
              lancamento_id: null,
              data_conciliacao: null
            })
            .eq('id', transacaoBancariaId);
          
          throw errorUpdateLancamento;
        }

        console.log('✅ Pareamento confirmado via atualização manual');

      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
        return NextResponse.json(
          { error: 'Erro ao confirmar pareamento' },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ Pareamento confirmado via stored procedure');
    }

    // 4. Buscar dados atualizados para retorno
    const { data: transacaoAtualizada, error: errorBuscarTransacao } = await supabase
      .from('transacoes_bancarias')
      .select(`
        *,
        conta_bancaria:conta_bancaria_id(nome, banco),
        lancamento:lancamento_id(
          *,
          plano_contas:plano_conta_id(nome),
          centro_custos:centro_custo_id(nome)
        )
      `)
      .eq('id', transacaoBancariaId)
      .single();

    if (errorBuscarTransacao) {
      console.warn('⚠️ Erro ao buscar dados atualizados:', errorBuscarTransacao);
    }

    console.log('✅ Pareamento confirmado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Pareamento confirmado com sucesso',
      data: {
        transacaoBancariaId,
        lancamentoId,
        dataConciliacao: new Date().toISOString(),
        observacoes,
        transacao: transacaoAtualizada || null
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na API de confirmação de pareamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🚀 DELETE /api/conciliacao/confirmar-pareamento iniciado');
    
    const { searchParams } = new URL(request.url);
    const transacaoBancariaId = searchParams.get('transacaoBancariaId');

    if (!transacaoBancariaId) {
      console.log('❌ ID da transação bancária não fornecido');
      return NextResponse.json(
        { error: 'ID da transação bancária é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📊 Desfazendo pareamento:', { transacaoBancariaId });

    // 1. Buscar transação bancária conciliada
    const { data: transacao, error: errorTransacao } = await supabase
      .from('transacoes_bancarias')
      .select('*, lancamento_id')
      .eq('id', transacaoBancariaId)
      .single();

    if (errorTransacao || !transacao) {
      console.error('❌ Transação bancária não encontrada:', errorTransacao);
      return NextResponse.json(
        { error: 'Transação bancária não encontrada' },
        { status: 404 }
      );
    }

    if (!transacao.lancamento_id) {
      console.log('❌ Transação bancária não está conciliada');
      return NextResponse.json(
        { error: 'Transação bancária não está conciliada' },
        { status: 400 }
      );
    }

    const lancamentoId = transacao.lancamento_id;

    // 2. Desfazer conciliação
    const { error: errorUpdateTransacao } = await supabase
      .from('transacoes_bancarias')
      .update({ 
        lancamento_id: null,
        data_conciliacao: null
      })
      .eq('id', transacaoBancariaId);

    if (errorUpdateTransacao) {
      console.error('❌ Erro ao atualizar transação bancária:', errorUpdateTransacao);
      return NextResponse.json(
        { error: 'Erro ao desfazer conciliação da transação bancária' },
        { status: 500 }
      );
    }

    // 3. Atualizar lançamento para pendente
    const { error: errorUpdateLancamento } = await supabase
      .from('lancamentos')
      .update({ 
        status: 'pendente',
        data_conciliacao: null,
        observacoes_conciliacao: null
      })
      .eq('id', lancamentoId);

    if (errorUpdateLancamento) {
      console.error('❌ Erro ao atualizar lançamento:', errorUpdateLancamento);
      
      // Reverter atualização da transação bancária
      await supabase
        .from('transacoes_bancarias')
        .update({ 
          lancamento_id: lancamentoId,
          data_conciliacao: transacao.data_conciliacao
        })
        .eq('id', transacaoBancariaId);

      return NextResponse.json(
        { error: 'Erro ao desfazer conciliação do lançamento' },
        { status: 500 }
      );
    }

    console.log('✅ Pareamento desfeito com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Pareamento desfeito com sucesso',
      data: {
        transacaoBancariaId,
        lancamentoId,
        dataDesconciliacao: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na API de desfazer pareamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
