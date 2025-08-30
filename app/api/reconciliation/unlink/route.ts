import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 POST /api/reconciliation/unlink iniciado - v3');
    
    const body = await request.json();
    const { bank_transaction_id } = body;

    if (!bank_transaction_id) {
      return NextResponse.json(
        { error: 'bank_transaction_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📊 Desconciliando transação:', { bank_transaction_id });

    // Buscar dados da transação para obter o matched_lancamento_id e detectar transfers
    const { data: bankTransaction, error: fetchError } = await supabase
      .from('bank_transactions')
      .select('matched_lancamento_id, memo, payee, transaction_type')
      .eq('id', bank_transaction_id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar transação bancária:', fetchError);
      return NextResponse.json(
        { error: 'Transação bancária não encontrada' },
        { status: 404 }
      );
    }

    // Detectar se é uma transferência para definir o status correto
    const isOFXTransfer = bankTransaction.memo?.toUpperCase().includes('TRANSFER') || 
                         bankTransaction.payee?.toUpperCase().includes('TRANSFER') ||
                         bankTransaction.transaction_type === 'TRANSFER';
    
    // Para transferências, vamos usar 'pending' mas guardar a informação que é transferência
    const newStatus = 'pending';

    console.log('📊 Dados da desconciliação:', { 
      bank_transaction_id,
      is_transfer: isOFXTransfer,
      new_status: newStatus,
      memo: bankTransaction.memo,
      payee: bankTransaction.payee,
      transaction_type: bankTransaction.transaction_type
    });

    // Atualizar status da transação bancária
    const { error: bankUpdateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: newStatus,
        reconciled_at: null,
        matched_lancamento_id: null,
        match_confidence: null,
        match_type: null,
        match_criteria: null
      })
      .eq('id', bank_transaction_id);

    if (bankUpdateError) {
      console.error('❌ Erro ao atualizar transação bancária:', bankUpdateError);
      return NextResponse.json(
        { error: 'Erro ao desconciliar transação bancária' },
        { status: 500 }
      );
    }

    // Se havia lançamento do sistema associado, desconciliar também
    if (bankTransaction.matched_lancamento_id) {
      // Buscar dados do lançamento para detectar se é transferência
      const { data: systemTransaction } = await supabase
        .from('lancamentos')
        .select('tipo, descricao')
        .eq('id', bankTransaction.matched_lancamento_id)
        .single();

      const isSystemTransfer = systemTransaction?.tipo === 'transferencia' ||
                               systemTransaction?.descricao?.toUpperCase().includes('TRANSFER');

      const { error: systemUpdateError } = await supabase
        .from('lancamentos')
        .update({ 
          reconciled: false,
          reconciled_at: null,
          bank_transaction_id: null
        })
        .eq('id', bankTransaction.matched_lancamento_id);

      if (systemUpdateError) {
        console.error('❌ Erro ao desconciliar lançamento do sistema:', systemUpdateError);
        // Não retorna erro pois a transação bancária já foi atualizada
      }

      console.log('✅ Lançamento desconciliado:', {
        matched_lancamento_id: bankTransaction.matched_lancamento_id,
        is_transfer: isSystemTransfer
      });
    }

    console.log('✅ Desconciliação realizada com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Transação desconciliada com sucesso',
      bank_transaction_id,
      unlinked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na API de desconciliação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
